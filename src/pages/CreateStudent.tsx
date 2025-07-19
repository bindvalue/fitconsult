import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, UserPlus, AlertTriangle } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function CreateStudent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showEmailExistsDialog, setShowEmailExistsDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    height: '',
    weight: '',
    phone: '',
    emergency_contact: '',
    emergency_phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Security improvement: Enhanced input validation
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: 'Dados inválidos',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Security improvement: Sanitize input data
      const sanitizedData = {
        name: formData.name.trim().replace(/[<>]/g, ''), // Remove potential XSS chars
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        age: parseInt(formData.age) || null,
        height: parseFloat(formData.height) || null,
        weight: parseFloat(formData.weight) || null,
        phone: formData.phone.replace(/\D/g, ''), // Only numbers
        emergency_contact: formData.emergency_contact.trim().replace(/[<>]/g, ''),
        emergency_phone: formData.emergency_phone.replace(/\D/g, '')
      };

      // Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: sanitizedData.password,
        options: {
          data: {
            name: sanitizedData.name,
            role: 'student',
            age: sanitizedData.age,
            height: sanitizedData.height,
            weight: sanitizedData.weight,
            phone: sanitizedData.phone,
            emergency_contact: sanitizedData.emergency_contact,
            emergency_phone: sanitizedData.emergency_phone
          }
        }
      });

      if (authError) throw authError;

      toast({
        title: 'Aluno cadastrado com sucesso!',
        description: 'O aluno foi criado e receberá um e-mail de confirmação.'
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao criar aluno:', error);
      
      // Verificar se é erro de email já existente
      if (error.message?.includes('User already registered') || 
          error.message?.includes('already registered') ||
          error.code === 'email_address_invalid' ||
          error.status === 422) {
        setShowEmailExistsDialog(true);
      } else {
        // Security improvement: Sanitize error messages
        const sanitizedMessage = error.message?.replace(/[<>]/g, '') || 'Ocorreu um erro inesperado';
        toast({
          title: 'Erro ao cadastrar aluno',
          description: sanitizedMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Security improvement: Comprehensive form validation
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name.trim() || formData.name.length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.push('E-mail inválido');
    }

    if (formData.password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
    }

    if (formData.age && (parseInt(formData.age) < 10 || parseInt(formData.age) > 120)) {
      errors.push('Idade deve estar entre 10 e 120 anos');
    }

    if (formData.height && (parseFloat(formData.height) < 1.0 || parseFloat(formData.height) > 2.5)) {
      errors.push('Altura deve estar entre 1.0 e 2.5 metros');
    }

    if (formData.weight && (parseFloat(formData.weight) < 30 || parseFloat(formData.weight) > 300)) {
      errors.push('Peso deve estar entre 30 e 300 kg');
    }

    return errors;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Cadastrar Novo Aluno</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Dados do Aluno
          </CardTitle>
          <CardDescription>
            Preencha as informações básicas do novo aluno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha Temporária *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                placeholder="O aluno poderá alterar posteriormente"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  placeholder="Anos"
                />
              </div>
              <div>
                <Label htmlFor="height">Altura</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.01"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  placeholder="1.75"
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  placeholder="70.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                <Input
                  id="emergency_contact"
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => handleChange('emergency_contact', e.target.value)}
                  placeholder="Nome do contato"
                />
              </div>
              <div>
                <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
                <Input
                  id="emergency_phone"
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => handleChange('emergency_phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Cadastrando...' : 'Cadastrar Aluno'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog para email já cadastrado */}
      <AlertDialog open={showEmailExistsDialog} onOpenChange={setShowEmailExistsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              E-mail já cadastrado
            </AlertDialogTitle>
            <AlertDialogDescription>
              O e-mail <strong>{formData.email}</strong> já está cadastrado no sistema. 
              Cada aluno deve ter um e-mail único. Por favor, utilize um e-mail diferente 
              ou verifique se este aluno já não está cadastrado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowEmailExistsDialog(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </div>
  );
}
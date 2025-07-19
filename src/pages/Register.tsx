import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Lock, Phone, Calendar, Scale, Ruler, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import strikingLogo from "@/assets/Logo-Striking-Borda.png";
import { Footer } from '@/components/Footer';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { validateInput } from '@/lib/security';

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedPlan = searchParams.get('plan') || 'basic';
  const { signUp, isAuthenticated, loading, resendConfirmation } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    age: '',
    weight: '',
    height: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/student-dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!validateInput.email(formData.email)) {
      toast({
        title: 'Erro no cadastro',
        description: 'Email inválido.',
        variant: 'destructive'
      });
      return;
    }

    if (!validateInput.name(formData.name)) {
      toast({
        title: 'Erro no cadastro',
        description: 'Nome deve ter entre 2 e 100 caracteres e conter apenas letras.',
        variant: 'destructive'
      });
      return;
    }

    if (!validateInput.password(formData.password)) {
      toast({
        title: 'Erro no cadastro',
        description: 'Senha não atende aos critérios de segurança.',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro no cadastro',
        description: 'As senhas não coincidem.',
        variant: 'destructive'
      });
      return;
    }

    if (formData.phone && !validateInput.phone(formData.phone)) {
      toast({
        title: 'Erro no cadastro',
        description: 'Telefone inválido.',
        variant: 'destructive'
      });
      return;
    }

    if (formData.emergencyPhone && !validateInput.phone(formData.emergencyPhone)) {
      toast({
        title: 'Erro no cadastro',
        description: 'Telefone de emergência inválido.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = {
        role: 'student',
        name: validateInput.sanitizeString(formData.name),
        age: formData.age,
        height: formData.height,
        weight: formData.weight,
        phone: formData.phone,
        emergency_contact: formData.emergencyContact ? validateInput.sanitizeString(formData.emergencyContact) : '',
        emergency_phone: formData.emergencyPhone,
        plan: selectedPlan
      };

      const { error } = await signUp(formData.email, formData.password, userData);
      
      if (error) {
        toast({
          title: 'Erro no cadastro',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setRegisteredEmail(formData.email);
        setShowEmailConfirmation(true);
        toast({
          title: 'Cadastro realizado com sucesso!',
          description: 'Verifique seu email para confirmar a conta.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro no cadastro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await resendConfirmation(registeredEmail);
      
      if (error) {
        toast({
          title: 'Erro ao reenviar confirmação',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Email de confirmação reenviado!',
          description: 'Verifique sua caixa de entrada e clique no link de confirmação.',
          variant: 'default'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao reenviar confirmação',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <img src={strikingLogo} alt="Striking Consult" className="h-8 w-auto" />
                <h1 className="text-3xl font-bold text-foreground">Striking Consult</h1>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Criar Conta de Aluno
              </h2>
              <p className="text-muted-foreground">
                Complete seu cadastro para começar sua jornada fitness
              </p>
              <Badge className="mt-2" variant={selectedPlan === 'premium' ? 'default' : 'secondary'}>
                Plano {selectedPlan === 'premium' ? 'Premium' : 'Básico'}
              </Badge>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Preencha seus dados para criar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Dados Básicos */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Dados Básicos</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Seu nome completo"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="age">Idade</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="age"
                            name="age"
                            type="number"
                            placeholder="Sua idade"
                            value={formData.age}
                            onChange={handleInputChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-4">
                        <PasswordStrengthIndicator password={formData.password} />
                      </div>
                    )}
                  </div>

                  {/* Dados Físicos */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Dados Físicos</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Peso (kg)</Label>
                        <div className="relative">
                          <Scale className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="weight"
                            name="weight"
                            type="number"
                            step="0.1"
                            placeholder="70.5"
                            value={formData.weight}
                            onChange={handleInputChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="height">Altura (cm)</Label>
                        <div className="relative">
                          <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="height"
                            name="height"
                            type="number"
                            placeholder="175"
                            value={formData.height}
                            onChange={handleInputChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contato de Emergência */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Contato de Emergência</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Nome do Contato</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="emergencyContact"
                            name="emergencyContact"
                            type="text"
                            placeholder="Nome do responsável"
                            value={formData.emergencyContact}
                            onChange={handleInputChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="emergencyPhone"
                            name="emergencyPhone"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            value={formData.emergencyPhone}
                            onChange={handleInputChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {showEmailConfirmation && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        <strong>Cadastro realizado com sucesso!</strong><br/>
                        Enviamos um email de confirmação para <strong>{registeredEmail}</strong>. 
                        Verifique sua caixa de entrada e clique no link para ativar sua conta.
                      </AlertDescription>
                    </Alert>
                  )}

                  {showEmailConfirmation && (
                    <div className="space-y-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full" 
                        onClick={handleResendConfirmation}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Reenviando...' : 'Reenviar Email de Confirmação'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="default" 
                        className="w-full" 
                        onClick={() => navigate('/login')}
                      >
                        Ir para Login
                      </Button>
                    </div>
                  )}

                  {!showEmailConfirmation && (
                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => navigate('/plans')} className="flex-1" disabled={isLoading}>
                        Voltar
                      </Button>
                      <Button type="submit" className="flex-1" disabled={isLoading}>
                        {isLoading ? 'Criando Conta...' : 'Criar Conta'}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Register;
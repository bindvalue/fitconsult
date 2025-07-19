import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';

const EmailConfirmation = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { resendConfirmation } = useAuth();
  const { toast } = useToast();

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, informe seu email.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await resendConfirmation(email);
      
      if (error) {
        toast({
          title: 'Erro ao reenviar confirmação',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setEmailSent(true);
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Confirmar Email
          </CardTitle>
          <CardDescription>
            Digite seu email para receber um novo link de confirmação
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {emailSent ? (
            <div className="text-center space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Email enviado com sucesso!</strong><br/>
                  Enviamos um novo email de confirmação para <strong>{email}</strong>. 
                  Verifique sua caixa de entrada e clique no link para ativar sua conta.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Não recebeu o email? Verifique:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sua caixa de spam ou lixo eletrônico</li>
                  <li>• Se o email está digitado corretamente</li>
                  <li>• Se sua caixa de entrada não está cheia</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEmailSent(false)}
                  className="flex-1"
                >
                  Tentar Novamente
                </Button>
                <Button 
                  onClick={() => navigate('/login')}
                  className="flex-1"
                >
                  Ir para Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResendConfirmation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Digite o mesmo email que você usou para se cadastrar. Enviaremos um novo link de confirmação.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/login')}
                  className="flex-1"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Enviar Email'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <Footer />
    </div>
  );
};

export default EmailConfirmation;
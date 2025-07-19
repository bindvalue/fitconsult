import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, User, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import strikingLogo from "@/assets/Logo-Striking-Borda.png";
import { Footer } from '@/components/Footer';
import { validateInput } from '@/lib/security';

const Login = () => {
  const [userType, setUserType] = useState<'professor' | 'student'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const { signIn, isAuthenticated, isProfessor, user, loading, session, resendConfirmation } = useAuth();
  const { toast } = useToast();

  // useEffect para redirecionar usuários já autenticados
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      if (user.type === 'professor') {
        navigate('/dashboard');
      } else if (user.type === 'admin') {
        navigate('/admin-professors');
      } else {
        navigate('/student-dashboard');
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

  // useEffect para redirecionar após login bem-sucedido
  useEffect(() => {
    if (shouldRedirect && isAuthenticated && user && !loading) {
      setShouldRedirect(false);
      setIsLoading(false);
      
      if (user.type === 'professor') {
        window.location.href = '/dashboard';
      } else if (user.type === 'admin') {
        window.location.href = '/admin-professors';
      } else {
        window.location.href = '/student-dashboard';
      }
    }
  }, [shouldRedirect, isAuthenticated, user, loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!validateInput.email(email)) {
      toast({
        title: 'Erro no login',
        description: 'Email inválido.',
        variant: 'destructive'
      });
      return;
    }

    if (!password || password.length < 8) {
      toast({
        title: 'Erro no login',
        description: 'Senha deve ter pelo menos 8 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        // Verificar se é erro de email não confirmado
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          setShowResendConfirmation(true);
          toast({
            title: 'Email não confirmado',
            description: 'Verifique sua caixa de entrada e confirme seu email antes de fazer login.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Erro no login',
            description: error.message,
            variant: 'destructive'
          });
        }
        setIsLoading(false);
      } else {
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Redirecionando...'
        });
        
        // Marcar que devemos redirecionar quando o estado do usuário estiver pronto
        setShouldRedirect(true);
        
        // Timeout de segurança: se não redirecionar em 5 segundos, force o redirecionamento
        setTimeout(() => {
          setIsLoading(false);
          setShouldRedirect(false);
          
          // Usar dados da sessão como fallback
          if (session?.user?.user_metadata?.role === 'professor') {
            window.location.href = '/dashboard';
          } else if (session?.user?.user_metadata?.role === 'admin') {
            window.location.href = '/admin-professors';
          } else if (session?.user?.user_metadata?.role === 'student') {
            window.location.href = '/student-dashboard';
          } else {
            // Fallback final baseado no email
            if (email === 'luizfernandooffice@gmail.com') {
              window.location.href = '/dashboard';
            } else if (email === 'admin@bindvalue.dev') {
              window.location.href = '/admin-professors';
            } else {
              window.location.href = '/student-dashboard';
            }
          }
        }, 3000);
      }
    } catch (error) {
      toast({
        title: 'Erro no login',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, informe o email para reenviar a confirmação.',
        variant: 'destructive'
      });
      return;
    }

    setIsResending(true);
    
    try {
      const { error } = await resendConfirmation(email);
      
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
        setShowResendConfirmation(false);
      }
    } catch (error) {
      toast({
        title: 'Erro ao reenviar confirmação',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center justify-center space-y-2 mb-4">
              <img src={strikingLogo} alt="Striking Consult" className="h-12 w-auto" />
              <span className="text-2xl font-bold text-foreground">Striking Consult</span>
            </div>
            <CardDescription>
              Faça login em sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Home
              </Button>
            </div>
            <Tabs value={userType} onValueChange={(value) => setUserType(value as 'professor' | 'student')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Aluno
                </TabsTrigger>
                <TabsTrigger value="professor" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Professor
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleLogin} className="space-y-4">
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

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {showResendConfirmation && (
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      Seu email ainda não foi confirmado. Verifique sua caixa de entrada ou clique no botão abaixo para reenviar o email de confirmação.
                    </AlertDescription>
                  </Alert>
                )}

                {showResendConfirmation && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                  >
                    {isResending ? 'Reenviando...' : 'Reenviar Email de Confirmação'}
                  </Button>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Problemas com confirmação de email?
                </p>
                <Button 
                  variant="link" 
                  className="text-sm p-0 h-auto font-normal"
                  onClick={() => navigate('/email-confirmation')}
                >
                  Reenviar email de confirmação
                </Button>
              </div>

              <TabsContent value="student" className="mt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Primeira vez aqui?
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/plans')}>
                    Escolher Plano
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="professor" className="mt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Não tem conta?
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/professor-register')}>
                    Cadastrar-se como Professor
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
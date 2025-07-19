import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, XCircle, HelpCircle, CheckCircle } from 'lucide-react';
import { Footer } from '@/components/Footer';
import strikingLogo from "@/assets/Logo-Striking-Borda.png";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AccountStatus() {
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Refresh user data when component mounts
  useEffect(() => {
    if (refreshUser) {
      refreshUser();
    }
  }, [refreshUser]);

  // Auto-refresh user status every 30 seconds for pending accounts
  useEffect(() => {
    const interval = setInterval(() => {
      if (refreshUser && user?.status === 'pending') {
        refreshUser();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshUser, user?.status]);

  // Redirect active users to appropriate dashboard
  useEffect(() => {
    if (user?.status === 'active') {
      const dashboardPath = user.type === 'student' ? '/student-dashboard' : '/dashboard';
      navigate(dashboardPath);
    }
  }, [user, navigate]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          title: 'Conta Aguardando Aprovação',
          description: 'Sua conta foi criada com sucesso e está aguardando aprovação de um professor.',
          message: 'Você receberá um email quando sua conta for ativada. Após a aprovação, você poderá acessar todos os recursos da plataforma.',
          color: 'text-yellow-600',
          badgeVariant: 'secondary' as const,
          badgeText: 'Pendente'
        };
      case 'active':
        return {
          icon: CheckCircle,
          title: 'Conta Ativa',
          description: 'Sua conta está ativa e funcionando normalmente.',
          message: 'Você tem acesso a todos os recursos da plataforma.',
          color: 'text-green-600',
          badgeVariant: 'default' as const,
          badgeText: 'Ativa'
        };
      case 'blocked':
        return {
          icon: XCircle,
          title: 'Conta Bloqueada',
          description: 'Sua conta foi bloqueada por um administrador.',
          message: 'Entre em contato com um professor para mais informações sobre o bloqueio da sua conta.',
          color: 'text-red-600',
          badgeVariant: 'destructive' as const,
          badgeText: 'Bloqueada'
        };
      case 'expired':
        return {
          icon: AlertTriangle,
          title: 'Conta Expirada',
          description: 'Sua conta expirou e precisa ser renovada.',
          message: 'Entre em contato com um professor para renovar sua conta e continuar acessando a plataforma.',
          color: 'text-orange-600',
          badgeVariant: 'destructive' as const,
          badgeText: 'Expirada'
        };
      default:
        return {
          icon: HelpCircle,
          title: 'Status da Conta',
          description: 'Há um problema com o status da sua conta.',
          message: 'Entre em contato com um professor para resolver esta situação.',
          color: 'text-gray-600',
          badgeVariant: 'secondary' as const,
          badgeText: 'Indefinido'
        };
    }
  };

  const statusConfig = getStatusConfig(user?.status || 'unknown');
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src={strikingLogo} 
                alt="Striking Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-primary">Striking</span>
            </div>
            <Button variant="outline" onClick={() => signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <StatusIcon className={`h-16 w-16 ${statusConfig.color}`} />
              </div>
              <CardTitle className="text-2xl mb-2">
                {statusConfig.title}
              </CardTitle>
              <Badge variant={statusConfig.badgeVariant} className="mb-4">
                {statusConfig.badgeText}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-lg text-muted-foreground mb-4">
                  {statusConfig.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {statusConfig.message}
                </p>
              </div>

              {user && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm">Informações da Conta</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium">Nome:</span> {user.name}</p>
                    <p><span className="font-medium">Email:</span> {user.email}</p>
                    <p><span className="font-medium">Tipo:</span> {user.type === 'student' ? 'Estudante' : 'Professor'}</p>
                    <p><span className="font-medium">Status:</span> {statusConfig.badgeText}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4">
                  <h3 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                    O que fazer agora?
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Aguarde o contato de um professor</li>
                    <li>• Verifique seu email regularmente</li>
                    <li>• Entre em contato com a administração se necessário</li>
                  </ul>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950/50 rounded-lg p-4">
                  <h3 className="font-semibold text-sm mb-2 text-orange-900 dark:text-orange-100">
                    ℹ️ Informações sobre Planos
                  </h3>
                  <div className="text-sm text-orange-800 dark:text-orange-200 space-y-2">
                    <p>
                      <strong>Importante:</strong> O plano selecionado durante seu cadastro será ativado pelo professor no momento da aprovação da sua conta.
                    </p>
                    <p>
                      Como os pagamentos são processados externamente, apenas professores podem ativar e gerenciar as assinaturas dos planos.
                    </p>
                    <p>
                      Seu plano será ativado assim que o professor confirmar o pagamento e aprovar sua conta.
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => refreshUser && refreshUser()}
                    className="mr-4"
                  >
                    Verificar Status
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => signOut()}
                  >
                    Sair da Conta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
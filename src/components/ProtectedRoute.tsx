import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  userType?: 'professor' | 'student' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  userType 
}) => {
  const { isAuthenticated, user, loading, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        navigate('/login');
        return;
      }

      // Se tem sessão mas ainda não tem dados do usuário, aguardar um pouco mais
      if (requireAuth && isAuthenticated && !user) {
        return; // Aguarda o user ser carregado
      }

      // Verificar se a conta está ativa (apenas para estudantes)
      if (user && user.type === 'student' && user.status !== 'active') {
        navigate('/account-status');
        return;
      }

      // Só verifica o tipo do usuário se realmente tiver um usuário carregado
      if (userType && user && user.type !== userType) {
        // Adicionar um pequeno delay para evitar redirecionamento duplo
        setTimeout(() => {
          // Redirecionar para o dashboard correto baseado no tipo de usuário
          if (user.type === 'professor') {
            navigate('/dashboard');
          } else if (user.type === 'admin') {
            navigate('/admin-professors');
          } else {
            navigate('/student-dashboard');
          }
        }, 100);
        return;
      }
    }
  }, [isAuthenticated, user, loading, navigate, requireAuth, userType, session]);

  // Security fix: Remover timeout agressivo que estava causando redirecionamentos indevidos
  // O useAuth já tem sua própria lógica de timeout de sessão

  // Mostrar loading se estiver carregando OU se tem sessão mas não tem dados do usuário
  if (loading || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Só verifica o tipo se userType for especificado E o usuário estiver carregado
  if (userType && user && user.type !== userType) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
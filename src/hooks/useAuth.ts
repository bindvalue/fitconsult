import { useState, useEffect } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserType = 'professor' | 'student' | 'admin' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  avatar_url?: string;
  status: 'pending' | 'active' | 'blocked' | 'expired';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);

  const cleanupAuthState = () => {
    // Limpar todas as chaves relacionadas ao auth
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpar sessionStorage se existir
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    
    // Limpar chaves específicas da aplicação
    localStorage.removeItem('user');
  };

  // Security improvement: Add session timeout handling (mais longo para evitar logout prematuro)
  useEffect(() => {
    if (session) {
      const sessionTimeout = setTimeout(() => {
        // Fazer logout silencioso após timeout
        cleanupAuthState();
        window.location.href = '/login';
      }, 8 * 60 * 60 * 1000); // 8 horas ao invés de 24 para ser mais seguro mas não muito agressivo

      return () => clearTimeout(sessionTimeout);
    }
  }, [session]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Reset failed attempts on successful auth
          setFailedLoginAttempts(0);
          // Fetch user data with setTimeout to prevent deadlocks
          setTimeout(async () => {
            await fetchUserData(session.user.id);
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (userData && !error) {
        // Buscar avatar_url do perfil específico
        let avatarUrl = '';
        try {
          const profileTable = userData.role === 'professor' ? 'professor_profiles' : 'student_profiles';
          const { data: profileData } = await supabase
            .from(profileTable)
            .select('avatar_url')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (profileData && (profileData as any).avatar_url) {
            avatarUrl = (profileData as any).avatar_url;
          }
        } catch (profileError) {
          // Continuar sem avatar se houver erro
        }

        const userObj = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          type: userData.role as UserType,
          avatar_url: avatarUrl,
          status: userData.status as 'pending' | 'active' | 'blocked' | 'expired'
        };
        setUser(userObj);
      } else {
        // Fallback: usar dados da sessão se a consulta falhar
        const session = await supabase.auth.getSession();
        if (session.data.session?.user?.user_metadata) {
          const metadata = session.data.session.user.user_metadata;
          const fallbackUser = {
            id: userId,
            name: metadata.name || metadata.email || 'Usuário',
            email: metadata.email,
            type: metadata.role as UserType,
            status: 'pending' as const
          };
          setUser(fallbackUser);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      setUser(null);
    }
  };

  const updateUserAvatar = async (avatarUrl: string) => {
    if (user) {
      setUser({ ...user, avatar_url: avatarUrl });
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserData(session.user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Enhanced input validation
    if (!email || !password) {
      return { error: { message: 'Email e senha são obrigatórios.' } };
    }

    if (!email.includes('@') || email.length < 5) {
      return { error: { message: 'Email inválido.' } };
    }

    if (password.length < 8) {
      return { error: { message: 'Senha deve ter pelo menos 8 caracteres.' } };
    }

    // Enhanced rate limiting and security
    try {
      // Log rate limiting attempt
      await supabase.from('rate_limit_log').insert({
        user_id: null,
        action_type: 'login_attempt',
        ip_address: null,
        success: false
      });
    } catch (error) {
      // Continue even if rate limiting fails
    }

    // Security improvement: Implement account lockout after failed attempts
    if (failedLoginAttempts >= 5) {
      return { 
        error: { 
          message: 'Conta temporariamente bloqueada devido a múltiplas tentativas de login. Tente novamente em 30 minutos.' 
        } 
      };
    }

    // Limpar estado de autenticação antes de fazer login
    cleanupAuthState();
    
    // Tentar logout global antes de fazer login
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Ignorar erros de logout, continuar com login
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    });

    if (error) {
      setFailedLoginAttempts(prev => prev + 1);
      // Reset attempts after 30 minutes
      setTimeout(() => setFailedLoginAttempts(0), 30 * 60 * 1000);
      
      // Enhanced error messages - don't reveal too much
      if (error.message.includes('Invalid login credentials')) {
        return { error: { message: 'Email ou senha incorretos.' } };
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: { message: 'Confirme seu email antes de fazer login.' } };
      }
      return { error: { message: 'Erro ao fazer login. Tente novamente.' } };
    }

    // Log successful login
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('rate_limit_log').insert({
        user_id: user?.id,
        action_type: 'login_success',
        ip_address: null,
        success: true
      });
    } catch (error) {
      // Continue even if logging fails
    }

    // Após login bem-sucedido, verificar o status da conta
    const { data: userData } = await supabase
      .from('users')
      .select('status')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();

    if (userData?.status === 'pending') {
      await signOut();
      return { 
        error: { 
          message: 'Sua conta está aguardando aprovação. Entre em contato com um professor para ativá-la.' 
        } 
      };
    }

    if (userData?.status === 'blocked') {
      await signOut();
      return { 
        error: { 
          message: 'Sua conta foi bloqueada. Entre em contato com um professor.' 
        } 
      };
    }

    if (userData?.status === 'expired') {
      await signOut();
      return { 
        error: { 
          message: 'Sua conta expirou. Entre em contato com um professor para renovar.' 
        } 
      };
    }

    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    // Enhanced input validation
    if (!email || !password) {
      return { error: { message: 'Email e senha são obrigatórios.' } };
    }

    if (!email.includes('@') || email.length < 5) {
      return { error: { message: 'Email inválido.' } };
    }

    // Enhanced password validation
    if (password.length < 12) {
      return { error: { message: 'Senha deve ter pelo menos 12 caracteres.' } };
    }

    if (!/[A-Z]/.test(password)) {
      return { error: { message: 'Senha deve conter pelo menos uma letra maiúscula.' } };
    }

    if (!/[a-z]/.test(password)) {
      return { error: { message: 'Senha deve conter pelo menos uma letra minúscula.' } };
    }

    if (!/[0-9]/.test(password)) {
      return { error: { message: 'Senha deve conter pelo menos um número.' } };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { error: { message: 'Senha deve conter pelo menos um caractere especial.' } };
    }

    // Validate user data
    if (userData.name && userData.name.length < 2) {
      return { error: { message: 'Nome deve ter pelo menos 2 caracteres.' } };
    }

    try {
      // Log rate limiting attempt
      await supabase.from('rate_limit_log').insert({
        user_id: null,
        action_type: 'signup_attempt',
        ip_address: null,
        success: false
      });
    } catch (error) {
      // Continue even if rate limiting fails
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          ...userData,
          name: userData.name?.trim()
        }
      }
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        return { error: { message: 'Este email já está registrado.' } };
      }
      if (error.message.includes('Password should be at least')) {
        return { error: { message: 'Senha não atende aos critérios de segurança.' } };
      }
      return { error: { message: 'Erro ao criar conta. Tente novamente.' } };
    }

    // Log successful signup
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('rate_limit_log').insert({
        user_id: user?.id,
        action_type: 'signup_success',
        ip_address: null,
        success: true
      });
    } catch (error) {
      // Continue even if logging fails
    }

    return { error };
  };


  const signOut = async () => {
    try {
      // Limpar estado local primeiro
      setUser(null);
      setSession(null);
      setLoading(false);
      
      // Limpar estado de autenticação
      cleanupAuthState();
      
      // Tentar fazer logout global no Supabase
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        // Continuar mesmo se o logout falhar
      }
      
      // Forçar reload da página para garantir estado limpo
      window.location.href = '/login';
      
      return { error: null };
    } catch (error: any) {
      // Mesmo com erro, tentar limpar estado e redirecionar
      cleanupAuthState();
      window.location.href = '/login';
      
      return { error };
    }
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resendConfirmation,
    updateUserAvatar,
    refreshUser,
    isAuthenticated: !!session, // Baseado apenas na sessão para mais confiabilidade
    isProfessor: user?.type === 'professor',
    isStudent: user?.type === 'student'
  };
};
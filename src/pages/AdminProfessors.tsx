import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, User, Calendar, Award, Clock } from 'lucide-react';

interface PendingProfessor {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
  cref: string;
  specialization: string;
  experience_years: number;
  bio: string;
}

const AdminProfessors: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [professors, setProfessors] = useState<PendingProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    console.log('AdminProfessors: User data:', { user, type: user?.type });
    if (user?.type === 'admin') {
      console.log('AdminProfessors: User is admin, fetching pending professors...');
      fetchPendingProfessors();
    } else {
      console.log('AdminProfessors: User is not admin or user is null');
    }
  }, [user]);

  const fetchPendingProfessors = async () => {
    try {
      console.log('AdminProfessors: Starting fetchPendingProfessors...');
      setLoading(true);
      
      // Primeiro verificar se o usuário atual é realmente admin
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .maybeSingle();
        
      console.log('AdminProfessors: Current user check:', { currentUser, userError });
      
      if (userError || !currentUser || currentUser.role !== 'admin') {
        console.error('AdminProfessors: User is not admin or error checking user');
        toast({
          title: "Erro de Acesso",
          description: "Você não tem permissão para acessar esta função.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('AdminProfessors: User verified as admin, fetching pending professors directly...');
      
      // Buscar professores pendentes diretamente sem usar a função RPC
      const { data: pendingUsers, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          status,
          created_at
        `)
        .eq('role', 'professor')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (usersError) {
        console.error('AdminProfessors: Error fetching users:', usersError);
        throw usersError;
      }
      
      console.log('AdminProfessors: Found pending users:', pendingUsers);
      
      // Buscar os perfis dos professores
      const professorIds = pendingUsers?.map(u => u.id) || [];
      
      if (professorIds.length === 0) {
        setProfessors([]);
        return;
      }
      
      const { data: profiles, error: profilesError } = await supabase
        .from('professor_profiles')
        .select('user_id, cref, specialization, experience_years, bio')
        .in('user_id', professorIds);
        
      console.log('AdminProfessors: Found profiles:', profiles);
      
      if (profilesError) {
        console.error('AdminProfessors: Error fetching profiles:', profilesError);
        // Continuar mesmo se houver erro nos perfis
      }
      
      // Combinar dados dos usuários com os perfis
      const combined = pendingUsers?.map(user => {
        const profile = profiles?.find(p => p.user_id === user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          created_at: user.created_at,
          cref: profile?.cref || '',
          specialization: profile?.specialization || '',
          experience_years: profile?.experience_years || 0,
          bio: profile?.bio || ''
        };
      }) || [];
      
      console.log('AdminProfessors: Combined data:', combined);
      setProfessors(combined);
      
    } catch (error) {
      console.error('AdminProfessors: Error in fetchPendingProfessors:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (professorId: string) => {
    try {
      setProcessing(professorId);
      const { data, error } = await supabase.rpc('approve_professor', {
        professor_user_id: professorId
      });

      if (error) {
        console.error('Error approving professor:', error);
        toast({
          title: "Erro",
          description: "Não foi possível aprovar o professor.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Professor Aprovado!",
        description: "O professor foi aprovado com sucesso.",
        variant: "default"
      });

      // Remover da lista local
      setProfessors(prev => prev.filter(p => p.id !== professorId));
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao aprovar professor.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (professorId: string) => {
    try {
      setProcessing(professorId);
      const { data, error } = await supabase.rpc('reject_professor', {
        professor_user_id: professorId
      });

      if (error) {
        console.error('Error rejecting professor:', error);
        toast({
          title: "Erro",
          description: "Não foi possível rejeitar o professor.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Professor Rejeitado",
        description: "O professor foi rejeitado.",
        variant: "default"
      });

      // Remover da lista local
      setProfessors(prev => prev.filter(p => p.id !== professorId));
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao rejeitar professor.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  if (user?.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-2">Acesso Negado</h1>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar esta página.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Aprovação de Professores</h1>
          <p className="text-muted-foreground">
            Gerencie os professores que solicitaram cadastro na plataforma
          </p>
          <div className="mt-4 flex space-x-2">
            <Button 
              onClick={() => window.location.href = '/system-diagnostics'}
              variant="outline"
            >
              Diagnóstico do Sistema
            </Button>
          </div>
        </div>

        {professors.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Nenhuma solicitação pendente</h2>
                <p className="text-muted-foreground">
                  Não há professores aguardando aprovação no momento.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {professors.map((professor) => (
              <Card key={professor.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <User className="w-8 h-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{professor.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{professor.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Pendente</span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">CREF:</span>
                        <span className="text-sm">{professor.cref || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Experiência:</span>
                        <span className="text-sm">{professor.experience_years} anos</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Especialização:</span>
                        <span className="text-sm">{professor.specialization || 'Não informado'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Solicitação:</span>
                        <span className="text-sm">
                          {new Date(professor.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {professor.bio && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-2">Biografia:</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {professor.bio}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => handleApprove(professor.id)}
                      disabled={processing === professor.id}
                      className="flex-1"
                      variant="default"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {processing === professor.id ? 'Aprovando...' : 'Aprovar'}
                    </Button>
                    
                    <Button 
                      onClick={() => handleReject(professor.id)}
                      disabled={processing === professor.id}
                      className="flex-1"
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {processing === professor.id ? 'Rejeitando...' : 'Rejeitar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfessors;
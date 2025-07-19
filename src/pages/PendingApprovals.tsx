import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CheckCircle, XCircle, Clock, User, Phone, Mail, Calendar } from 'lucide-react';

interface PendingAccount {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
  age?: number;
  phone?: string;
  emergency_contact?: string;
  selected_plan?: string;
}

export default function PendingApprovals() {
  const { user, isProfessor, loading: authLoading } = useAuth();
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isProfessor) {
      fetchPendingAccounts();
    }
  }, [isProfessor]);

  const fetchPendingAccounts = async () => {
    try {
      // Use the secure function instead of direct table query
      // This ensures proper permission checks and avoids security issues
      const { data, error } = await supabase.rpc('list_pending_student_accounts');

      if (error) {
        console.error('Error fetching pending accounts:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar contas pendentes.",
          variant: "destructive"
        });
        return;
      }

      // Transform the data to match the expected format
      const transformedData = data?.map(account => ({
        id: account.id,
        email: account.email,
        name: account.name,
        status: account.status,
        created_at: account.created_at,
        age: account.age,
        phone: account.phone,
        emergency_contact: account.emergency_contact,
        selected_plan: 'basic' // Default plan since it's not returned by the function
      })) || [];

      setPendingAccounts(transformedData);
    } catch (error) {
      console.error('Error fetching pending accounts:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar contas pendentes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAccount = async (accountId: string) => {
    setProcessingId(accountId);
    try {
      const { error } = await supabase.rpc('activate_student_account', {
        student_user_id: accountId
      });

      if (error) {
        console.error('Error activating account:', error);
        toast({
          title: "Erro",
          description: "Erro ao ativar conta do estudante.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Conta do estudante ativada com sucesso!",
        variant: "default"
      });

      // Refresh the list
      fetchPendingAccounts();
    } catch (error) {
      console.error('Error activating account:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao ativar conta.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBlockAccount = async (accountId: string) => {
    setProcessingId(accountId);
    try {
      const { error } = await supabase.rpc('block_student_account', {
        student_user_id: accountId
      });

      if (error) {
        console.error('Error blocking account:', error);
        toast({
          title: "Erro",
          description: "Erro ao bloquear conta do estudante.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Conta bloqueada",
        description: "Conta do estudante foi bloqueada.",
        variant: "default"
      });

      // Refresh the list
      fetchPendingAccounts();
    } catch (error) {
      console.error('Error blocking account:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao bloquear conta.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mostrar loading enquanto verifica as permissões do usuário
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Só mostrar "Acesso negado" após confirmar que não é professor
  if (!isProfessor) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation 
          userType={user?.type && user.type !== 'admin' ? user.type : 'student'} 
          userName={user?.name || ''} 
          userEmail={user?.email || ''} 
        />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Apenas professores podem acessar esta página.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation 
        userType={user?.type && user.type !== 'admin' ? user.type : 'student'} 
        userName={user?.name || ''} 
        userEmail={user?.email || ''} 
      />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Aprovações Pendentes</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie as contas de estudantes aguardando aprovação
            </p>
          </div>
          <Button onClick={fetchPendingAccounts} variant="outline" disabled={loading}>
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando contas pendentes...</p>
          </div>
        ) : pendingAccounts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta pendente</h3>
              <p className="text-muted-foreground">
                Todas as contas de estudantes foram processadas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingAccounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {account.name}
                    </CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pendente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{account.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Criado em: {formatDate(account.created_at)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {account.age && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Idade: {account.age} anos</span>
                        </div>
                      )}
                      {account.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{account.phone}</span>
                        </div>
                      )}
                      {account.emergency_contact && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Contato de emergência: {account.emergency_contact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Plano selecionado:</span>
                      <Badge variant={account.selected_plan === 'premium' ? 'default' : 'secondary'}>
                        {account.selected_plan === 'premium' ? 'Premium' : 'Básico'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      O plano será ativado automaticamente após a aprovação da conta
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBlockAccount(account.id)}
                      disabled={processingId === account.id}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      {processingId === account.id ? 'Bloqueando...' : 'Bloquear'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleActivateAccount(account.id)}
                      disabled={processingId === account.id}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {processingId === account.id ? 'Ativando...' : 'Ativar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, XCircle, Database, User, Search } from 'lucide-react';

const SystemDiagnostics: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const checkUserRegistration = async () => {
    if (!testEmail) {
      toast({
        title: "Email requerido",
        description: "Digite um email para verificar o status do usuário.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('debug_user_registration', {
        user_email: testEmail
      });

      if (error) {
        console.error('Debug error:', error);
        toast({
          title: "Erro no diagnóstico",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setDiagnosticResults(data);
      
      toast({
        title: "Diagnóstico concluído",
        description: "Resultados carregados com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao executar o diagnóstico.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Audit logs error:', error);
        toast({
          title: "Erro ao carregar logs",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setAuditLogs(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar os logs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testSystemFunctions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('test_professor_registration');

      if (error) {
        console.error('Test error:', error);
        toast({
          title: "Erro no teste",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Teste do sistema",
        description: data || "Teste executado com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao testar o sistema.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderDiagnosticResult = (result: any) => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Status do Banco</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Auth.users:</span>
                <Badge variant={result.auth_user_exists ? "default" : "destructive"}>
                  {result.auth_user_exists ? "Existe" : "Não existe"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Public.users:</span>
                <Badge variant={result.public_user_exists ? "default" : "destructive"}>
                  {result.public_user_exists ? "Existe" : "Não existe"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Profile:</span>
                <Badge variant={result.profile_exists ? "default" : "secondary"}>
                  {result.profile_exists ? "Existe" : "Não existe"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>IDs do Usuário</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>ID Auth:</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {result.user_id_auth || 'N/A'}
                </p>
              </div>
              <div>
                <Label>ID Public:</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {result.user_id_public || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {result.user_data && (
          <Card>
            <CardHeader>
              <CardTitle>Dados do Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(result.user_data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Diagnóstico do Sistema</h1>
          <p className="text-muted-foreground">
            Ferramentas para diagnosticar problemas de cadastro de usuários
          </p>
        </div>

        <div className="grid gap-6">
          {/* Teste de Usuário Específico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Verificar Usuário Específico</span>
              </CardTitle>
              <CardDescription>
                Digite um email para verificar o status do usuário no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="testEmail">Email do Usuário</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={checkUserRegistration}
                    disabled={loading}
                  >
                    {loading ? 'Verificando...' : 'Verificar'}
                  </Button>
                </div>
              </div>
              
              {diagnosticResults && renderDiagnosticResult(diagnosticResults)}
            </CardContent>
          </Card>

          {/* Teste do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Teste do Sistema</span>
              </CardTitle>
              <CardDescription>
                Executar testes automáticos do sistema de cadastro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  onClick={testSystemFunctions}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Testando...' : 'Executar Teste'}
                </Button>
                <Button 
                  onClick={loadAuditLogs}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Carregando...' : 'Carregar Logs'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs de Auditoria */}
          {auditLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Logs de Auditoria</CardTitle>
                <CardDescription>
                  Últimos 20 registros de auditoria do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={log.action.includes('error') ? 'destructive' : 'default'}>
                            {log.action}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.table_name}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {log.new_values && (
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(log.new_values, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle>Instruções de Uso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Verificar Usuário:</strong> Digite um email para ver o status completo do usuário 
                    nas tabelas auth.users e public.users.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Teste do Sistema:</strong> Execute testes automáticos para verificar se as 
                    funções de cadastro estão funcionando corretamente.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Logs de Auditoria:</strong> Visualize os últimos registros de auditoria para 
                    identificar erros ou problemas no sistema.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemDiagnostics;
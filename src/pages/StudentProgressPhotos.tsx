import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProgressPhotos from '@/components/ProgressPhotos';
import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const StudentProgressPhotos = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.type === 'professor' && studentId) {
      fetchStudentData();
    }
  }, [user, studentId]);

  const fetchStudentData = async () => {
    try {
      const { data: student, error } = await supabase
        .from('student_profiles')
        .select(`
          *,
          users!inner (
            name,
            email
          ),
          subscriptions (
            plan_type,
            active
          )
        `)
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setStudentData(student);
    } catch (error: any) {
      console.error('Erro ao buscar dados do aluno:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive'
      });
      navigate('/students');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.type !== 'professor') {
    return <div className="flex items-center justify-center min-h-screen">Acesso negado</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!studentData) {
    return <div className="flex items-center justify-center min-h-screen">Aluno não encontrado</div>;
  }

  const planType = studentData.subscriptions?.[0]?.plan_type || 'basic';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation 
        userType="professor" 
        userName={user.name} 
        userEmail={user.email} 
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/students')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lista de Alunos
          </Button>
          
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-xl">{studentData.users?.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{studentData.users?.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={planType === 'premium' ? 'default' : 'secondary'}>
                    {planType === 'premium' ? 'Premium' : 'Básico'}
                  </Badge>
                  <Badge variant="outline">
                    {studentData.age} anos
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {studentData.weight && (
                  <div>
                    <span className="text-muted-foreground">Peso:</span>
                    <p className="font-medium">{studentData.weight} kg</p>
                  </div>
                )}
                {studentData.height && (
                  <div>
                    <span className="text-muted-foreground">Altura:</span>
                    <p className="font-medium">{studentData.height} cm</p>
                  </div>
                )}
                {studentData.phone && (
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>
                    <p className="font-medium">{studentData.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            {planType === 'premium' ? (
              <ProgressPhotos studentId={studentId} isStudentView={false} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Este aluno possui o plano básico. Fotos de progresso estão disponíveis apenas no plano Premium.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default StudentProgressPhotos;
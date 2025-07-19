import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  ArrowLeft,
  Search,
  Plus,
  Calendar,
  Mail,
  Phone,
  Heart,
  Dumbbell,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Target,
  Camera
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Footer } from '@/components/Footer';

const Students = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [professorProfile, setProfessorProfile] = useState<any>(null);

  useEffect(() => {
    if (user && user.type === 'professor') {
      fetchStudentsData();
    }
  }, [user]);

  const fetchStudentsData = async () => {
    try {
      // Buscar perfil do professor
      const { data: profile } = await supabase
        .from('professor_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      // Buscar todos os alunos - removendo inner join para evitar problemas com RLS
      const { data: studentsData, error: studentsError } = await supabase
        .from('student_profiles')
        .select('*');


      // Buscar informações dos usuários separadamente
      const userIds = studentsData?.map(s => s.user_id) || [];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);


      // Buscar planos de treino
      const { data: workoutPlans } = await supabase
        .from('workout_plans')
        .select(`
          *,
          student_profiles!inner (
            id
          )
        `)
        .eq('professor_id', profile?.id);

      // Buscar assinaturas
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*');

      // Buscar consultas
      const { data: consultations } = await supabase
        .from('consultations')
        .select('*')
        .eq('professor_id', profile?.id);

      // Combinar dados
      const studentsWithData = (studentsData || []).map(student => {
        const userData = usersData?.find(u => u.id === student.user_id);
        const studentPlan = workoutPlans?.find(plan => plan.student_profiles?.id === student.id);
        const studentSubscription = subscriptions?.find(sub => sub.student_id === student.id);
        const studentConsultations = consultations?.filter(c => c.student_id === student.id) || [];
        
        // Lógica melhorada para determinar se aluno está ativo
        const hasActivePlan = studentPlan?.active === true;
        const hasActiveSubscription = studentSubscription?.active === true && 
          studentSubscription?.expires_at && 
          new Date(studentSubscription.expires_at) > new Date();
        
        // Aluno é ativo se tem subscription ativa OU plano ativo
        const isActive = hasActiveSubscription || hasActivePlan;
        
        return {
          ...student,
          users: userData, // Adicionar dados do usuário
          workout_plan: studentPlan,
          subscription: studentSubscription,
          consultations: studentConsultations,
          active: isActive,
          has_plan: !!studentPlan,
          has_active_subscription: hasActiveSubscription,
          has_active_plan: hasActivePlan
        };
      });

      setProfessorProfile(profile);
      setStudents(studentsWithData);
    } catch (error) {
      console.error('Erro ao buscar dados dos alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user || user.type !== 'professor') {
    return <div className="flex items-center justify-center min-h-screen">Acesso negado</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-foreground">Alunos Cadastrados</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => navigate('/create-student')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Aluno
              </Button>
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Search and Stats */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar aluno por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Alunos</p>
                    <p className="text-2xl font-bold">{students.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Dumbbell className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Com Plano</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.has_plan).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Premium</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.subscription?.plan_type === 'premium').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Lista de Alunos ({filteredStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <div className="space-y-4">
                {filteredStudents.map((student, index) => {
                  const nextConsultation = student.consultations?.find((c: any) => 
                    c.status === 'scheduled' && new Date(c.scheduled_at) > new Date()
                  );
                  
                  return (
                    <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          {/* Header Info */}
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">{student.users?.name}</h3>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{student.users?.email}</span>
                              </div>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex items-center space-x-2">
                            <Badge variant={student.subscription?.plan_type === "premium" ? "default" : "secondary"}>
                              {student.subscription?.plan_type || "Básico"}
                            </Badge>
                            <Badge variant={student.active ? "default" : "secondary"}>
                              <div className="flex items-center space-x-1">
                                {student.active ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                <span>{student.active ? "Ativo" : "Inativo"}</span>
                              </div>
                            </Badge>
                            {student.has_plan && (
                              <Badge variant="outline">
                                <Dumbbell className="h-3 w-3 mr-1" />
                                Plano Ativo
                              </Badge>
                            )}
                          </div>

                          {/* Student Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Idade</p>
                              <p className="font-medium">{student.age} anos</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Altura</p>
                              <p className="font-medium">{student.height}m</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Peso</p>
                              <p className="font-medium">{student.weight}kg</p>
                            </div>
                            {student.phone && (
                              <div>
                                <p className="text-muted-foreground">Telefone</p>
                                <div className="flex items-center space-x-1">
                                  <Phone className="h-3 w-3" />
                                  <p className="font-medium">{student.phone}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Next Consultation */}
                          {nextConsultation && (
                            <div className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Próxima Consulta:</span>
                                <span>
                                  {new Date(nextConsultation.scheduled_at).toLocaleDateString('pt-BR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Progress and Actions */}
                        <div className="text-right space-y-3 ml-6">
                          {student.workout_plan && (
                            <div className="space-y-2">
                              <div className="text-sm">
                                <p className="text-muted-foreground">Progresso do Plano</p>
                                <p className="font-medium">
                                  {student.workout_plan.completed_weeks || 0}/{student.workout_plan.duration_weeks} semanas
                                </p>
                              </div>
                              <Progress 
                                value={((student.workout_plan.completed_weeks || 0) / student.workout_plan.duration_weeks) * 100} 
                                className="w-24" 
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => navigate(`/student-profile/${student.id}`)}
                            >
                              Ver Perfil
                            </Button>
                            {student.has_plan ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full"
                                onClick={() => navigate(`/workout-plan/${student.workout_plan.id}`)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver Plano
                              </Button>
                            ) : (
                              <Button size="sm" className="w-full" onClick={() => navigate('/create-workout-plan')}>
                                <Plus className="h-3 w-3 mr-1" />
                                Criar Plano
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => navigate(`/student-challenges/${student.id}`)}
                            >
                              <Target className="h-3 w-3 mr-1" />
                              Desafios
                            </Button>
                            {student.subscription?.plan_type === 'premium' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full"
                                onClick={() => navigate(`/student-progress-photos/${student.id}`)}
                              >
                                <Camera className="h-3 w-3 mr-1" />
                                Fotos de Progresso
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca.' 
                    : 'Cadastre o primeiro aluno para começar.'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => navigate('/create-student')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Aluno
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Students;
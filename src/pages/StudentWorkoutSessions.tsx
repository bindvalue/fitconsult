import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { BodyMeasurements } from '@/components/BodyMeasurements';
import { 
  Calendar, 
  Clock, 
  Activity, 
  Users, 
  CheckCircle, 
  X, 
  Eye, 
  Star, 
  Dumbbell,
  Target,
  ArrowLeft,
  Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/Footer';

const StudentWorkoutSessions = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isProfessor = user?.type === 'professor';
  const isStudent = user?.type === 'student';
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([]);
  const [professorProfile, setProfessorProfile] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [workoutDetailOpen, setWorkoutDetailOpen] = useState(false);
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState<any>(null);
  const [progressPhotos, setProgressPhotos] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      if (isProfessor) {
        fetchProfessorData();
      } else if (isStudent) {
        fetchStudentData();
      }
    }
  }, [user, isProfessor, isStudent]);

  const fetchProfessorData = async () => {
    try {
      // Buscar perfil do professor
      const { data: profile } = await supabase
        .from('professor_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      // Buscar alunos com planos de treino criados pelo professor
      const { data: studentsData } = await supabase
        .from('student_profiles')
        .select(`
          *,
          users!inner (
            name,
            email
          ),
          workout_plans!inner (
            id,
            title,
            description,
            duration_weeks,
            frequency_per_week,
            current_week,
            completed_weeks,
            active
          )
        `)
        .eq('workout_plans.professor_id', profile?.id);

      // Buscar sessões de treino dos alunos
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          student_profiles!inner (
            users!inner (
              name,
              email
            )
          ),
          workout_plans!inner (
            title,
            description,
            professor_id
          )
        `)
        .eq('workout_plans.professor_id', profile?.id)
        .order('completed_at', { ascending: false });

      // Buscar fotos de progresso dos alunos
      const { data: photosData } = await supabase
        .from('progress_photos')
        .select(`
          *,
          student_profiles!inner (
            users!inner (
              name,
              email
            )
          )
        `)
        .in('student_id', (studentsData || []).map(s => s.id))
        .order('taken_at', { ascending: false });

      setProfessorProfile(profile);
      setStudents(studentsData || []);
      setWorkoutSessions(sessions || []);
      setProgressPhotos(photosData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      // Buscar perfil do estudante logado
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      // Buscar sessões de treino do estudante
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout_plans!inner (
            title,
            description,
            professor_id
          )
        `)
        .eq('student_id', profile?.id)
        .order('completed_at', { ascending: false });

      // Buscar fotos de progresso do estudante
      const { data: photosData } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('student_id', profile?.id)
        .order('taken_at', { ascending: false });

      setWorkoutSessions(sessions || []);
      setProgressPhotos(photosData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user || (user.type !== 'professor' && user.type !== 'student')) {
    return <div className="flex items-center justify-center min-h-screen">Acesso negado</div>;
  }

  // Estatísticas
  const totalSessions = workoutSessions.length;
  const completedSessions = workoutSessions.filter(s => s.completed_status !== false).length;
  const notCompletedSessions = workoutSessions.filter(s => s.completed_status === false).length;
  const thisWeekSessions = workoutSessions.filter(session => {
    const sessionDate = new Date(session.completed_at);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return sessionDate >= weekStart;
  });

  // Agrupar sessões por aluno
  const sessionsByStudent = workoutSessions.reduce((acc, session) => {
    const studentName = session.student_profiles.users.name;
    if (!acc[studentName]) {
      acc[studentName] = [];
    }
    acc[studentName].push(session);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(isProfessor ? '/dashboard' : '/student-dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-foreground">{isProfessor ? 'Acompanhar Treinos' : 'Meus Treinos'}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">{isProfessor ? 'Treinos dos Alunos' : 'Meus Treinos'}</h2>
          <p className="text-muted-foreground mt-2">{isProfessor ? 'Acompanhe o progresso e registros dos seus alunos' : 'Visualize seu histórico de treinos e progresso'}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Sessões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalSessions}</div>
              <div className="text-xs text-muted-foreground mt-1">registros totais</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Treinos Realizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedSessions}</div>
              <div className="text-xs text-muted-foreground mt-1">completados</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Não Realizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{notCompletedSessions}</div>
              <div className="text-xs text-muted-foreground mt-1">não completados</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Esta Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{thisWeekSessions.length}</div>
              <div className="text-xs text-muted-foreground mt-1">sessões registradas</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="by-student">Por Aluno</TabsTrigger>
            <TabsTrigger value="recent">Recentes</TabsTrigger>
            <TabsTrigger value="measurements">Medidas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Todos os Registros
                </CardTitle>
                <CardDescription>Histórico completo de treinos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workoutSessions.map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/20">
                      <div className="flex items-center gap-4">
                        {session.completed_status !== false ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <X className="h-6 w-6 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{session.student_profiles.users.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.workout_plans.title} • {' '}
                            {new Date(session.completed_at).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={session.completed_status !== false ? "default" : "destructive"}>
                          {session.completed_status !== false ? 'Realizado' : 'Não Realizado'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWorkoutDetail(session);
                            setWorkoutDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-student" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {Object.entries(sessionsByStudent).map(([studentName, sessions]) => (
                <Card key={studentName} className="bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {studentName}
                    </CardTitle>
                    <CardDescription>
                      {Array.isArray(sessions) ? sessions.length : 0} sessões • {' '}
                      {Array.isArray(sessions) ? sessions.filter(s => s.completed_status !== false).length : 0} realizadas • {' '}
                      {Array.isArray(sessions) ? sessions.filter(s => s.completed_status === false).length : 0} não realizadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(Array.isArray(sessions) ? sessions.slice(0, 5) : []).map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/10">
                          <div className="flex items-center gap-3">
                            {session.completed_status !== false ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )}
                            <div>
                              <div className="font-medium text-sm">{session.workout_plans.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(session.completed_at).toLocaleDateString('pt-BR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {session.duration_minutes && ` • ${session.duration_minutes} min`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.rating && (
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < session.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedWorkoutDetail(session);
                                setWorkoutDetailOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="measurements" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {students.map((student) => {
                const studentPhotos = progressPhotos.filter(
                  photo => photo.student_id === student.id
                );
                
                if (studentPhotos.length === 0) return null;
                
                return (
                  <Card key={student.id} className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        {student.users.name}
                      </CardTitle>
                      <CardDescription>
                        {studentPhotos.length} foto{studentPhotos.length !== 1 ? 's' : ''} de progresso • 
                        Última atualização: {new Date(studentPhotos[0]?.taken_at).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BodyMeasurements 
                        photos={studentPhotos} 
                        showTrends={true}
                      />
                    </CardContent>
                  </Card>
                );
              })}
              
              {students.filter(student => 
                progressPhotos.some(photo => photo.student_id === student.id)
              ).length === 0 && (
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Medidas Corporais
                    </CardTitle>
                    <CardDescription>
                      Nenhum aluno ainda enviou fotos de progresso com medidas corporais.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Registros Recentes
                </CardTitle>
                <CardDescription>Últimas 20 sessões registradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workoutSessions.slice(0, 20).map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/20">
                      <div className="flex items-center gap-4">
                        {session.completed_status !== false ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <X className="h-6 w-6 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{session.student_profiles.users.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.workout_plans.title} • {' '}
                            {new Date(session.completed_at).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={session.completed_status !== false ? "default" : "destructive"}>
                          {session.completed_status !== false ? 'Realizado' : 'Não Realizado'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWorkoutDetail(session);
                            setWorkoutDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Detalhes do Treino */}
        <Dialog open={workoutDetailOpen} onOpenChange={setWorkoutDetailOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Treino - {selectedWorkoutDetail?.student_profiles.users.name}</DialogTitle>
            </DialogHeader>
            {selectedWorkoutDetail && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Plano de Treino</Label>
                    <p className="text-sm font-medium">{selectedWorkoutDetail.workout_plans.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data</Label>
                    <p className="text-sm font-medium">
                      {new Date(selectedWorkoutDetail.completed_at).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {selectedWorkoutDetail.completed_status !== false ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Realizado
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-500" />
                          Não Realizado
                        </>
                      )}
                    </p>
                  </div>
                  {selectedWorkoutDetail.duration_minutes && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Duração</Label>
                      <p className="text-sm font-medium">{selectedWorkoutDetail.duration_minutes} minutos</p>
                    </div>
                  )}
                </div>

                {selectedWorkoutDetail.rating && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Avaliação do Aluno</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < selectedWorkoutDetail.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-2">
                        {selectedWorkoutDetail.rating}/5
                      </span>
                    </div>
                  </div>
                )}

                {selectedWorkoutDetail.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Observações do Aluno</Label>
                    <div className="mt-1 p-3 bg-background/50 rounded-lg border">
                      <p className="text-sm">{selectedWorkoutDetail.notes}</p>
                    </div>
                  </div>
                )}

                {selectedWorkoutDetail.observation && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Observação Específica</Label>
                    <div className="mt-1 p-3 bg-background/50 rounded-lg border">
                      <p className="text-sm">{selectedWorkoutDetail.observation}</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-muted-foreground">Informações Adicionais</Label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">Semana:</span> {selectedWorkoutDetail.week_number}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Dia:</span> {selectedWorkoutDetail.day_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">Email:</span> {selectedWorkoutDetail.student_profiles.users.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
};

export default StudentWorkoutSessions;
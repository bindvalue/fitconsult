import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dumbbell, 
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  User,
  CheckCircle,
  Play,
  Pause,
  Edit,
  Zap,
  Timer,
  Heart
} from "lucide-react";
import { Footer } from '@/components/Footer';

const WorkoutPlanView = () => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const { user } = useAuth();
  const isProfessor = user?.type === 'professor';
  const isStudent = user?.type === 'student';
  const [loading, setLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (user && planId) {
      fetchWorkoutPlan();
    }
  }, [user, planId]);

  const fetchWorkoutPlan = async () => {
    try {
      // Buscar plano de treino
      const { data: planData, error: planError } = await supabase
        .from('workout_plans')
        .select(`
          *,
          student_profiles!inner (
            id,
            age,
            weight,
            height,
            users!inner (
              id,
              name,
              email
            )
          )
        `)
        .eq('id', planId)
        .single();

      if (planError) throw planError;

      setWorkoutPlan(planData);
      setStudent(planData.student_profiles);
    } catch (error) {
      console.error('Erro ao buscar plano:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlanStatus = async () => {
    try {
      const { error } = await supabase
        .from('workout_plans')
        .update({ active: !workoutPlan.active })
        .eq('id', planId);

      if (error) throw error;

      setWorkoutPlan((prev: any) => ({
        ...prev,
        active: !prev.active
      }));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!workoutPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Plano não encontrado</h2>
          <p className="text-muted-foreground mb-4">O plano de treino solicitado não foi encontrado.</p>
          <Button onClick={() => navigate('/students')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Alunos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate(isProfessor ? '/students' : '/student-dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Plano de Treino</h1>
                  <p className="text-sm text-muted-foreground">{student?.users?.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isProfessor && (
                <>
                  <Button
                    onClick={() => navigate(`/edit-workout-plan/${planId}`)}
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Plano
                  </Button>
                  <Button
                    onClick={togglePlanStatus}
                    variant={workoutPlan.active ? "destructive" : "default"}
                  >
                    {workoutPlan.active ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar Plano
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Ativar Plano
                      </>
                    )}
                  </Button>
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Plan Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    {workoutPlan.title}
                  </CardTitle>
                  <Badge variant={workoutPlan.active ? "default" : "secondary"}>
                    {workoutPlan.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workoutPlan.description && (
                    <p className="text-muted-foreground">{workoutPlan.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Frequência</p>
                      <p className="font-medium">{workoutPlan.frequency_per_week}x/semana</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duração</p>
                      <p className="font-medium">{workoutPlan.duration_weeks} semanas</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">{workoutPlan.workout_type}</p>
                    </div>
                    {workoutPlan.time_cap_minutes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Time Cap</p>
                        <p className="font-medium">{workoutPlan.time_cap_minutes} min</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Aluno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-medium">{student?.users?.name}</h3>
                  <p className="text-sm text-muted-foreground">{student?.users?.email}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Idade:</span>
                      <span className="ml-1">{student?.age} anos</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Peso:</span>
                      <span className="ml-1">{student?.weight}kg</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Progresso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Semana Atual:</span>
                    <span>{workoutPlan.current_week || 1}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Completadas:</span>
                    <span>{workoutPlan.completed_weeks || 0}</span>
                  </div>
                  {workoutPlan.started_at && (
                    <div className="flex justify-between text-sm">
                      <span>Iniciado em:</span>
                      <span>{new Date(workoutPlan.started_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {workoutPlan.last_workout_date && (
                    <div className="flex justify-between text-sm">
                      <span>Último treino:</span>
                      <span>{new Date(workoutPlan.last_workout_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Workout Sections */}
        {workoutPlan.exercises && (
          <div className="space-y-6">
            {/* Warm-up Section */}
            {workoutPlan.exercises.warmup && workoutPlan.exercises.warmup.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-500" />
                    Warm-up (Aquecimento)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workoutPlan.exercises.warmup.map((exercise: any, index: number) => (
                      <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                          {exercise.time && <span>⏱️ {exercise.time}</span>}
                          {exercise.reps && <span>🔢 {exercise.reps}</span>}
                        </div>
                        {exercise.notes && (
                          <p className="text-sm text-muted-foreground mt-2">💡 {exercise.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strength Section */}
            {workoutPlan.exercises.strength && workoutPlan.exercises.strength.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Dumbbell className="h-5 w-5 mr-2 text-blue-500" />
                    Strength (Força)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workoutPlan.exercises.strength.map((exercise: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                          {exercise.reps && <span>🔢 {exercise.reps}</span>}
                          {exercise.weight && <span>🏋️ {exercise.weight}</span>}
                        </div>
                        {exercise.notes && (
                          <p className="text-sm text-muted-foreground mt-2">💡 {exercise.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* MetCon Section */}
            {workoutPlan.exercises.metcon && workoutPlan.exercises.metcon.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                    MetCon (Condicionamento Metabólico)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workoutPlan.exercises.metcon.map((exercise: any, index: number) => (
                      <div key={index} className="border-l-4 border-yellow-500 pl-4 py-2">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                          {exercise.reps && <span>🔢 {exercise.reps}</span>}
                          {exercise.time && <span>⏱️ {exercise.time}</span>}
                          {exercise.weight && <span>🏋️ {exercise.weight}</span>}
                        </div>
                        {exercise.notes && (
                          <p className="text-sm text-muted-foreground mt-2">💡 {exercise.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cool Down Section */}
            {workoutPlan.exercises.cooldown && workoutPlan.exercises.cooldown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Timer className="h-5 w-5 mr-2 text-green-500" />
                    Cool Down (Relaxamento)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workoutPlan.exercises.cooldown.map((exercise: any, index: number) => (
                      <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                          {exercise.time && <span>⏱️ {exercise.time}</span>}
                          {exercise.reps && <span>🔢 {exercise.reps}</span>}
                        </div>
                        {exercise.notes && (
                          <p className="text-sm text-muted-foreground mt-2">💡 {exercise.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {(!workoutPlan.exercises.warmup || workoutPlan.exercises.warmup.length === 0) &&
             (!workoutPlan.exercises.strength || workoutPlan.exercises.strength.length === 0) &&
             (!workoutPlan.exercises.metcon || workoutPlan.exercises.metcon.length === 0) &&
             (!workoutPlan.exercises.cooldown || workoutPlan.exercises.cooldown.length === 0) && (
              <Card>
                <CardContent className="text-center py-8">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhum exercício configurado neste plano.</p>
                  <Button 
                    onClick={() => navigate(`/edit-workout-plan/${planId}`)}
                    variant="outline" 
                    className="mt-4"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Adicionar Exercícios
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default WorkoutPlanView;
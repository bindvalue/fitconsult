import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, Dumbbell, Target, Timer, Heart, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';

interface Exercise {
  id: string;
  name: string;
  category: string;
  movement_pattern?: string;
  equipment_needed?: string[];
  description: string;
}

interface CrossfitWorkout {
  id: string;
  name: string;
  description: string;
  workout_structure: any;
  story?: string;
  category?: string;
}

export default function ExerciseLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'movements' | 'workouts' | 'heroes'>('movements');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [heroWorkouts, setHeroWorkouts] = useState<CrossfitWorkout[]>([]);
  const [benchmarkWorkouts, setBenchmarkWorkouts] = useState<CrossfitWorkout[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<CrossfitWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter movements
    let filteredMovements = exercises;
    
    if (searchTerm) {
      filteredMovements = filteredMovements.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filteredMovements = filteredMovements.filter(exercise => exercise.category === selectedCategory);
    }

    setFilteredExercises(filteredMovements);

    // Filter workouts
    const allWorkouts = selectedType === 'heroes' ? heroWorkouts : 
                       selectedType === 'workouts' ? benchmarkWorkouts : 
                       [...heroWorkouts, ...benchmarkWorkouts];
    let filteredWODs = allWorkouts;
    
    if (searchTerm) {
      filteredWODs = filteredWODs.filter(workout =>
        workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredWorkouts(filteredWODs);
  }, [searchTerm, selectedCategory, selectedType, exercises, heroWorkouts, benchmarkWorkouts]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('ExerciseLibrary: Loading data for user', { userId: user?.id, userType: user?.type });

      // Para estudantes, verificar se tem plano premium
      if (user?.type === 'student') {
        console.log('ExerciseLibrary: User is student, checking subscription...');
        
        const { data: profile, error: profileError } = await supabase
          .from('student_profiles')
          .select('id, selected_plan')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('ExerciseLibrary: Profile data:', { profile, profileError });

        if (profile) {
          // Buscar assinatura ativa e válida
          const { data: subscriptionData, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('student_id', profile.id)
            .eq('active', true)
            .eq('plan_type', 'premium')
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();
          
          console.log('ExerciseLibrary: Subscription check:', { 
            profile: profile.id, 
            subscription: subscriptionData,
            subscriptionError: subError,
            currentDate: new Date().toISOString()
          });
          
          if (subscriptionData) {
            console.log('ExerciseLibrary: Premium subscription found!');
            setSubscription(subscriptionData);
          } else {
            console.log('ExerciseLibrary: No premium subscription found');
            setSubscription(null);
          }
        } else {
          console.log('ExerciseLibrary: No profile found for student');
          setSubscription(null);
        }
      } else {
        // Para professores, permitir acesso
        console.log('ExerciseLibrary: User is professor, allowing access');
        setSubscription({ plan_type: 'premium' }); // Mock subscription para professores
      }

      // Load exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('crossfit_exercises')
        .select('*')
        .order('name');

      if (exercisesError) throw exercisesError;
      setExercises(exercisesData || []);

      // Load hero workouts
      const { data: heroData, error: heroError } = await supabase
        .from('hero_workouts')
        .select('*')
        .order('name');

      if (heroError) throw heroError;
      setHeroWorkouts(heroData || []);

      // Load benchmark workouts
      const { data: benchmarkData, error: benchmarkError } = await supabase
        .from('benchmark_workouts')
        .select('*')
        .order('name');

      if (benchmarkError) throw benchmarkError;
      setBenchmarkWorkouts(benchmarkData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da biblioteca.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength':
        return 'bg-red-100 text-red-800';
      case 'gymnastics':
        return 'bg-blue-100 text-blue-800';
      case 'cardio':
        return 'bg-green-100 text-green-800';
      case 'metcon':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkoutTypeColor = (workout: CrossfitWorkout) => {
    if (workout.category) {
      return workout.category === 'girls' ? 'bg-pink-100 text-pink-800' : 'bg-red-100 text-red-800';
    }
    return 'bg-red-100 text-red-800'; // Hero workouts
  };

  const categories = ['all', 'strength', 'gymnastics', 'cardio', 'metcon'];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando biblioteca...</p>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se é estudante e se tem acesso premium
  if (user?.type === 'student' && !subscription) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/student-dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
        
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Acesso Premium Necessário</CardTitle>
            <CardDescription>
              A biblioteca de exercícios está disponível apenas para alunos com plano Premium.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/student-dashboard')}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(user?.type === 'student' ? '/student-dashboard' : '/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Biblioteca CrossFit</h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar movimentos e workouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedType === 'movements' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('movements')}
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            Movimentos
          </Button>
          <Button
            variant={selectedType === 'workouts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('workouts')}
          >
            <Zap className="h-4 w-4 mr-2" />
            Girls WODs
          </Button>
          <Button
            variant={selectedType === 'heroes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('heroes')}
          >
            <Heart className="h-4 w-4 mr-2" />
            Hero WODs
          </Button>
        </div>
      </div>

      {selectedType === 'movements' ? (
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="strength">Força</TabsTrigger>
            <TabsTrigger value="gymnastics">Ginástica</TabsTrigger>
            <TabsTrigger value="cardio">Cardio</TabsTrigger>
            <TabsTrigger value="metcon">MetCon</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredExercises.map((exercise) => (
                <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{exercise.name}</CardTitle>
                      <Badge className={getCategoryColor(exercise.category)}>
                        {exercise.category}
                      </Badge>
                    </div>
                    <CardDescription>{exercise.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      {exercise.movement_pattern && (
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="font-medium">Padrão:</span>
                          <span className="text-muted-foreground">{exercise.movement_pattern}</span>
                        </div>
                      )}
                      
                      {exercise.equipment_needed && exercise.equipment_needed.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-primary" />
                          <span className="font-medium">Equipamento:</span>
                          <span className="text-muted-foreground">{exercise.equipment_needed.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredExercises.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum movimento encontrado com os critérios de busca.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkouts.map((workout) => (
              <Card key={workout.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{workout.name}</CardTitle>
                    <Badge className={getWorkoutTypeColor(workout)}>
                      {workout.category ? workout.category : 'Hero'}
                    </Badge>
                  </div>
                  <CardDescription>{workout.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workout.story && (
                    <div>
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary" />
                        História:
                      </h4>
                      <p className="text-sm text-muted-foreground">{workout.story}</p>
                    </div>
                  )}

                  {workout.workout_structure && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Estrutura:
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Tipo:</strong> {workout.workout_structure.type}</p>
                        {workout.workout_structure.rounds && (
                          <p><strong>Rounds:</strong> {workout.workout_structure.rounds}</p>
                        )}
                        {workout.workout_structure.time_cap && (
                          <p><strong>Time Cap:</strong> {workout.workout_structure.time_cap} min</p>
                        )}
                        {workout.workout_structure.scheme && (
                          <p><strong>Esquema:</strong> {workout.workout_structure.scheme}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {workout.workout_structure?.exercises && (
                    <div>
                      <h4 className="font-medium mb-2">Exercícios:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {workout.workout_structure.exercises.map((exercise: any, index: number) => (
                          <li key={index}>
                            • {exercise.name} 
                            {exercise.reps && ` - ${exercise.reps}`}
                            {exercise.weight && ` - ${exercise.weight}`}
                            {exercise.distance && ` - ${exercise.distance}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredWorkouts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum workout encontrado com os critérios de busca.</p>
            </div>
          )}
        </div>
      )}
      <Footer />
    </div>
  );
}
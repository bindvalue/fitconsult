import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Target, Plus, Trash2, Timer, Zap } from 'lucide-react';
import { Footer } from '@/components/Footer';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface CrossFitExercise {
  id?: string;
  name: string;
  category: string;
  reps?: string;
  weight?: string;
  time?: string;
  distance?: string;
  calories?: string;
  scaling?: string;
  notes?: string;
}

interface CrossFitWorkout {
  warmup: CrossFitExercise[];
  strength: CrossFitExercise[];
  metcon: CrossFitExercise[];
  cooldown: CrossFitExercise[];
}

export default function CreateWorkoutPlan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableExercises, setAvailableExercises] = useState<CrossFitExercise[]>([]);
  const [heroWorkouts, setHeroWorkouts] = useState<any[]>([]);
  const [benchmarkWorkouts, setBenchmarkWorkouts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    title: '',
    description: '',
    workout_type: 'WOD',
    time_cap_minutes: '',
    duration_weeks: '4',
    frequency_per_week: '3'
  });
  
  const [workout, setWorkout] = useState<CrossFitWorkout>({
    warmup: [{ name: '', category: 'warmup', reps: '', time: '', notes: '' }],
    strength: [{ name: '', category: 'strength', reps: '', weight: '', notes: '' }],
    metcon: [{ name: '', category: 'metcon', reps: '', time: '', notes: '' }],
    cooldown: [{ name: '', category: 'cooldown', time: '', notes: '' }]
  });

  useEffect(() => {
    loadStudents();
    loadExercises();
    loadHeroWorkouts();
    loadBenchmarkWorkouts();
  }, []);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          id,
          users!inner (
            id,
            name,
            email
          )
        `)
        .order('users(name)');

      if (error) throw error;
      
      const studentsData = (data || []).map(profile => ({
        id: profile.id,
        name: profile.users?.name || '',
        email: profile.users?.email || ''
      }));
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('crossfit_exercises')
        .select('*')
        .order('category, name');

      if (error) throw error;
      setAvailableExercises(data || []);
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error);
    }
  };

  const loadHeroWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_workouts')
        .select('*')
        .order('name');

      if (error) throw error;
      setHeroWorkouts(data || []);
    } catch (error) {
      console.error('Erro ao carregar Hero Workouts:', error);
    }
  };

  const loadBenchmarkWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('benchmark_workouts')
        .select('*')
        .order('name');

      if (error) throw error;
      setBenchmarkWorkouts(data || []);
    } catch (error) {
      console.error('Erro ao carregar Benchmark WODs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data: professorProfile, error: profileError } = await supabase
        .from('professor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Combinar todos os exercícios do WOD
      const allExercises = [
        ...workout.warmup.filter(ex => ex.name.trim() !== ''),
        ...workout.strength.filter(ex => ex.name.trim() !== ''),
        ...workout.metcon.filter(ex => ex.name.trim() !== ''),
        ...workout.cooldown.filter(ex => ex.name.trim() !== '')
      ];

      const wodData = {
        professor_id: professorProfile.id,
        student_id: formData.student_id.trim() !== '' ? formData.student_id : null,
        title: formData.title,
        description: formData.description,
        workout_type: formData.workout_type,
        time_cap_minutes: formData.time_cap_minutes ? parseInt(formData.time_cap_minutes) : null,
        duration_weeks: parseInt(formData.duration_weeks),
        frequency_per_week: parseInt(formData.frequency_per_week),
        exercises: {
          warmup: workout.warmup.filter(ex => ex.name.trim() !== ''),
          strength: workout.strength.filter(ex => ex.name.trim() !== ''),
          metcon: workout.metcon.filter(ex => ex.name.trim() !== ''),
          cooldown: workout.cooldown.filter(ex => ex.name.trim() !== '')
        },
        active: true
      };

      const { error } = await supabase
        .from('workout_plans')
        .insert(wodData as any);

      if (error) throw error;

      toast({
        title: 'WOD criado com sucesso!',
        description: 'O treino foi adicionado ao perfil do atleta.'
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao criar WOD:', error);
      toast({
        title: 'Erro ao criar WOD',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addExercise = (section: keyof CrossFitWorkout) => {
    setWorkout(prev => ({
      ...prev,
      [section]: [...prev[section], { name: '', category: section, notes: '' }]
    }));
  };

  const removeExercise = (section: keyof CrossFitWorkout, index: number) => {
    setWorkout(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const updateExercise = (section: keyof CrossFitWorkout, index: number, field: string, value: string) => {
    setWorkout(prev => ({
      ...prev,
      [section]: prev[section].map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const getExercisesByCategory = (category: string) => {
    return availableExercises.filter(ex => ex.category === category);
  };

  const renderExerciseSection = (title: string, section: keyof CrossFitWorkout, icon: React.ReactNode) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workout[section].map((exercise, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">{title} {index + 1}</h4>
                {workout[section].length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeExercise(section, index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Label>Exercício</Label>
                  <Select 
                    value={exercise.name} 
                    onValueChange={(value) => updateExercise(section, index, 'name', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um exercício" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableExercises
                        .filter(ex => section === 'warmup' || section === 'cooldown' || ex.category === section || ex.category === 'gymnastics' || ex.category === 'strength' || ex.category === 'metcon' || ex.category === 'cardio')
                        .map((ex) => (
                        <SelectItem key={ex.id} value={ex.name}>
                          {ex.name} ({ex.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {section === 'strength' && (
                  <>
                    <div>
                      <Label>Repetições/Séries</Label>
                      <Input
                        value={exercise.reps || ''}
                        onChange={(e) => updateExercise(section, index, 'reps', e.target.value)}
                        placeholder="Ex: 5x5, 3RM, EMOM"
                      />
                    </div>
                    <div>
                      <Label>Peso/Carga</Label>
                      <Input
                        value={exercise.weight || ''}
                        onChange={(e) => updateExercise(section, index, 'weight', e.target.value)}
                        placeholder="Ex: 80% 1RM, 40kg"
                      />
                    </div>
                  </>
                )}
                
                {section === 'metcon' && (
                  <>
                    <div>
                      <Label>Repetições/Rounds</Label>
                      <Input
                        value={exercise.reps || ''}
                        onChange={(e) => updateExercise(section, index, 'reps', e.target.value)}
                        placeholder="Ex: 21-15-9, 5 rounds"
                      />
                    </div>
                    <div>
                      <Label>Tempo/Distância</Label>
                      <Input
                        value={exercise.time || ''}
                        onChange={(e) => updateExercise(section, index, 'time', e.target.value)}
                        placeholder="Ex: For Time, 20min AMRAP"
                      />
                    </div>
                  </>
                )}
                
                {(section === 'warmup' || section === 'cooldown') && (
                  <div>
                    <Label>Tempo/Repetições</Label>
                    <Input
                      value={exercise.time || ''}
                      onChange={(e) => updateExercise(section, index, 'time', e.target.value)}
                      placeholder="Ex: 2min, 10 reps"
                    />
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <Label>Scaling/Observações</Label>
                  <Input
                    value={exercise.notes || ''}
                    onChange={(e) => updateExercise(section, index, 'notes', e.target.value)}
                    placeholder="Scaling options, técnica, observações..."
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => addExercise(section)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar {title}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Criar WOD (Workout of the Day)</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Informações do WOD
            </CardTitle>
            <CardDescription>
              Configure as informações básicas do treino CrossFit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="student">Atleta *</Label>
              <Select value={formData.student_id} onValueChange={(value) => handleChange('student_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um atleta" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Nome do WOD *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex: Fran, Grace, WOD Custom"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descreva os objetivos e características do WOD..."
                rows={3}
              />
            </div>

            {/* WODs Pré-definidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label>Hero Workouts</Label>
                <Select
                  onValueChange={(value) => {
                    const hero = heroWorkouts.find(h => h.id === value);
                    if (hero) {
                      handleChange('title', hero.name);
                      handleChange('description', `${hero.description}\n\n${hero.story || ''}`);
                      handleChange('workout_type', hero.workout_structure.type === 'for_time' ? 'For Time' : 
                                 hero.workout_structure.type === 'amrap' ? 'AMRAP' : 'WOD');
                      if (hero.workout_structure.time_cap) {
                        handleChange('time_cap_minutes', hero.workout_structure.time_cap.toString());
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um Hero Workout" />
                  </SelectTrigger>
                  <SelectContent>
                    {heroWorkouts.map((hero) => (
                      <SelectItem key={hero.id} value={hero.id}>
                        {hero.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Benchmark WODs (Girls)</Label>
                <Select
                  onValueChange={(value) => {
                    const benchmark = benchmarkWorkouts.find(b => b.id === value);
                    if (benchmark) {
                      handleChange('title', benchmark.name);
                      handleChange('description', benchmark.description);
                      handleChange('workout_type', benchmark.workout_structure.type === 'for_time' ? 'For Time' : 
                                 benchmark.workout_structure.type === 'amrap' ? 'AMRAP' : 'WOD');
                      if (benchmark.workout_structure.time_cap) {
                        handleChange('time_cap_minutes', benchmark.workout_structure.time_cap.toString());
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um Benchmark WOD" />
                  </SelectTrigger>
                  <SelectContent>
                    {benchmarkWorkouts.map((benchmark) => (
                      <SelectItem key={benchmark.id} value={benchmark.id}>
                        {benchmark.name} ({benchmark.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="workout_type">Tipo de WOD</Label>
                <Select value={formData.workout_type} onValueChange={(value) => handleChange('workout_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WOD">WOD</SelectItem>
                    <SelectItem value="AMRAP">AMRAP</SelectItem>
                    <SelectItem value="For Time">For Time</SelectItem>
                    <SelectItem value="EMOM">EMOM</SelectItem>
                    <SelectItem value="Tabata">Tabata</SelectItem>
                    <SelectItem value="Strength">Strength</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="time_cap">Time Cap (minutos)</Label>
                <Input
                  id="time_cap"
                  type="number"
                  value={formData.time_cap_minutes}
                  onChange={(e) => handleChange('time_cap_minutes', e.target.value)}
                  placeholder="Ex: 20"
                />
              </div>
              
              <div>
                <Label htmlFor="frequency">Frequência Semanal</Label>
                <Input
                  id="frequency"
                  type="number"
                  value={formData.frequency_per_week}
                  onChange={(e) => handleChange('frequency_per_week', e.target.value)}
                  min="1"
                  max="7"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {renderExerciseSection('Warm-up', 'warmup', <Zap className="h-5 w-5" />)}
        {renderExerciseSection('Strength', 'strength', <Target className="h-5 w-5" />)}
        {renderExerciseSection('MetCon', 'metcon', <Timer className="h-5 w-5" />)}
        {renderExerciseSection('Cool Down', 'cooldown', <Zap className="h-5 w-5" />)}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Criando WOD...' : 'Criar WOD'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Cancelar
          </Button>
        </div>
      </form>
      <Footer />
    </div>
  );
}
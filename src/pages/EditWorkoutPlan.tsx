import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Target, Plus, Trash2, Timer, Zap, Heart, Save } from 'lucide-react';
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

export default function EditWorkoutPlan() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableExercises, setAvailableExercises] = useState<CrossFitExercise[]>([]);
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
    if (planId && user) {
      loadWorkoutPlan();
      loadStudents();
      loadExercises();
    }
  }, [planId, user]);

  const loadWorkoutPlan = async () => {
    try {
      const { data: planData, error: planError } = await supabase
        .from('workout_plans')
        .select(`
          *,
          student_profiles!inner (
            id,
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

      // Populate form data
      setFormData({
        student_id: planData.student_id || '',
        title: planData.title || '',
        description: planData.description || '',
        workout_type: planData.workout_type || 'WOD',
        time_cap_minutes: planData.time_cap_minutes?.toString() || '',
        duration_weeks: planData.duration_weeks?.toString() || '4',
        frequency_per_week: planData.frequency_per_week?.toString() || '3'
      });

      // Populate workout exercises
      if (planData.exercises) {
        const exercises = planData.exercises as any;
        setWorkout({
          warmup: exercises.warmup || [{ name: '', category: 'warmup', reps: '', time: '', notes: '' }],
          strength: exercises.strength || [{ name: '', category: 'strength', reps: '', weight: '', notes: '' }],
          metcon: exercises.metcon || [{ name: '', category: 'metcon', reps: '', time: '', notes: '' }],
          cooldown: exercises.cooldown || [{ name: '', category: 'cooldown', time: '', notes: '' }]
        });
      }
    } catch (error) {
      console.error('Erro ao carregar plano:', error);
      toast({
        title: 'Erro ao carregar plano',
        description: 'Não foi possível carregar os dados do plano de treino.',
        variant: 'destructive'
      });
    } finally {
      setInitialLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !planId) return;

    setLoading(true);
    try {
      const wodData = {
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
        }
      };

      const { error } = await supabase
        .from('workout_plans')
        .update(wodData as any)
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Plano atualizado com sucesso!',
        description: 'As alterações foram salvas.'
      });

      navigate(`/workout-plan/${planId}`);
    } catch (error: any) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: 'Erro ao atualizar plano',
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

  if (initialLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/workout-plan/${planId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Editar Plano de Treino</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Informações do Plano
            </CardTitle>
            <CardDescription>
              Edite as informações do plano de treino CrossFit
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
              <Label htmlFor="title">Nome do Plano *</Label>
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
                placeholder="Descreva os objetivos e características do plano..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="workout_type">Tipo de Treino</Label>
                <Select value={formData.workout_type} onValueChange={(value) => handleChange('workout_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WOD">WOD</SelectItem>
                    <SelectItem value="For Time">For Time</SelectItem>
                    <SelectItem value="AMRAP">AMRAP</SelectItem>
                    <SelectItem value="EMOM">EMOM</SelectItem>
                    <SelectItem value="Strength">Strength</SelectItem>
                    <SelectItem value="Technique">Technique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration_weeks">Duração (semanas) *</Label>
                <Input
                  id="duration_weeks"
                  type="number"
                  min="1"
                  max="52"
                  value={formData.duration_weeks}
                  onChange={(e) => handleChange('duration_weeks', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="frequency_per_week">Frequência semanal *</Label>
                <Input
                  id="frequency_per_week"
                  type="number"
                  min="1"
                  max="7"
                  value={formData.frequency_per_week}
                  onChange={(e) => handleChange('frequency_per_week', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="time_cap_minutes">Time Cap (minutos)</Label>
              <Input
                id="time_cap_minutes"
                type="number"
                min="1"
                value={formData.time_cap_minutes}
                onChange={(e) => handleChange('time_cap_minutes', e.target.value)}
                placeholder="Ex: 20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Exercise Sections */}
        {renderExerciseSection('Warm-up', 'warmup', <Heart className="h-5 w-5 text-red-500" />)}
        {renderExerciseSection('Strength', 'strength', <Timer className="h-5 w-5 text-blue-500" />)}
        {renderExerciseSection('MetCon', 'metcon', <Zap className="h-5 w-5 text-yellow-500" />)}
        {renderExerciseSection('Cool Down', 'cooldown', <Timer className="h-5 w-5 text-green-500" />)}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/workout-plan/${planId}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
      <Footer />
    </div>
  );
}
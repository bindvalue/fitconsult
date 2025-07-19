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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/Footer';

interface Student {
  id: string;
  name: string;
  email: string;
}

export default function ScheduleConsultation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [formData, setFormData] = useState({
    student_id: '',
    type: 'follow_up',
    time: '',
    duration_minutes: '40',
    notes: '',
    google_meet_link: ''
  });

  // Função para verificar se um horário está disponível para o dia atual
  const isTimeAvailable = (time: string) => {
    if (!selectedDate) return true;
    
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    if (!isToday) return true;
    
    // Se é hoje, verificar se o horário já passou
    const [hours, minutes] = time.split(':');
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return selectedDateTime > today;
  };

  // Função para gerar horários disponíveis
  const generateAvailableTimeSlots = () => {
    const slots = [];
    const today = new Date();
    const isToday = selectedDate && selectedDate.toDateString() === today.toDateString();
    
    // Horários de 6:00 às 22:00 com intervalos de 30 minutos
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Se é hoje, verificar se o horário já passou
        if (isToday) {
          if (isTimeAvailable(timeString)) {
            slots.push(timeString);
          }
        } else {
          slots.push(timeString);
        }
      }
    }
    
    return slots;
  };

  // Limpar horário selecionado quando a data mudar
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [selectedDate]);

  useEffect(() => {
    loadStudents();
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
          ),
          subscriptions!inner (
            id,
            plan_type,
            active,
            expires_at
          )
        `)
        .eq('subscriptions.plan_type', 'premium')
        .eq('subscriptions.active', true)
        .gte('subscriptions.expires_at', new Date().toISOString())
        .order('users(name)');

      if (error) throw error;
      
      // Mapear os dados para o formato esperado
      const studentsData = (data || []).map(profile => ({
        id: profile.id, // Usar o ID do student_profile
        name: profile.users?.name || '',
        email: profile.users?.email || ''
      }));
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate) return;

    // Validações básicas
    if (!formData.student_id) {
      toast({
        title: 'Aluno obrigatório',
        description: 'Por favor, selecione um aluno para agendar a consulta.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.time) {
      toast({
        title: 'Horário obrigatório',
        description: 'Por favor, selecione um horário para a consulta.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.google_meet_link) {
      toast({
        title: 'Link do Google Meet obrigatório',
        description: 'Por favor, adicione o link do Google Meet para a consulta.',
        variant: 'destructive'
      });
      return;
    }

    // Validar se o horário está disponível para hoje
    if (!isTimeAvailable(formData.time)) {
      toast({
        title: 'Horário não disponível',
        description: 'Este horário já passou. Por favor, selecione um horário futuro.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Debug: Log dos dados que estão sendo enviados
      console.log('Dados do formulário:', formData);
      console.log('Data selecionada:', selectedDate);
      console.log('Usuário:', user);

      // Obter o perfil do professor
      const { data: professorProfile, error: profileError } = await supabase
        .from('professor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil do professor:', profileError);
        throw profileError;
      }

      console.log('Perfil do professor:', professorProfile);

      // Criar data e hora completa
      const [hours, minutes] = formData.time.split(':');
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Dados a serem inseridos
      const consultationData = {
        professor_id: professorProfile.id,
        student_id: formData.student_id,
        scheduled_at: scheduledDateTime.toISOString(),
        type: formData.type,
        duration_minutes: parseInt(formData.duration_minutes),
        notes: formData.notes,
        google_meet_link: formData.google_meet_link,
        status: 'scheduled'
      };

      console.log('Dados da consulta a serem inseridos:', consultationData);

      const { error } = await supabase
        .from('consultations')
        .insert(consultationData);

      if (error) throw error;

      toast({
        title: 'Consulta agendada com sucesso!',
        description: 'A consulta foi adicionada ao seu cronograma.'
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao agendar consulta:', error);
      toast({
        title: 'Erro ao agendar consulta',
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

  return (
    <div className="container mx-auto p-6 max-w-2xl">
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
        <h1 className="text-2xl font-bold">Agendar Consulta</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Nova Consulta
          </CardTitle>
          <CardDescription>
            Agende uma consulta com um de seus alunos premium
          </CardDescription>
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <strong>Nota:</strong> Apenas alunos com plano premium podem agendar consultas. 
            Adicione o link do Google Meet para que o aluno possa acessar a reunião.
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="student">Aluno *</Label>
              <Select value={formData.student_id} onValueChange={(value) => handleChange('student_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um aluno" />
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
              <Label htmlFor="type">Tipo de Consulta *</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial">Consulta Inicial</SelectItem>
                  <SelectItem value="follow_up">Acompanhamento</SelectItem>
                  <SelectItem value="reassessment">Reavaliação</SelectItem>
                  <SelectItem value="emergency">Emergência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                       disabled={(date) => {
                         const today = new Date();
                         today.setHours(0, 0, 0, 0);
                         return date < today || date.getDay() === 0;
                       }}
                       initialFocus
                       className="pointer-events-auto"
                     />
                   </PopoverContent>
                 </Popover>
               </div>
               <div>
                 <Label htmlFor="time">Horário *</Label>
                 <Select value={formData.time} onValueChange={(value) => handleChange('time', value)}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecionar horário" />
                   </SelectTrigger>
                   <SelectContent>
                     {generateAvailableTimeSlots().map((time) => (
                       <SelectItem key={time} value={time}>
                         {time}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
            </div>

            <div>
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', e.target.value)}
                placeholder="40"
                min="15"
                max="120"
              />
            </div>

            <div>
              <Label htmlFor="google_meet_link">Link do Google Meet *</Label>
              <Input
                id="google_meet_link"
                type="url"
                value={formData.google_meet_link}
                onChange={(e) => handleChange('google_meet_link', e.target.value)}
                placeholder="https://meet.google.com/..."
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Adicione observações sobre a consulta..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || !selectedDate || !formData.time || !formData.google_meet_link || !formData.student_id} className="flex-1">
                {loading ? 'Agendando...' : 'Agendar Consulta'}
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
        </CardContent>
      </Card>
      <Footer />
    </div>
  );
}
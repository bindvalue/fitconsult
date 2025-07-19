import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Video, ArrowLeft, ExternalLink, Search, Filter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import MeetingNotes from '@/components/MeetingNotes';
import { Footer } from '@/components/Footer';

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  notes: string;
  google_meet_link: string;
  student_profiles?: {
    id: string;
    users: {
      name: string;
      email: string;
    };
  };
  professor_profiles?: {
    id: string;
    users: {
      name: string;
      email: string;
    };
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'Agendado';
    case 'completed':
      return 'Concluído';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

const getTypeText = (type: string) => {
  switch (type) {
    case 'initial':
      return 'Consulta Inicial';
    case 'follow_up':
      return 'Acompanhamento';
    case 'reassessment':
      return 'Reavaliação';
    case 'emergency':
      return 'Emergência';
    default:
      return type;
  }
};

export default function Appointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentFilter, setStudentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  // Filtrar agendamentos baseado nos filtros
  useEffect(() => {
    let filtered = appointments;

    if (studentFilter.trim() !== '') {
      filtered = filtered.filter(appointment => {
        const studentName = appointment.student_profiles?.users.name || '';
        const professorName = appointment.professor_profiles?.users.name || '';
        const nameToSearch = user?.type === 'professor' ? studentName : professorName;
        return nameToSearch.toLowerCase().includes(studentFilter.toLowerCase());
      });
    }

    if (dateFilter) {
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.scheduled_at);
        const filterDate = new Date(dateFilter);
        return appointmentDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredAppointments(filtered);
  }, [appointments, studentFilter, dateFilter, user]);

  const fetchAppointments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('consultations')
        .select(`
          *,
          student_profiles!inner (
            id,
            users!inner (
              name,
              email
            )
          ),
          professor_profiles!inner (
            id,
            users!inner (
              name,
              email
            )
          )
        `);

      if (user.type === 'professor') {
        // Professor vê todas as consultas que ele criou
        const { data: professorProfile } = await supabase
          .from('professor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (professorProfile) {
          query = query.eq('professor_id', professorProfile.id);
        }
      } else {
        // Aluno vê apenas as consultas direcionadas a ele
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (studentProfile) {
          query = query.eq('student_id', studentProfile.id);
        }
      }

      const { data, error } = await query.order('scheduled_at', { ascending: false });

      if (error) throw error;

      setAppointments(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar agendamentos:', error);
      toast({
        title: 'Erro ao carregar agendamentos',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Agendamento marcado como ${getStatusText(newStatus).toLowerCase()}`
      });

      fetchAppointments();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    }
  };

  const goBack = () => {
    navigate(user?.type === 'professor' ? '/dashboard' : '/student-dashboard');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando agendamentos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={goBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {user?.type === 'professor' ? 'Consultas Agendadas' : 'Meus Agendamentos'}
        </h1>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Filtros</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student-filter">
                {user?.type === 'professor' ? 'Buscar por aluno' : 'Buscar por professor'}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="student-filter"
                  placeholder={user?.type === 'professor' ? 'Nome do aluno...' : 'Nome do professor...'}
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Filtrar por data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, 'dd/MM/yyyy') : 'Selecionar data...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {(studentFilter || dateFilter) && (
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setStudentFilter('');
                  setDateFilter(undefined);
                }}
              >
                Limpar filtros
              </Button>
              <div className="text-sm text-muted-foreground flex items-center">
                Mostrando {filteredAppointments.length} de {appointments.length} agendamentos
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {appointments.length === 0 ? 'Nenhum agendamento encontrado' : 'Nenhum agendamento encontrado com os filtros aplicados'}
            </h3>
            <p className="text-muted-foreground">
              {appointments.length === 0 
                ? (user?.type === 'professor' 
                    ? 'Você ainda não agendou nenhuma consulta com seus alunos.'
                    : 'Você não possui agendamentos no momento.'
                  )
                : 'Tente ajustar os filtros ou limpar para ver todos os agendamentos.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">
                        {format(new Date(appointment.scheduled_at), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(appointment.scheduled_at), 'HH:mm')} 
                        <span className="text-muted-foreground">
                          ({appointment.duration_minutes} min)
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {getStatusText(appointment.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {user?.type === 'professor' ? 'Aluno:' : 'Professor:'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {user?.type === 'professor' 
                        ? appointment.student_profiles?.users.name
                        : appointment.professor_profiles?.users.name
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Tipo:</span>
                      <span className="text-sm">{getTypeText(appointment.type)}</span>
                    </div>
                  </div>
                </div>

                {appointment.google_meet_link && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-4 w-4 text-primary" />
                      <span className="font-medium">Google Meet</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(appointment.google_meet_link, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Entrar na reunião
                    </Button>
                  </div>
                )}

                {user?.type === 'professor' ? (
                  <MeetingNotes
                    appointmentId={appointment.id}
                    initialNotes={appointment.notes}
                    onNotesUpdate={(updatedNotes) => {
                      setAppointments(prev => prev.map(apt => 
                        apt.id === appointment.id ? { ...apt, notes: updatedNotes } : apt
                      ));
                    }}
                  />
                ) : (
                  appointment.notes && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium mb-2">Notas da Reunião:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {appointment.notes}
                      </p>
                    </div>
                  )
                )}

                {user?.type === 'professor' && appointment.status === 'scheduled' && (
                  <div className="border-t pt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(appointment.id, 'completed')}
                      className="text-green-600 hover:text-green-700"
                    >
                      Marcar como Concluído
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
}
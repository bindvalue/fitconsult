import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar, Clock, Trophy, Activity, Camera, MessageSquare, Target, CheckCircle, AlertCircle, Play, Dumbbell, Star, Upload, Eye, X, Menu, ExternalLink, BookOpen } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import ProgressPhotos from '@/components/ProgressPhotos';
import strikingLogo from "@/assets/Logo-Striking-Borda.png";

const StudentDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesMarkedAsRead, setMessagesMarkedAsRead] = useState<Set<string>>(new Set());
  
  // Marcar mensagens como lidas quando visualizar a aba de mensagens
  useEffect(() => {
    if (selectedTab === "messages" && messages.length > 0) {
      const timer = setTimeout(() => {
        markUnreadMessagesAsRead();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [selectedTab, messages.length]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [sessionData, setSessionData] = useState({
    duration: '',
    notes: '',
    observation: '',
    rating: 3,
    completed: true
  });
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<any[]>([]);
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [challengeUpdateOpen, setChallengeUpdateOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [workoutDetailOpen, setWorkoutDetailOpen] = useState(false);
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState<any>(null);
  const [cancelConsultationOpen, setCancelConsultationOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (user && user.type === 'student') {
      fetchStudentData();
      
      // Carregar mensagens marcadas como lidas do localStorage
      const savedReadMessages = localStorage.getItem(`messages_read_${user.id}`);
      if (savedReadMessages) {
        try {
          const readMessageIds = JSON.parse(savedReadMessages);
          setMessagesMarkedAsRead(new Set(readMessageIds));
        } catch (error) {
          console.error('Erro ao carregar mensagens lidas do localStorage:', error);
        }
      }
    }
  }, [user]);

  // Atualizar dados quando a página for focada novamente e listener em tempo real
  useEffect(() => {
    const handleFocus = () => {
      if (user && user.type === 'student') {
        fetchMessages().then(() => {
          // Se estiver na aba de mensagens, marcar como lidas
          if (selectedTab === "messages") {
            setTimeout(() => markUnreadMessagesAsRead(), 2000);
          }
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    
    // Listener em tempo real para mudanças na tabela de mensagens
    const channel = supabase
      .channel('messages-changes-student')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Mensagem atualizada:', payload);
          // Atualizar o estado local quando uma mensagem for marcada como lida
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, ...payload.new }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('focus', handleFocus);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchStudentData = async () => {
    try {
      // Buscar perfil do estudante
      const { data: profile, error: profileError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
        
      if (!profile) {
        console.error('Perfil do estudante não encontrado');
        return;
      }

      // Buscar planos de treino
      const { data: plans } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('student_id', profile?.id)
        .eq('active', true);

      // Buscar sessões de treino
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('student_id', profile?.id)
        .order('completed_at', { ascending: false });

      // Buscar atividades recentes
      const { data: activities } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('student_id', profile?.id)
        .order('logged_at', { ascending: false })
        .limit(5);

      // Buscar consultas
      const { data: consultationsData } = await supabase
        .from('consultations')
        .select('*')
        .eq('student_id', profile?.id)
        .order('scheduled_at', { ascending: false });

      // Buscar assinatura
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('student_id', profile?.id)
        .eq('active', true)
        .maybeSingle();

      // Buscar desafios do aluno
      const { data: challengesData } = await supabase
        .from('student_challenges')
        .select(`
          *,
          challenges (
            title,
            description,
            points,
            difficulty,
            category
          )
        `)
        .eq('student_id', profile?.id)
        .order('assigned_at', { ascending: false });

      // Buscar fotos de progresso
      const { data: photosData } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('student_id', profile?.id)
        .order('taken_at', { ascending: false });

      // Buscar mensagens
      const { data: messagesData } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(name, email),
          receiver:users!receiver_id(name, email)
        `)
        .eq('receiver_id', user?.id)
        .order('sent_at', { ascending: false });

      if (messagesData) {
        // Aplicar estado local de mensagens já marcadas como lidas
        const updatedMessages = messagesData.map(msg => {
          if (messagesMarkedAsRead.has(msg.id)) {
            return { ...msg, read_at: new Date().toISOString() };
          }
          return msg;
        });
        
        setMessages(updatedMessages);
      }

      setStudentData(profile);
      setWorkoutPlans(plans || []);
      setWorkoutSessions(sessions || []);
      setRecentActivities(activities || []);
      setConsultations(consultationsData || []);
      setSubscription(subscriptionData);
      setChallenges(challengesData || []);
      setProgressPhotos(photosData || []);
      
      // Se estiver na aba de mensagens, marcar como lidas após carregar
      if (selectedTab === "messages" && messagesData && messagesData.length > 0) {
        setTimeout(() => markUnreadMessagesAsRead(), 2000);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!user?.id) return;
    
    try {
      const { data: messagesData } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(name, email),
          receiver:users!receiver_id(name, email)
        `)
        .eq('receiver_id', user.id)
        .order('sent_at', { ascending: false });
      
      if (messagesData) {
        // Aplicar estado local de mensagens já marcadas como lidas
        const updatedMessages = messagesData.map(msg => {
          if (messagesMarkedAsRead.has(msg.id)) {
            return { ...msg, read_at: new Date().toISOString() };
          }
          return msg;
        });
        
        setMessages(updatedMessages);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
      
      // Atualizar o estado local
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  };

  const markUnreadMessagesAsRead = async () => {
    if (!user?.id || !messages.length) return;
    
    try {
      const unreadMessages = messages.filter(m => !m.read_at && m.receiver_id === user.id && !messagesMarkedAsRead.has(m.id));
      
      if (unreadMessages.length > 0) {
        console.log('Marcando mensagens como lidas:', unreadMessages.length);
        
        const { error } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(m => m.id));
        
        if (error) {
          console.error('Erro ao marcar mensagens como lidas:', error);
          return;
        }
        
        // Atualizar o estado local
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            unreadMessages.find(unread => unread.id === msg.id)
              ? { ...msg, read_at: new Date().toISOString() }
              : msg
          )
        );
        
        // Marcar no controle local para não reprocessar
        const newMarkedAsRead = new Set(messagesMarkedAsRead);
        unreadMessages.forEach(msg => newMarkedAsRead.add(msg.id));
        setMessagesMarkedAsRead(newMarkedAsRead);
        
        // Salvar no localStorage para persistir entre recarregamentos
        localStorage.setItem(`messages_read_${user.id}`, JSON.stringify(Array.from(newMarkedAsRead)));
        
        console.log('Mensagens marcadas como lidas com sucesso');
      }
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user || user.type !== 'student') {
    return <div className="flex items-center justify-center min-h-screen">Acesso negado</div>;
  }

  const nextConsultation = consultations.find(c => c.status === 'scheduled');
  const currentPlan = workoutPlans[0];
  const planType = subscription?.plan_type || 'basic';
  
  // Calcular estatísticas de mensagens
  const unreadMessages = messages.filter(m => !m.read_at).length;
  const recentMessages = messages.slice(0, 3);
  // Calcular estatísticas reais baseadas nos workout_sessions
  const currentWeek = currentPlan?.current_week || 1;
  const completedWeeks = currentPlan?.completed_weeks || 0;
  const totalWeeks = currentPlan?.duration_weeks || 12;
  const weeklyGoal = currentPlan?.frequency_per_week || 4;
  
  // Calcular treinos da semana atual do plano - não da semana do calendário
  const currentPlanWeek = currentPlan?.current_week || 1;
  
  // Treinos realizados na semana atual do plano
  const currentWeekSessions = workoutSessions.filter(session => {
    return session.week_number === currentPlanWeek && 
           session.completed_status !== false;
  });
  
  const completedWorkouts = currentWeekSessions.length;
  
  // Treinos não realizados na semana atual do plano
  const currentWeekNotCompleted = workoutSessions.filter(session => {
    return session.week_number === currentPlanWeek && 
           session.completed_status === false;
  });
  
  // Treinos restantes = meta semanal - treinos realizados
  const remainingWorkouts = Math.max(0, weeklyGoal - completedWorkouts);

  // Calcular sequência de dias consecutivos - apenas treinos realizados
  const calculateStreak = () => {
    const completedSessions = workoutSessions.filter(session => session.completed_status !== false);
    if (completedSessions.length === 0) return 0;
    
    const sortedSessions = [...completedSessions].sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.completed_at);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (sessionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDate.getTime() < currentDate.getTime()) {
        break;
      }
    }
    
    return streak;
  };
  
  const streak = calculateStreak();

  // Transformar dados do banco para o formato esperado
  const workoutPlan = workoutPlans.map(plan => {
    const exercises = plan.exercises as any;
    
    // Calcular progresso da semana atual
    const currentWeekSessions = workoutSessions.filter(session => {
      return session.workout_plan_id === plan.id && 
             session.week_number === (plan.current_week || 1) &&
             session.completed_status !== false;
    });
    
    const weeklyGoal = plan.frequency_per_week || 4;
    const currentWeekProgress = currentWeekSessions.length;
    const weekCompleted = currentWeekProgress >= weeklyGoal;
    
    return {
      id: plan.id,
      name: plan.title,
      exercises: exercises,
      duration: `${plan.duration_weeks} semanas`,
      completed: weekCompleted,
      description: plan.description,
      workout_type: plan.workout_type,
      time_cap: plan.time_cap_minutes,
      current_week: plan.current_week || 1,
      weekly_progress: currentWeekProgress,
      weekly_goal: weeklyGoal,
      next_day: currentWeekProgress + 1
    };
  });

  // Transformar atividades recentes para o formato esperado
  const formattedActivities = workoutSessions.slice(0, 5).map(session => ({
    date: new Date(session.completed_at).toLocaleDateString('pt-BR'),
    activity: 'Treino',
    duration: `${session.duration_minutes || 0} min`,
    rating: session.rating || 0
  }));

  const handleWorkoutStart = (workout: any) => {
    setSelectedWorkout(workout);
    setDialogOpen(true);
  };

  const handleWorkoutComplete = async () => {
    if (!selectedWorkout || !studentData) return;

    try {
      // Calcular qual dia da semana registrar baseado no progresso atual
      const currentWeekSessions = workoutSessions.filter(session => {
        return session.workout_plan_id === selectedWorkout.id && 
               session.week_number === currentWeek &&
               session.completed_status !== false;
      });
      
      const nextDayNumber = currentWeekSessions.length + 1;
      
      const { error } = await supabase
        .from('workout_sessions')
        .insert({
          workout_plan_id: selectedWorkout.id,
          student_id: studentData.id,
          week_number: currentWeek,
          day_number: nextDayNumber,
          duration_minutes: sessionData.completed ? (parseInt(sessionData.duration) || null) : null,
          notes: sessionData.notes || null,
          observation: sessionData.observation || null,
          rating: sessionData.completed ? sessionData.rating : null,
          completed_status: sessionData.completed
        });

      if (error) throw error;

      toast({
        title: sessionData.completed ? 'Treino concluído!' : 'Treino registrado como não realizado',
        description: sessionData.completed ? 'Sua sessão foi registrada com sucesso.' : 'Registrado como não realizado.'
      });

      fetchStudentData();
      setDialogOpen(false);
      setSessionData({ duration: '', notes: '', observation: '', rating: 3, completed: true });
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar treino',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    }
  };

  const handleJoinMeeting = (meetingLink: string) => {
    if (meetingLink) {
      window.open(meetingLink, '_blank');
    } else {
      toast({
        title: 'Link não disponível',
        description: 'O link da reunião ainda não foi definido pelo professor.',
        variant: 'destructive'
      });
    }
  };

  const handleCancelConsultation = async () => {
    if (!selectedConsultation || !cancellationReason.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe o motivo do cancelamento.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('consultations')
        .update({ 
          status: 'cancelled',
          notes: `Cancelado pelo aluno. Motivo: ${cancellationReason}`
        })
        .eq('id', selectedConsultation.id);

      if (error) throw error;

      toast({
        title: 'Consulta cancelada',
        description: 'Sua consulta foi cancelada e o professor foi notificado.'
      });

      setCancelConsultationOpen(false);
      setCancellationReason('');
      setSelectedConsultation(null);
      fetchStudentData();
    } catch (error: any) {
      toast({
        title: 'Erro ao cancelar consulta',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !studentData) return;

    try {
      // Simulação de upload - em produção, usar Supabase Storage
      const photoUrl = URL.createObjectURL(file);
      
      const { error } = await supabase
        .from('progress_photos')
        .insert({
          student_id: studentData.id,
          photo_url: photoUrl,
          description: 'Foto de progresso'
        });

      if (error) throw error;

      toast({
        title: 'Foto enviada!',
        description: 'Sua foto de progresso foi salva.'
      });

      fetchStudentData();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar foto',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleChallengeUpdate = async (challengeId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('student_challenges')
        .update({
          status: completed ? 'completed' : 'active',
          completed_at: completed ? new Date().toISOString() : null,
          progress: completed ? 100 : 0
        })
        .eq('id', challengeId);

      if (error) throw error;

      toast({
        title: completed ? 'Desafio concluído!' : 'Desafio reativado',
        description: completed ? 'Parabéns pela conquista!' : 'Desafio marcado como pendente.'
      });

      fetchStudentData();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar desafio',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Componente de navegação responsiva - apenas para desktop
  const NavigationTabs = () => (
    <TabsList className="bg-card/50 backdrop-blur-sm grid-cols-6 w-full grid">
      <TabsTrigger value="overview">Visão Geral</TabsTrigger>
      <TabsTrigger value="workouts">Treinos</TabsTrigger>
      <TabsTrigger value="progress">Progresso</TabsTrigger>
      <TabsTrigger value="challenges">Desafios</TabsTrigger>
      <TabsTrigger value="consultations">Consultas</TabsTrigger>
                <TabsTrigger value="messages" className="relative">
                  Mensagens
                  {unreadMessages > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {unreadMessages}
                    </Badge>
                  )}
                </TabsTrigger>
    </TabsList>
  );

  // Bottom Navigation para mobile
  const MobileBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 md:hidden">
      <div className="grid grid-cols-4 gap-1 p-2">
        <Button
          variant={selectedTab === "overview" ? "default" : "ghost"}
          onClick={() => setSelectedTab("overview")}
          className="flex flex-col items-center gap-1 h-auto py-2"
        >
          <Activity className="h-4 w-4" />
          <span className="text-xs">Geral</span>
        </Button>
        <Button
          variant={selectedTab === "workouts" ? "default" : "ghost"}
          onClick={() => setSelectedTab("workouts")}
          className="flex flex-col items-center gap-1 h-auto py-2"
        >
          <Dumbbell className="h-4 w-4" />
          <span className="text-xs">Treinos</span>
        </Button>
        <Button
          variant={selectedTab === "progress" ? "default" : "ghost"}
          onClick={() => setSelectedTab("progress")}
          className="flex flex-col items-center gap-1 h-auto py-2"
        >
          <Trophy className="h-4 w-4" />
          <span className="text-xs">Progresso</span>
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Menu className="h-4 w-4" />
              <span className="text-xs">Mais</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[320px]">
            <div className="grid grid-cols-1 gap-4 mt-4">
              <Button
                variant={selectedTab === "challenges" ? "default" : "outline"}
                onClick={() => setSelectedTab("challenges")}
                className="justify-start"
              >
                <Target className="h-4 w-4 mr-2" />
                Desafios
              </Button>
              <Button
                variant={selectedTab === "consultations" ? "default" : "outline"}
                onClick={() => setSelectedTab("consultations")}
                className="justify-start"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Consultas
              </Button>
              <Button
                variant={selectedTab === "messages" ? "default" : "outline"}
                onClick={() => setSelectedTab("messages")}
                className="justify-start relative"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Mensagens
                {unreadMessages > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {unreadMessages}
                  </Badge>
                )}
              </Button>
              {planType === "premium" && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/student-exercise-library")}
                  className="justify-start"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Biblioteca de Exercícios
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={strikingLogo} alt="Striking Consult" className="h-6 w-auto md:h-8" />
              <h1 className="text-lg md:text-xl font-bold text-foreground">Striking Consult</h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Welcome Section */}
        <div className="mb-4 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Olá, {user.name}!</h2>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Vamos continuar sua jornada fitness hoje</p>
          <Badge variant={planType === "premium" ? "default" : "secondary"} className="mt-2">
            Plano {planType === "premium" ? "Premium" : "Básico"}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progresso do Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{completedWeeks}/{totalWeeks}</div>
              <Progress value={(completedWeeks / totalWeeks) * 100} className="mt-2" />
              <div className="text-xs text-muted-foreground mt-1">semanas completas</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Treinos Esta Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{completedWorkouts}/{weeklyGoal}</div>
              <Progress value={(completedWorkouts / weeklyGoal) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sequência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                {streak} dias
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Próxima Consulta</CardTitle>
            </CardHeader>
            <CardContent>
              {planType === "premium" ? (
                <>
                  <div className="text-sm font-medium text-foreground">
                    {nextConsultation ? 
                      new Date(nextConsultation.scheduled_at).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 
                      'Não agendada'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {nextConsultation ? 'Agendada' : 'Agende uma consulta'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium text-foreground">
                    Disponível no Premium
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Upgrade para acesso completo
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          {/* Navegação apenas para desktop */}
          <div className="hidden md:block">
            <TabsList className="grid w-full grid-cols-6 bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="workouts">Treinos</TabsTrigger>
              <TabsTrigger value="progress">Progresso</TabsTrigger>
              <TabsTrigger value="challenges">Desafios</TabsTrigger>
              <TabsTrigger value="consultations">Consultas</TabsTrigger>
              <TabsTrigger value="messages" className="relative">
                Mensagens
                {unreadMessages > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {unreadMessages}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Acesso Rápido - apenas para usuários premium */}
            {planType === "premium" && (
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Acesso Rápido
                  </CardTitle>
                  <CardDescription>Ferramentas disponíveis para seu plano Premium</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/student-exercise-library")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <BookOpen className="h-6 w-6" />
                      <span className="text-sm">Biblioteca de Exercícios</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/student-appointments")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <Calendar className="h-6 w-6" />
                      <span className="text-sm">Agendar Consulta</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTab("progress")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <Camera className="h-6 w-6" />
                      <span className="text-sm">Fotos de Progresso</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plano de Treino Atual */}
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Plano de Treino Atual
                  </CardTitle>
                  <CardDescription>Semana {currentWeek} de {totalWeeks}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workoutPlan.map((workout) => (
                    <div key={workout.id} className="p-4 rounded-lg bg-background/50 border border-border/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {workout.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Play className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium">{workout.name}</div>
                            <div className="text-sm text-muted-foreground">{workout.duration}</div>
                          </div>
                        </div>
                        <Button 
                          variant={workout.completed ? "secondary" : "default"} 
                          size="sm"
                          disabled={workout.completed}
                          onClick={() => handleWorkoutStart(workout)}
                        >
                          {workout.completed ? "Concluído" : "Iniciar"}
                        </Button>
                      </div>
                      
                      {workout.exercises && (
                        <div className="space-y-2">
                          {workout.exercises.warmup && (
                            <div className="text-sm">
                              <span className="font-medium text-primary">Warm-up:</span>
                              <div className="ml-2 text-muted-foreground">
                                {workout.exercises.warmup.map((ex: any, idx: number) => (
                                  <div key={idx}>• {ex.name} - {ex.sets}x{ex.reps}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {workout.exercises.strength && (
                            <div className="text-sm">
                              <span className="font-medium text-primary">Strength:</span>
                              <div className="ml-2 text-muted-foreground">
                                {workout.exercises.strength.map((ex: any, idx: number) => (
                                  <div key={idx}>• {ex.name} - {ex.sets}x{ex.reps} @ {ex.weight}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {workout.exercises.metcon && (
                            <div className="text-sm">
                              <span className="font-medium text-primary">MetCon:</span>
                              <div className="ml-2 text-muted-foreground">
                                {workout.exercises.metcon.map((ex: any, idx: number) => (
                                  <div key={idx}>• {ex.name} - {ex.sets}x{ex.reps}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {workout.exercises.cooldown && (
                            <div className="text-sm">
                              <span className="font-medium text-primary">Cool Down:</span>
                              <div className="ml-2 text-muted-foreground">
                                {workout.exercises.cooldown.map((ex: any, idx: number) => (
                                  <div key={idx}>• {ex.name} - {ex.duration || (ex.sets + 'x' + ex.reps)}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Atividades Recentes */}
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Atividades Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formattedActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div>
                        <div className="font-medium">{activity.activity}</div>
                        <div className="text-sm text-muted-foreground">{activity.date} • {activity.duration}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < activity.rating ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workouts">
            <div className="space-y-6">
              {/* Status da Semana */}
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Status da Semana {currentPlanWeek}
                  </CardTitle>
                  <CardDescription>
                    {completedWorkouts} de {weeklyGoal} treinos realizados nesta semana do plano
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-600">Realizados</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{completedWorkouts}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <X className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-600">Não Realizados</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">{currentWeekNotCompleted.length}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-600">Restantes</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{remainingWorkouts}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-600">Progresso</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">{Math.round((completedWorkouts / weeklyGoal) * 100)}%</div>
                    </div>
                  </div>
                  
                  <Progress value={(completedWorkouts / weeklyGoal) * 100} className="mb-4" />
                  
                  {/* Histórico da Semana */}
                  {(currentWeekSessions.length > 0 || currentWeekNotCompleted.length > 0) && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Histórico da semana {currentPlanWeek}:</h4>
                      {[...currentWeekSessions, ...currentWeekNotCompleted]
                        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
                        .map((session, index) => (
                           <div key={index} className="flex flex-col md:flex-row md:items-center md:justify-between p-3 rounded-lg bg-background/50 border border-border/20 gap-3">
                             <div className="flex items-center gap-3">
                               {session.completed_status !== false ? (
                                 <CheckCircle className="h-5 w-5 text-green-500" />
                               ) : (
                                 <X className="h-5 w-5 text-red-500" />
                               )}
                               <div>
                                 <div className="font-medium">
                                   {session.completed_status !== false ? 'Treino Realizado' : 'Treino Não Realizado'}
                                 </div>
                                 <div className="text-sm text-muted-foreground">
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
                              <div className="flex items-center gap-2 justify-between md:justify-end">
                                {session.rating && (
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
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
                                  className="text-xs px-2"
                                >
                                  <Eye className="h-4 w-4 md:mr-1" />
                                  <span className="hidden md:inline">Detalhes</span>
                                </Button>
                              </div>
                           </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Plano de Treino */}
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Meus Treinos</CardTitle>
                  <CardDescription>Acompanhe seu plano de treino semanal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workoutPlan.map((workout) => (
                      <div key={workout.id} className="border border-border/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{workout.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={workout.completed ? "secondary" : "default"}>
                              {workout.completed ? "Semana Completa" : `${workout.weekly_progress}/${workout.weekly_goal} treinos`}
                            </Badge>
                            <Badge variant="outline">
                              Semana {workout.current_week}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          Duração: {workout.duration} | Tipo: {workout.workout_type} | Time Cap: {workout.time_cap || 'N/A'} min
                        </div>
                        {workout.description && (
                          <div className="text-sm mb-3 p-2 bg-background/50 rounded">
                            {workout.description}
                          </div>
                        )}
                        
                        {workout.exercises && (
                          <div className="space-y-3">
                            {workout.exercises.warmup && (
                              <div className="border-l-4 border-primary pl-3">
                                <h4 className="font-medium text-primary mb-1">Warm-up</h4>
                                <div className="space-y-1">
                                  {workout.exercises.warmup.map((ex: any, idx: number) => (
                                    <div key={idx} className="text-sm bg-background/50 p-2 rounded">
                                      {ex.name} - {ex.reps} {ex.time && `• ${ex.time}`}
                                      {ex.notes && <div className="text-xs text-muted-foreground mt-1">{ex.notes}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {workout.exercises.strength && (
                              <div className="border-l-4 border-orange-500 pl-3">
                                <h4 className="font-medium text-orange-500 mb-1">Strength</h4>
                                <div className="space-y-1">
                                  {workout.exercises.strength.map((ex: any, idx: number) => (
                                    <div key={idx} className="text-sm bg-background/50 p-2 rounded">
                                      {ex.name} - {ex.reps} @ {ex.weight}
                                      {ex.notes && <div className="text-xs text-muted-foreground mt-1">{ex.notes}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {workout.exercises.metcon && (
                              <div className="border-l-4 border-red-500 pl-3">
                                <h4 className="font-medium text-red-500 mb-1">MetCon</h4>
                                <div className="space-y-1">
                                  {workout.exercises.metcon.map((ex: any, idx: number) => (
                                    <div key={idx} className="text-sm bg-background/50 p-2 rounded">
                                      {ex.name} - {ex.reps} {ex.time && `• ${ex.time}`}
                                      {ex.notes && <div className="text-xs text-muted-foreground mt-1">{ex.notes}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {workout.exercises.cooldown && (
                              <div className="border-l-4 border-blue-500 pl-3">
                                <h4 className="font-medium text-blue-500 mb-1">Cool Down</h4>
                                <div className="space-y-1">
                                  {workout.exercises.cooldown.map((ex: any, idx: number) => (
                                    <div key={idx} className="text-sm bg-background/50 p-2 rounded">
                                      {ex.name} - {ex.time || ex.reps}
                                      {ex.notes && <div className="text-xs text-muted-foreground mt-1">{ex.notes}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex flex-col md:flex-row items-center gap-2 mt-4">
                          <Button 
                            variant={workout.completed ? "secondary" : "default"} 
                            size="sm"
                            disabled={workout.completed}
                            onClick={() => handleWorkoutStart(workout)}
                            className="w-full md:w-auto text-xs md:text-sm"
                          >
                            {workout.completed ? "Semana Completa" : `📝 Registrar Dia ${workout.next_day}`}
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedWorkout(workout);
                              setSessionData({
                                ...sessionData,
                                completed: true,
                                duration: '45',
                                notes: 'Treino marcado como realizado'
                              });
                              handleWorkoutComplete();
                            }}
                            className="w-full md:w-auto text-xs md:text-sm"
                          >
                            ✓ Realizado
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedWorkout(workout);
                              setSessionData({
                                ...sessionData,
                                completed: false,
                                duration: '',
                                notes: 'Treino não realizado'
                              });
                              handleWorkoutComplete();
                            }}
                            className="w-full md:w-auto text-xs md:text-sm"
                          >
                            ✗ Não Realizado
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Estatísticas Rápidas */}
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Treinos Completados</span>
                      <span className="font-semibold">{workoutSessions.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tempo Total</span>
                      <span className="font-semibold">
                        {Math.floor(workoutSessions.reduce((total, session) => total + (session.duration_minutes || 0), 0) / 60)}h {workoutSessions.reduce((total, session) => total + (session.duration_minutes || 0), 0) % 60}min
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Média Semanal</span>
                      <span className="font-semibold">{(workoutSessions.length / Math.max(1, Math.ceil((Date.now() - new Date(workoutSessions[workoutSessions.length - 1]?.completed_at || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)))).toFixed(1)} treinos</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Maior Sequência</span>
                      <span className="font-semibold">{streak} dias</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fotos de Progresso */}
              <div className="lg:col-span-2">
                {planType === "premium" ? (
                  <ProgressPhotos studentId={studentData?.id} isStudentView={true} />
                ) : (
                  <Card className="bg-card/50 backdrop-blur-sm">
                    <CardContent className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Fotos de progresso estão disponíveis apenas no plano Premium
                      </p>
                      <Button onClick={() => navigate('/plans')}>Upgrade para Premium</Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="challenges">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Meus Desafios
                </CardTitle>
                <CardDescription>Acompanhe seus desafios e conquistas</CardDescription>
              </CardHeader>
              <CardContent>
                {challenges.length > 0 ? (
                  <div className="space-y-4">
                    {challenges.map((challenge) => (
                      <div key={challenge.id} className="border border-border/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              challenge.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                            <div>
                              <h3 className="font-semibold">{challenge.challenges.title}</h3>
                              <p className="text-sm text-muted-foreground">{challenge.challenges.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={challenge.challenges.difficulty === 'easy' ? 'secondary' : 
                                           challenge.challenges.difficulty === 'medium' ? 'default' : 'destructive'}>
                              {challenge.challenges.difficulty}
                            </Badge>
                            <Badge variant="outline">{challenge.challenges.points} pts</Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Progress value={challenge.progress || 0} className="w-32" />
                            <span className="text-sm text-muted-foreground">{challenge.progress || 0}%</span>
                          </div>
                          
                          <Button
                            size="sm"
                            variant={challenge.status === 'completed' ? 'secondary' : 'default'}
                            onClick={() => handleChallengeUpdate(challenge.id, challenge.status !== 'completed')}
                          >
                            {challenge.status === 'completed' ? 'Concluído' : 'Marcar como Completo'}
                          </Button>
                        </div>
                        
                        {challenge.completed_at && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Concluído em: {new Date(challenge.completed_at).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum desafio atribuído ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultations">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Minhas Consultas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {planType === "premium" ? (
                  <div className="space-y-4">
                    {consultations.length > 0 ? (
                      <>
                        {consultations.map((consultation) => (
                          <div key={consultation.id} className="border border-border/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{consultation.type === 'initial' ? 'Consulta Inicial' : 'Consulta de Acompanhamento'}</h3>
                              <Badge variant={consultation.status === 'scheduled' ? 'default' : consultation.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                {consultation.status === 'scheduled' ? 'Agendada' : consultation.status === 'cancelled' ? 'Cancelada' : 'Concluída'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-3">
                              <Clock className="h-4 w-4 inline mr-1" />
                              {new Date(consultation.scheduled_at).toLocaleDateString('pt-BR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} ({consultation.duration_minutes || 40} min)
                            </div>
                            {consultation.status === 'scheduled' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleJoinMeeting(consultation.google_meet_link)}
                                  disabled={!consultation.google_meet_link}
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Entrar na Reunião
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedConsultation(consultation);
                                    setCancelConsultationOpen(true);
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="pt-4 border-t">
                          <Button 
                            className="w-full" 
                            variant="outline" 
                            onClick={() => navigate('/student-appointments')}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Ver Todos os Agendamentos
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">Nenhuma consulta agendada</p>
                        <p className="text-sm text-muted-foreground">
                          Entre em contato com seu professor para agendar uma consulta
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Consultas estão disponíveis apenas no plano Premium
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Entre em contato com seu professor para fazer upgrade
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
                          </span>
                          {unreadMessages > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {unreadMessages} nova{unreadMessages !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate("/student-messages")}
                        >
                          Ver Todas
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {recentMessages.map((message) => (
                          <div 
                            key={message.id} 
                            className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/80 ${
                              !message.read_at ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' : 'bg-muted/50'
                            }`}
                            onClick={() => navigate("/student-messages")}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {message.sender?.name || 'Professor'}
                                  </span>
                                  {!message.read_at && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {message.message}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.sent_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => navigate("/student-messages")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Abrir Mensagens
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">Nenhuma mensagem ainda</p>
                      <Button onClick={() => navigate("/student-messages")}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Abrir Mensagens
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Bottom Navigation para mobile */}
        <MobileBottomNav />
      </div>
      
      {/* Padding adicional para evitar sobreposição com bottom nav */}
      <div className="h-20 md:hidden"></div>

      {/* Diálogo de Registro de Treino */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Treino</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duração (min)
              </Label>
              <Input
                id="duration"
                type="number"
                value={sessionData.duration}
                onChange={(e) => setSessionData({...sessionData, duration: e.target.value})}
                className="col-span-3"
                placeholder="Ex: 45"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Observações
              </Label>
              <Textarea
                id="notes"
                value={sessionData.notes}
                onChange={(e) => setSessionData({...sessionData, notes: e.target.value})}
                className="col-span-3"
                placeholder="Como foi o treino?"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="observation" className="text-right">
                Observação
              </Label>
              <Textarea
                id="observation"
                value={sessionData.observation}
                onChange={(e) => setSessionData({...sessionData, observation: e.target.value})}
                className="col-span-3"
                placeholder="Observações específicas do treino"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="completed" className="text-right">
                Treino Realizado
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  id="completed"
                  checked={sessionData.completed}
                  onCheckedChange={(checked) => setSessionData({...sessionData, completed: !!checked})}
                />
                <Label htmlFor="completed" className="text-sm">
                  Marcar como realizado
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">
                Avaliação
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= sessionData.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                    }`}
                    onClick={() => setSessionData({...sessionData, rating: star})}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleWorkoutComplete}>
              {sessionData.completed ? 'Concluir Treino' : 'Registrar como Não Realizado'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Treino */}
      <Dialog open={workoutDetailOpen} onOpenChange={setWorkoutDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Treino</DialogTitle>
          </DialogHeader>
          {selectedWorkoutDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              {selectedWorkoutDetail.duration_minutes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Duração</Label>
                  <p className="text-sm font-medium">{selectedWorkoutDetail.duration_minutes} minutos</p>
                </div>
              )}

              {selectedWorkoutDetail.rating && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Avaliação</Label>
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
                  <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
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
                <Label className="text-sm font-medium text-muted-foreground">Informações do Treino</Label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Semana:</span> {selectedWorkoutDetail.week_number}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Dia:</span> {selectedWorkoutDetail.day_number}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Cancelamento de Consulta */}
      <Dialog open={cancelConsultationOpen} onOpenChange={setCancelConsultationOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cancelar Consulta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Motivo do cancelamento</Label>
              <Textarea 
                placeholder="Informe o motivo do cancelamento e solicite uma nova data se necessário..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelConsultationOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCancelConsultation}
                disabled={!cancellationReason.trim()}
                variant="destructive"
              >
                Cancelar Consulta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
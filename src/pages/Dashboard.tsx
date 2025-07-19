import { useState, useEffect } from "react";
import { Footer } from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserMenu } from '@/components/UserMenu';
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import strikingLogo from "@/assets/Logo-Striking-Borda.png";
import { 
  Users, 
  Calendar, 
  Activity, 
  Trophy, 
  MessageCircle, 
  BookOpen,
  Target,
  Heart,
  Dumbbell,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  UserPlus,
  MessageSquare
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [professorProfile, setProfessorProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesMarkedAsRead, setMessagesMarkedAsRead] = useState<Set<string>>(new Set());
  
  // Marcar mensagens como lidas quando visualizar a seção de mensagens
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        markUnreadMessagesAsRead();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [messages.length]); // Dependência apenas no length para evitar loops

  useEffect(() => {
    if (user && user.type === 'professor') {
      fetchProfessorData();
      
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
      if (user && user.type === 'professor') {
        fetchMessages().then(() => {
          // Aguardar um pouco para garantir que as mensagens foram carregadas
          setTimeout(() => markUnreadMessagesAsRead(), 2000);
        });
      }
    };

    window.addEventListener('focus', handleFocus);

    // Listener em tempo real para mudanças na tabela de mensagens
    const channel = supabase
      .channel('messages-changes')
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

  const fetchProfessorData = async () => {
    try {
      // Buscar perfil do professor
      const { data: profile } = await supabase
        .from('professor_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      // Buscar todos os alunos cadastrados
      const { data: studentsData } = await supabase
        .from('student_profiles')
        .select(`
          *,
          users!inner (
            name,
            email
          )
        `);

      // Buscar planos de treino criados pelo professor
      const { data: workoutPlans } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('professor_id', profile?.id);

      // Buscar assinaturas dos alunos
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*');

      // Buscar consultas do professor
      const { data: consultationsData } = await supabase
        .from('consultations')
        .select(`
          *,
          student_profiles!inner (
            users!inner (
              name
            )
          )
        `)
        .eq('professor_id', profile?.id)
        .order('scheduled_at', { ascending: false });

      // Buscar atividades recentes - incluindo treinos concluídos, consultas e activity_logs
      const activitiesPromises = [
        // Buscar workout sessions recentes
        supabase
          .from('workout_sessions')
          .select(`
            *,
            student_profiles!inner (
              users!inner (
                name
              )
            ),
            workout_plans!inner (
              title
            )
          `)
          .eq('completed_status', true)
          .order('completed_at', { ascending: false })
          .limit(10),
        
        // Buscar consultas recentes
        supabase
          .from('consultations')
          .select(`
            *,
            student_profiles!inner (
              users!inner (
                name
              )
            )
          `)
          .eq('status', 'completed')
          .order('scheduled_at', { ascending: false })
          .limit(5),
        
        // Buscar activity_logs
        supabase
          .from('activity_logs')
          .select(`
            *,
            student_profiles!inner (
              users!inner (
                name
              )
            )
          `)
          .order('logged_at', { ascending: false })
          .limit(5)
      ];

      const [workoutSessionsRes, consultationsRes, activityLogsRes] = await Promise.all(activitiesPromises);

      // Combinar e ordenar todas as atividades
      const allActivities = [
        ...(workoutSessionsRes.data || []).map(session => ({
          type: 'workout_session',
          student_name: session.student_profiles?.users?.name,
          description: `completou o treino "${session.workout_plans?.title || 'Treino'}"`,
          date: session.completed_at,
          icon: 'workout'
        })),
        ...(consultationsRes.data || []).map(consultation => ({
          type: 'consultation',
          student_name: consultation.student_profiles?.users?.name,
          description: `teve uma consulta de ${consultation.type}`,
          date: consultation.scheduled_at,
          icon: 'consultation'
        })),
        ...(activityLogsRes.data || []).map(log => ({
          type: 'activity_log',
          student_name: log.student_profiles?.users?.name,
          description: `registrou uma atividade: ${log.activity_type}`,
          date: log.logged_at,
          icon: 'activity'
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      // Buscar mensagens
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
      
      setTimeout(() => markUnreadMessagesAsRead(), 2000);

      // Combinar dados dos alunos com planos e assinaturas
      const studentsWithPlans = (studentsData || []).map(student => {
        const studentPlan = workoutPlans?.find(plan => plan.student_id === student.id);
        const studentSubscription = subscriptions?.find(sub => sub.student_id === student.id);
        
        return {
          ...student,
          workout_plan: studentPlan,
          subscription: studentSubscription,
          active: studentPlan?.active || false
        };
      });

      setProfessorProfile(profile);
      setStudents(studentsWithPlans);
      setConsultations(consultationsData || []);
      setRecentActivities(allActivities || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user || user.type !== 'professor') {
    return <div className="flex items-center justify-center min-h-screen">Acesso negado</div>;
  }

  // Calcular estatísticas dos dados reais
  const todayConsultations = consultations.filter(c => 
    new Date(c.scheduled_at).toDateString() === new Date().toDateString()
  ).length;

  const activeStudents = students.filter(s => s.active).length;
  const completedConsultations = consultations.filter(c => c.status === 'completed').length;
  const successRate = consultations.length > 0 ? Math.round((completedConsultations / consultations.length) * 100) : 0;
  
  // Calcular estatísticas de mensagens
  const unreadMessages = messages.filter(m => !m.read_at).length;
  const recentMessages = messages.slice(0, 3);

  const stats = [
    { title: "Alunos Ativos", value: activeStudents.toString(), icon: Users, color: "text-primary" },
    { title: "Sessões Hoje", value: todayConsultations.toString(), icon: Calendar, color: "text-accent" },
    { title: "Taxa de Sucesso", value: `${successRate}%`, icon: Trophy, color: "text-primary" },
    { title: "Mensagens", value: unreadMessages.toString(), icon: MessageCircle, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={strikingLogo} alt="Striking Consult" className="h-8 w-auto" />
              <h1 className="text-xl font-bold text-foreground">Striking Consult</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/messages')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Mensagens
                {unreadMessages > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {unreadMessages}
                  </Badge>
                )}
              </Button>
              <Button onClick={() => navigate('/student-workout-sessions')}>
                <Activity className="h-4 w-4 mr-2" />
                Acompanhar Treinos
              </Button>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Bem-vindo, {user.name}!</h2>
          <p className="text-muted-foreground">
            Aqui está o resumo das suas atividades hoje
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Students List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Meus Alunos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {students.length > 0 ? (
                students.map((student, index) => {
                  const nextConsultation = consultations.find(c => 
                    c.student_id === student.id && 
                    c.status === 'scheduled'
                  );
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{student.users?.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={student.subscription?.plan_type === "premium" ? "default" : "secondary"}>
                            {student.subscription?.plan_type || "Básico"}
                          </Badge>
                          <Badge variant={student.active ? "default" : "secondary"}>
                            {student.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {nextConsultation ? 
                            new Date(nextConsultation.scheduled_at).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 
                            'Sem consulta agendada'
                          }
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-sm font-medium">
                          {student.workout_plan?.duration_weeks ? 
                            `${student.workout_plan.completed_weeks || 0}/${student.workout_plan.duration_weeks}` : 
                            'Sem plano de treino'
                          }
                        </div>
                        <Progress 
                          value={student.workout_plan?.duration_weeks ? 
                            ((student.workout_plan.completed_weeks || 0) / student.workout_plan.duration_weeks) * 100 : 
                            0
                          } 
                          className="w-20" 
                        />
                        <Button size="sm" variant="outline" onClick={() => navigate('/students')}>
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum aluno cadastrado ainda</p>
                  <Button className="mt-4" onClick={() => navigate('/create-student')}>
                    Cadastrar Primeiro Aluno
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" size="lg" onClick={() => navigate('/students')}>
                <Users className="h-4 w-4 mr-2" />
                Ver Todos os Alunos
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={() => navigate('/create-student')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Novo Aluno
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={() => navigate('/pending-approvals')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovações Pendentes
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={() => navigate('/schedule-consultation')}>
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Consulta
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={() => navigate('/appointments')}>
                <Clock className="h-4 w-4 mr-2" />
                Ver Agendamentos
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={() => navigate('/create-workout-plan')}>
                <Dumbbell className="h-4 w-4 mr-2" />
                Criar Plano de Treino
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={() => navigate('/exercise-library')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Biblioteca de Exercícios
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={() => navigate('/challenges-rewards')}>
                <Trophy className="h-4 w-4 mr-2" />
                Desafios e Conquistas
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={() => navigate('/messages')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Mensagens
                {unreadMessages > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {unreadMessages}
                  </Badge>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Messages Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Mensagens Recentes
              </div>
              {unreadMessages > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadMessages} nova{unreadMessages > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.length > 0 ? (
                <>
                  {recentMessages.map((message, index) => {
                    const isUnread = !message.read_at;
                    return (
                      <div 
                        key={index} 
                        className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isUnread ? 'bg-muted/70 border-l-4 border-l-primary' : 'bg-muted/30'
                        } hover:bg-muted/50`}
                        onClick={() => navigate('/messages')}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {message.sender?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {message.sender?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(message.sent_at).toLocaleDateString('pt-BR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {message.message}
                          </p>
                          {isUnread && (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <span className="text-xs text-primary font-medium">
                                Não lida
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/messages")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Abrir Mensagens
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Nenhuma mensagem ainda</p>
                  <Button onClick={() => navigate("/messages")}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Abrir Mensagens
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => {
                  const getActivityIcon = (type: string) => {
                    switch (type) {
                      case 'workout_session':
                        return <Dumbbell className="h-4 w-4 text-primary" />;
                      case 'consultation':
                        return <Calendar className="h-4 w-4 text-primary" />;
                      case 'activity_log':
                        return <Activity className="h-4 w-4 text-primary" />;
                      default:
                        return <CheckCircle className="h-4 w-4 text-primary" />;
                    }
                  };

                  return (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <strong>{activity.student_name}</strong> {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {getActivityIcon(activity.type)}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  ArrowLeft,
  Plus,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Filter,
  Calendar
} from "lucide-react";
import { Footer } from '@/components/Footer';

const StudentChallenges = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { user } = useAuth();
  const isProfessor = user?.type === 'professor';
  const isStudent = user?.type === 'student';
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [studentChallenges, setStudentChallenges] = useState<any[]>([]);
  const [professorProfile, setProfessorProfile] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      if (isProfessor && studentId) {
        fetchData();
      } else if (isStudent) {
        fetchStudentData();
      }
    }
  }, [user, studentId, isProfessor, isStudent]);

  const fetchData = async () => {
    try {
      // Buscar perfil do professor
      const { data: professorData } = await supabase
        .from('professor_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      setProfessorProfile(professorData);

      // Buscar dados do aluno
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select(`
          *,
          users!inner (
            id,
            name,
            email
          )
        `)
        .eq('id', studentId)
        .single();

      setStudent(studentProfile);

      // Buscar todos os desafios disponíveis
      const { data: allChallenges } = await supabase
        .from('challenges')
        .select('*')
        .order('title');

      setChallenges(allChallenges || []);

      // Buscar desafios atribuídos ao aluno
      const { data: assignedChallenges } = await supabase
        .from('student_challenges')
        .select(`
          *,
          challenges (
            id,
            title,
            description,
            category,
            points,
            difficulty
          )
        `)
        .eq('student_id', studentId)
        .order('assigned_at', { ascending: false });

      setStudentChallenges(assignedChallenges || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos desafios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      // Buscar perfil do estudante logado
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select(`
          *,
          users!inner (
            id,
            name,
            email
          )
        `)
        .eq('user_id', user?.id)
        .single();

      setStudent(studentProfile);

      // Buscar todos os desafios disponíveis (para referência)
      const { data: allChallenges } = await supabase
        .from('challenges')
        .select('*')
        .order('title');

      setChallenges(allChallenges || []);

      // Buscar desafios atribuídos ao aluno logado
      const { data: assignedChallenges } = await supabase
        .from('student_challenges')
        .select(`
          *,
          challenges (
            id,
            title,
            description,
            category,
            points,
            difficulty
          )
        `)
        .eq('student_id', studentProfile?.id)
        .order('assigned_at', { ascending: false });

      setStudentChallenges(assignedChallenges || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos desafios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignChallenge = async () => {
    if (!selectedChallenge || !professorProfile) return;

    try {
      const { error } = await supabase
        .from('student_challenges')
        .insert({
          student_id: studentId,
          challenge_id: selectedChallenge,
          assigned_by: professorProfile.id,
          notes: notes || null,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Desafio atribuído com sucesso!"
      });

      setIsAssignDialogOpen(false);
      setSelectedChallenge('');
      setNotes('');
      fetchData();
    } catch (error) {
      console.error('Erro ao atribuir desafio:', error);
      toast({
        title: "Erro",
        description: "Erro ao atribuir desafio",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (challengeId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('student_challenges')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', challengeId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Status do desafio atualizado para ${newStatus === 'completed' ? 'concluído' : newStatus}`
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do desafio",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return '💪';
      case 'cardio': return '❤️';
      case 'consistency': return '📅';
      case 'lifestyle': return '🌟';
      case 'achievement': return '🏆';
      default: return '🎯';
    }
  };

  const filteredChallenges = studentChallenges.filter(challenge => {
    if (filter === 'all') return true;
    return challenge.status === filter;
  });

  const availableChallenges = challenges.filter(challenge => 
    !studentChallenges.some(sc => sc.challenge_id === challenge.id)
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
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
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Desafios</h1>
                  <p className="text-sm text-muted-foreground">{isStudent ? 'Meus Desafios' : student?.users?.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {isProfessor && (
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Atribuir Desafio
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Atribuir Novo Desafio</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Selecionar Desafio</label>
                      <Select value={selectedChallenge} onValueChange={setSelectedChallenge}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um desafio" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableChallenges.map(challenge => (
                            <SelectItem key={challenge.id} value={challenge.id}>
                              <div className="flex items-center space-x-2">
                                <span>{getCategoryIcon(challenge.category)}</span>
                                <span>{challenge.title}</span>
                                <Badge variant="outline">{challenge.points} pts</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedChallenge && (
                      <div className="p-3 bg-muted rounded-lg">
                        {(() => {
                          const challenge = challenges.find(c => c.id === selectedChallenge);
                          return challenge ? (
                            <div>
                              <p className="font-medium">{challenge.title}</p>
                              <p className="text-sm text-muted-foreground">{challenge.description}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline">{challenge.category}</Badge>
                                <Badge variant="outline">{challenge.difficulty}</Badge>
                                <Badge>{challenge.points} pontos</Badge>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">Observações (opcional)</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Adicione observações sobre este desafio..."
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleAssignChallenge} disabled={!selectedChallenge}>
                        Atribuir Desafio
                      </Button>
                      <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{studentChallenges.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{studentChallenges.filter(c => c.status === 'active').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold">{studentChallenges.filter(c => c.status === 'completed').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pontos</p>
                  <p className="text-2xl font-bold">
                    {studentChallenges
                      .filter(c => c.status === 'completed')
                      .reduce((total, c) => total + (c.challenges?.points || 0), 0)
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(value: 'all' | 'active' | 'completed') => setFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Desafios</SelectItem>
              <SelectItem value="active">Desafios Ativos</SelectItem>
              <SelectItem value="completed">Desafios Concluídos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Challenges List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Desafios do Aluno ({filteredChallenges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredChallenges.length > 0 ? (
              <div className="space-y-4">
                {filteredChallenges.map((studentChallenge) => (
                  <div key={studentChallenge.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{getCategoryIcon(studentChallenge.challenges?.category)}</span>
                          <div>
                            <h3 className="font-semibold">{studentChallenge.challenges?.title}</h3>
                            <p className="text-sm text-muted-foreground">{studentChallenge.challenges?.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 mb-3">
                          <Badge variant="outline">{studentChallenge.challenges?.category}</Badge>
                          <div className={`w-2 h-2 rounded-full ${getDifficultyColor(studentChallenge.challenges?.difficulty)}`}></div>
                          <span className="text-sm capitalize">{studentChallenge.challenges?.difficulty}</span>
                          <Badge>{studentChallenge.challenges?.points} pontos</Badge>
                          <Badge variant={studentChallenge.status === 'completed' ? 'default' : 'secondary'}>
                            {studentChallenge.status === 'completed' ? 'Concluído' : 'Ativo'}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Atribuído em: {new Date(studentChallenge.assigned_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {studentChallenge.completed_at && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>
                                Concluído em: {new Date(studentChallenge.completed_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                          {studentChallenge.notes && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <strong>Observações:</strong> {studentChallenge.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4">
                        {isStudent ? (
                          <Select
                            value={studentChallenge.status}
                            onValueChange={(newStatus) => handleUpdateStatus(studentChallenge.id, newStatus)}
                            disabled={studentChallenge.status === 'completed'}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="completed">Concluído</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select
                            value={studentChallenge.status}
                            onValueChange={(newStatus) => handleUpdateStatus(studentChallenge.id, newStatus)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="completed">Concluído</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhum desafio encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {filter === 'all' 
                    ? 'Este aluno ainda não possui desafios atribuídos.'
                    : `Nenhum desafio ${filter === 'active' ? 'ativo' : 'concluído'} encontrado.`
                  }
                </p>
                <Button onClick={() => setIsAssignDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Atribuir Primeiro Desafio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default StudentChallenges;
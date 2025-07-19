import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trophy, Target, Award, Star, Calendar, Flame, Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface DatabaseChallenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  is_predefined: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface NewChallengeForm {
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  icon: string;
}

export default function ChallengesRewards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<DatabaseChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<DatabaseChallenge | null>(null);
  const [newChallenge, setNewChallenge] = useState<NewChallengeForm>({
    title: '',
    description: '',
    category: 'fitness',
    difficulty: 'medium',
    points: 50,
    icon: '🏆'
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type casting para garantir que difficulty seja do tipo correto
      const typedData = (data || []).map(challenge => ({
        ...challenge,
        difficulty: challenge.difficulty as 'easy' | 'medium' | 'hard'
      }));

      setChallenges(typedData);
    } catch (error: any) {
      console.error('Erro ao carregar desafios:', error);
      toast({
        title: 'Erro ao carregar desafios',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.type !== 'professor') {
      toast({
        title: 'Erro',
        description: 'Apenas professores podem criar desafios',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Buscar o ID do professor
      const { data: professorProfile, error: profileError } = await supabase
        .from('professor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const { error } = await supabase
        .from('challenges')
        .insert({
          title: `${newChallenge.icon} ${newChallenge.title}`,
          description: newChallenge.description,
          category: newChallenge.category,
          difficulty: newChallenge.difficulty,
          points: newChallenge.points,
          created_by: professorProfile.id,
          is_predefined: false
        });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Desafio criado com sucesso'
      });

      setIsDialogOpen(false);
      setNewChallenge({
        title: '',
        description: '',
        category: 'fitness',
        difficulty: 'medium',
        points: 50,
        icon: '🏆'
      });

      fetchChallenges();
    } catch (error: any) {
      console.error('Erro ao criar desafio:', error);
      toast({
        title: 'Erro ao criar desafio',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    }
  };

  const handleEditChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingChallenge || !user || user.type !== 'professor') {
      toast({
        title: 'Erro',
        description: 'Não é possível editar este desafio',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          title: `${newChallenge.icon} ${newChallenge.title}`,
          description: newChallenge.description,
          category: newChallenge.category,
          difficulty: newChallenge.difficulty,
          points: newChallenge.points,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingChallenge.id);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Desafio atualizado com sucesso'
      });

      setIsEditDialogOpen(false);
      setEditingChallenge(null);
      setNewChallenge({
        title: '',
        description: '',
        category: 'fitness',
        difficulty: 'medium',
        points: 50,
        icon: '🏆'
      });

      fetchChallenges();
    } catch (error: any) {
      console.error('Erro ao editar desafio:', error);
      toast({
        title: 'Erro ao editar desafio',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!user || user.type !== 'professor') {
      toast({
        title: 'Erro',
        description: 'Apenas professores podem excluir desafios',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Desafio excluído com sucesso'
      });

      fetchChallenges();
    } catch (error: any) {
      console.error('Erro ao excluir desafio:', error);
      toast({
        title: 'Erro ao excluir desafio',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (challenge: DatabaseChallenge) => {
    const { emoji, title } = extractEmojiFromTitle(challenge.title);
    
    setEditingChallenge(challenge);
    setNewChallenge({
      title: title,
      description: challenge.description,
      category: challenge.category,
      difficulty: challenge.difficulty,
      points: challenge.points,
      icon: emoji || '🏆'
    });
    setIsEditDialogOpen(true);
  };

  const canEditChallenge = (challenge: DatabaseChallenge) => {
    return user?.type === 'professor' && !challenge.is_predefined;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil';
      case 'medium':
        return 'Médio';
      case 'hard':
        return 'Difícil';
      default:
        return difficulty;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'fitness':
        return 'Fitness';
      case 'consistency':
        return 'Consistência';
      case 'strength':
        return 'Força';
      case 'cardio':
        return 'Cardio';
      case 'lifestyle':
        return 'Estilo de Vida';
      case 'achievement':
        return 'Conquista';
      default:
        return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fitness':
      case 'strength':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'consistency':
        return <Flame className="h-5 w-5 text-red-500" />;
      case 'cardio':
        return <Target className="h-5 w-5 text-blue-500" />;
      case 'lifestyle':
        return <Star className="h-5 w-5 text-green-500" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-purple-500" />;
      default:
        return <Trophy className="h-5 w-5 text-gray-500" />;
    }
  };

  // Função para extrair emoji do título
  const extractEmojiFromTitle = (title: string) => {
    const emojiRegex = /^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])\s/u;
    const match = title.match(emojiRegex);
    if (match) {
      return {
        emoji: match[1],
        title: title.replace(emojiRegex, '')
      };
    }
    return {
      emoji: null,
      title: title
    };
  };

  const getChallengeIcon = (challenge: DatabaseChallenge) => {
    const { emoji } = extractEmojiFromTitle(challenge.title);
    if (emoji) {
      return <span className="text-xl">{emoji}</span>;
    }
    return getCategoryIcon(challenge.category);
  };

  const getChallengeTitle = (challenge: DatabaseChallenge) => {
    const { title } = extractEmojiFromTitle(challenge.title);
    return title;
  };

  const handleBackNavigation = () => {
    if (user?.type === 'professor') {
      navigate('/dashboard');
    } else {
      navigate('/student-dashboard');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando desafios...</p>
          </div>
        </div>
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
            onClick={handleBackNavigation}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Desafios e Conquistas</h1>
        </div>
        
        {user?.type === 'professor' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Desafio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Desafio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateChallenge} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center w-12 h-10 border rounded-md bg-muted">
                      <span className="text-lg">{newChallenge.icon}</span>
                    </div>
                    <Input
                      id="title"
                      value={newChallenge.title}
                      onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Sequência de Treinos"
                      required
                      className="flex-1"
                    />
                  </div>
                  
                  {/* Seletor de Emoji */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Escolha um emoji para o desafio:</Label>
                    <div className="flex flex-wrap gap-2">
                      {['🏆', '🔥', '💪', '⚡', '🎯', '🏋️', '🚀', '⭐', '🥇', '🏃', '💯', '🌟'].map((emoji) => (
                        <Button
                          key={emoji}
                          type="button"
                          variant={newChallenge.icon === emoji ? "default" : "outline"}
                          size="sm"
                          className="w-10 h-10 p-0"
                          onClick={() => setNewChallenge(prev => ({ ...prev, icon: emoji }))}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o desafio e suas regras..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={newChallenge.category}
                      onValueChange={(value) => setNewChallenge(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="consistency">Consistência</SelectItem>
                        <SelectItem value="strength">Força</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="lifestyle">Estilo de Vida</SelectItem>
                        <SelectItem value="achievement">Conquista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Dificuldade</Label>
                    <Select
                      value={newChallenge.difficulty}
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => setNewChallenge(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a dificuldade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="points">Pontos</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newChallenge.points}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, points: Number(e.target.value) }))}
                    min="10"
                    max="500"
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Desafio
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Modal de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Desafio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditChallenge} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center w-12 h-10 border rounded-md bg-muted">
                    <span className="text-lg">{newChallenge.icon}</span>
                  </div>
                  <Input
                    id="edit-title"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Sequência de Treinos"
                    required
                    className="flex-1"
                  />
                </div>
                
                {/* Seletor de Emoji */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Escolha um emoji para o desafio:</Label>
                  <div className="flex flex-wrap gap-2">
                    {['🏆', '🔥', '💪', '⚡', '🎯', '🏋️', '🚀', '⭐', '🥇', '🏃', '💯', '🌟'].map((emoji) => (
                      <Button
                        key={emoji}
                        type="button"
                        variant={newChallenge.icon === emoji ? "default" : "outline"}
                        size="sm"
                        className="w-10 h-10 p-0"
                        onClick={() => setNewChallenge(prev => ({ ...prev, icon: emoji }))}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o desafio e suas regras..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Categoria</Label>
                  <Select
                    value={newChallenge.category}
                    onValueChange={(value) => setNewChallenge(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="consistency">Consistência</SelectItem>
                      <SelectItem value="strength">Força</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="lifestyle">Estilo de Vida</SelectItem>
                      <SelectItem value="achievement">Conquista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-difficulty">Dificuldade</Label>
                  <Select
                    value={newChallenge.difficulty}
                    onValueChange={(value: 'easy' | 'medium' | 'hard') => setNewChallenge(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a dificuldade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-points">Pontos</Label>
                <Input
                  id="edit-points"
                  type="number"
                  value={newChallenge.points}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, points: Number(e.target.value) }))}
                  min="10"
                  max="500"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getChallengeIcon(challenge)}
                  {getChallengeTitle(challenge)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {getDifficultyLabel(challenge.difficulty)}
                  </Badge>
                  {!challenge.is_predefined && (
                    <Badge variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      Personalizado
                    </Badge>
                  )}
                  
                  {/* Dropdown de ações apenas para professores e desafios não predefinidos */}
                  {canEditChallenge(challenge) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(challenge)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o desafio "{getChallengeTitle(challenge)}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteChallenge(challenge.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              <CardDescription>{challenge.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Categoria:</span>
                  <Badge variant="secondary">{getCategoryLabel(challenge.category)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{challenge.points} pontos</span>
                </div>
              </div>
              
              {user?.type === 'professor' && (
                <div className="text-xs text-muted-foreground">
                  Criado em {new Date(challenge.created_at).toLocaleDateString('pt-BR')}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {challenges.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum desafio encontrado.</p>
          {user?.type === 'professor' && (
            <p className="text-sm text-muted-foreground">Crie o primeiro desafio para seus alunos!</p>
          )}
        </div>
      )}
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Calendar, 
  Activity, 
  Trophy, 
  MessageCircle, 
  BookOpen,
  Target,
  Heart,
  Dumbbell
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Footer } from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import strikingLogo from "@/assets/Logo-Striking-Borda.png";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isProfessor, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isProfessor) {
        navigate('/dashboard');
      } else {
        navigate('/student-dashboard');
      }
    }
  }, [isAuthenticated, isProfessor, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header/Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={strikingLogo} alt="Striking Consult" className="h-8 w-auto" />
              <h1 className="text-xl font-bold text-foreground">Striking Consult</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
              <Button variant="outline" onClick={() => navigate('/professor-register')}>Sou Professor</Button>
              <Button onClick={() => navigate('/register')}>Cadastre-se</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Transforme sua Consultoria em Educação Física
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Plataforma completa para professores de educação física acompanharem seus alunos à distância,
              com ferramentas profissionais de avaliação, planejamento e comunicação.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/register')}>
                Começar Agora
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" onClick={() => navigate('/plans')}>
                Ver Demonstração
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Funcionalidades Principais</h3>
            <p className="text-lg text-muted-foreground">
              Tudo que você precisa para uma consultoria eficaz e profissional
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Gestão de Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Cadastro completo com anamnese detalhada, histórico médico e objetivos personalizados.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Agendamento Inteligente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sistema de agendamento para reuniões online com lembretes automáticos e integração com calendário.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Activity className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Acompanhamento em Tempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitoramento diário de atividades, progresso fotográfico e feedback personalizado.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Planos Personalizados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Criação de treinos adaptados aos objetivos e limitações de cada aluno.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageCircle className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Comunicação Direta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Chat integrado e videoconferências para suporte contínuo (plano premium).
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Trophy className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Gamificação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sistema de desafios, conquistas e recompensas para motivar seus alunos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Planos de Consultoria</h3>
            <p className="text-lg text-muted-foreground">
              Escolha o plano ideal para suas necessidades
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Plano Básico</CardTitle>
                <p className="text-muted-foreground">Ideal para começar</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <span>Anamnese completa inicial</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Reuniões a cada 15 dias</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <span>Plano de treino personalizado</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span>Biblioteca de exercícios</span>
                  </div>
                </div>
                <Button className="w-full" size="lg" onClick={() => navigate('/plans')}>
                  Escolher Básico
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Plano Premium</CardTitle>
                <p className="text-muted-foreground">Acompanhamento completo</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <span>Tudo do plano básico</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Reuniões semanais</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span>Chat direto com WhatsApp</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span>Gamificação avançada</span>
                  </div>
                </div>
                <Button className="w-full" size="lg" onClick={() => navigate('/plans')}>
                  Escolher Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

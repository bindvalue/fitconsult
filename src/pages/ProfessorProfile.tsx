import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Mail, Award, GraduationCap, FileText } from 'lucide-react';
import { Footer } from '@/components/Footer';

interface ProfessorProfileData {
  id: string;
  name: string;
  email: string;
  cref?: string;
  specialization?: string;
  experience_years?: number;
  bio?: string;
}

const ProfessorProfile = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfessorProfileData>({
    id: '',
    name: '',
    email: '',
    cref: '',
    specialization: '',
    experience_years: undefined,
    bio: ''
  });

  useEffect(() => {
    // Aguardar o carregamento inicial terminar antes de verificar o user
    if (loading) {
      return;
    }
    
    if (!user || user.type !== 'professor') {
      navigate('/login');
      return;
    }
    
    fetchProfile();
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // Buscar dados do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // Buscar dados do perfil do professor
      const { data: professorData } = await supabase
        .from('professor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userData) {
        setProfileData({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          cref: professorData?.cref || '',
          specialization: professorData?.specialization || '',
          experience_years: professorData?.experience_years || undefined,
          bio: professorData?.bio || ''
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar perfil',
        description: 'Não foi possível carregar seus dados',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (field: keyof ProfessorProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: field === 'experience_years' 
        ? (value === '' ? undefined : Number(value))
        : value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Atualizar dados do usuário
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          email: profileData.email
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Atualizar perfil do professor
      const { error: profileError } = await supabase
        .from('professor_profiles')
        .update({
          cref: profileData.cref,
          specialization: profileData.specialization,
          experience_years: profileData.experience_years,
          bio: profileData.bio
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast({
        title: 'Perfil atualizado!',
        description: 'Seus dados foram salvos com sucesso'
      });

    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar seus dados',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie suas informações profissionais
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dados Pessoais e Profissionais */}
            <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Atualize seus dados pessoais e profissionais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados Profissionais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cref">CREF</Label>
                      <Input
                        id="cref"
                        value={profileData.cref}
                        onChange={(e) => handleInputChange('cref', e.target.value)}
                        placeholder="123456-G/SP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience_years">Anos de Experiência</Label>
                      <Input
                        id="experience_years"
                        type="number"
                        value={profileData.experience_years || ''}
                        onChange={(e) => handleInputChange('experience_years', e.target.value)}
                        placeholder="5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialization">Especialização</Label>
                    <Input
                      id="specialization"
                      value={profileData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      placeholder="Ex: Musculação, Funcional, Pilates"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Conte um pouco sobre sua experiência e metodologia..."
                      className="min-h-[120px] resize-none"
                      rows={5}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resumo do Perfil */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Resumo do Perfil</CardTitle>
                <CardDescription>
                  Visão geral das suas informações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Nome:</span>
                  <span className="text-sm">{profileData.name || 'Não informado'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{profileData.email || 'Não informado'}</span>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">CREF:</span>
                  <span className="text-sm">{profileData.cref || 'Não informado'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Especialização:</span>
                  <span className="text-sm">{profileData.specialization || 'Não informado'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Experiência:</span>
                  <span className="text-sm">
                    {profileData.experience_years ? `${profileData.experience_years} anos` : 'Não informado'}
                  </span>
                </div>

                {profileData.bio && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Biografia:
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {profileData.bio}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfessorProfile;
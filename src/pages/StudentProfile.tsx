import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Mail, Phone, Calendar, Ruler, Weight, AlertTriangle, CreditCard } from 'lucide-react';
import { Footer } from '@/components/Footer';

interface StudentProfileData {
  id: string;
  name: string;
  email: string;
  age?: number;
  height?: number;
  weight?: number;
  phone?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  subscription?: {
    id?: string;
    plan_type: string;
    expires_at: string;
    starts_at: string;
    active: boolean;
  };
}

const StudentProfile = () => {
  const navigate = useNavigate();
  const { id: studentId } = useParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<StudentProfileData>({
    id: '',
    name: '',
    email: '',
    age: undefined,
    height: undefined,
    weight: undefined,
    phone: '',
    emergency_contact: '',
    emergency_phone: ''
  });
  
  // Determinar se é um professor visualizando o perfil do aluno
  const isProfessorView = !!studentId && user?.type === 'professor';

  useEffect(() => {
    // Aguardar o carregamento inicial terminar antes de verificar o user
    if (loading) {
      return;
    }
    
    // Só executar se tiver usuário (o ProtectedRoute já garante isso)
    if (user) {
      fetchProfile();
    }
  }, [user, loading, studentId]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // Determinar qual ID usar para buscar dados
      const targetUserId = isProfessorView ? undefined : user.id;
      const targetStudentId = isProfessorView ? studentId : undefined;
      
      let userData;
      let studentData;
      
      if (isProfessorView) {
        // Professor visualizando perfil do aluno
        const { data: studentProfile, error: studentError } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('id', studentId)
          .maybeSingle();
          
        if (studentProfile) {
          const { data: userInfo, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', studentProfile.user_id)
            .maybeSingle();
            
          userData = userInfo;
          studentData = studentProfile;
        } else {
          toast({
            title: 'Aluno não encontrado',
            description: 'Não foi possível encontrar os dados do aluno',
            variant: 'destructive'
          });
          return;
        }
      } else {
        // Aluno visualizando próprio perfil
        const { data: userInfo } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        userData = userInfo;
        studentData = studentProfile;
      }

      // Buscar dados de subscription
      let subscriptionData = null;
      if (studentData) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('student_id', studentData.id)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        subscriptionData = subscription;
      }

      if (userData) {
        setProfileData({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          age: studentData?.age || undefined,
          height: studentData?.height || undefined,
          weight: studentData?.weight || undefined,
          phone: studentData?.phone || '',
          emergency_contact: studentData?.emergency_contact || '',
          emergency_phone: studentData?.emergency_phone || '',
          subscription: subscriptionData ? {
            plan_type: subscriptionData.plan_type,
            expires_at: subscriptionData.expires_at,
            starts_at: subscriptionData.starts_at,
            active: subscriptionData.active
          } : undefined
        });
      } else {
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os dados do usuário',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast({
        title: 'Erro ao carregar perfil',
        description: 'Não foi possível carregar os dados',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (field: keyof StudentProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: field === 'age' || field === 'height' || field === 'weight' 
        ? (value === '' ? undefined : Number(value))
        : value
    }));
  };

  const handleSubscriptionChange = (field: keyof StudentProfileData['subscription'], value: string) => {
    setProfileData(prev => ({
      ...prev,
      subscription: prev.subscription ? {
        ...prev.subscription,
        [field]: value
      } : {
        plan_type: field === 'plan_type' ? value : '',
        expires_at: field === 'expires_at' ? value : '',
        starts_at: new Date().toISOString(),
        active: true
      }
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Determinar qual usuário atualizar
      const targetUserId = isProfessorView ? profileData.id : user.id;

      // Atualizar dados do usuário
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          email: profileData.email
        })
        .eq('id', targetUserId);

      if (userError) throw userError;

      // Verificar se já existe um perfil de estudante
      const { data: existingProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      const studentUpdateData = {
        age: profileData.age,
        height: profileData.height,
        weight: profileData.weight,
        phone: profileData.phone,
        emergency_contact: profileData.emergency_contact,
        emergency_phone: profileData.emergency_phone
      };

      if (existingProfile) {
        // Atualizar perfil existente
        const { error: profileError } = await supabase
          .from('student_profiles')
          .update(studentUpdateData)
          .eq('user_id', targetUserId);

        if (profileError) throw profileError;
      } else {
        // Criar novo perfil
        const { error: profileError } = await supabase
          .from('student_profiles')
          .insert({
            user_id: targetUserId,
            ...studentUpdateData
          });

        if (profileError) throw profileError;
      }

      // Salvar dados do plano se for professor
      if (isProfessorView && profileData.subscription) {
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('student_id', studentId)
          .eq('active', true)
          .maybeSingle();

        if (existingSubscription) {
          // Atualizar plano existente
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .update({
              plan_type: profileData.subscription.plan_type as "basic" | "premium",
              expires_at: profileData.subscription.expires_at
            })
            .eq('id', existingSubscription.id);

          if (subscriptionError) throw subscriptionError;
        } else {
          // Criar novo plano
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert({
              student_id: studentId,
              plan_type: profileData.subscription.plan_type as "basic" | "premium",
              starts_at: new Date().toISOString(),
              expires_at: profileData.subscription.expires_at,
              active: true
            });

          if (subscriptionError) throw subscriptionError;
        }
      }

      toast({
        title: 'Perfil atualizado!',
        description: isProfessorView ? 'Dados do aluno foram salvos com sucesso' : 'Seus dados foram salvos com sucesso'
      });

    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar os dados',
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 flex flex-col">
      <div className="flex-1 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(isProfessorView ? '/students' : '/student-dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isProfessorView ? 'Perfil do Aluno' : 'Meu Perfil'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isProfessorView ? 'Visualizar informações do aluno' : 'Gerencie suas informações pessoais'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dados Pessoais */}
            <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Atualize seus dados pessoais básicos
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Idade</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profileData.age || ''}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={profileData.height || ''}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      placeholder="170"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={profileData.weight || ''}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-accent" />
                    <h3 className="text-lg font-semibold">Contato de Emergência</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact">Nome do Contato</Label>
                      <Input
                        id="emergency_contact"
                        value={profileData.emergency_contact}
                        onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                        placeholder="Nome do familiar/amigo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
                      <Input
                        id="emergency_phone"
                        type="tel"
                        value={profileData.emergency_phone}
                        onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                {/* Gerenciar Plano - apenas para professores */}
                {isProfessorView && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Plano do Aluno</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="plan_type">Tipo de Plano</Label>
                          <Select
                            value={profileData.subscription?.plan_type || ''}
                            onValueChange={(value) => handleSubscriptionChange('plan_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de plano" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expires_at">Data de Expiração</Label>
                          <Input
                            id="expires_at"
                            type="date"
                            value={profileData.subscription?.expires_at ? new Date(profileData.subscription.expires_at).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleSubscriptionChange('expires_at', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-4">
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button variant="outline" onClick={() => navigate(isProfessorView ? '/students' : '/student-dashboard')}>
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
                
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm block break-words">{profileData.email || 'Não informado'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Idade:</span>
                  <span className="text-sm">{profileData.age ? `${profileData.age} anos` : 'Não informado'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Altura:</span>
                  <span className="text-sm">{profileData.height ? `${profileData.height} cm` : 'Não informado'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Peso:</span>
                  <span className="text-sm">{profileData.weight ? `${profileData.weight} kg` : 'Não informado'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Telefone:</span>
                  <span className="text-sm">{profileData.phone || 'Não informado'}</span>
                </div>

                {/* Plano */}
                {profileData.subscription && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Plano Ativo:
                      </h4>
                      <div className="text-sm">
                        <p className="font-medium text-primary">{profileData.subscription.plan_type}</p>
                        <p className="text-muted-foreground">
                          Expira em: {new Date(profileData.subscription.expires_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {(profileData.emergency_contact || profileData.emergency_phone) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-accent" />
                        Emergência:
                      </h4>
                      <p className="text-sm">{profileData.emergency_contact || 'Não informado'}</p>
                      <p className="text-sm">{profileData.emergency_phone || 'Não informado'}</p>
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

export default StudentProfile;
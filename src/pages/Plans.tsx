import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, MessageSquare, Calendar, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/Footer';

const Plans = () => {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | null>(null);
  const navigate = useNavigate();

  const plans = [
    {
      id: 'basic',
      name: 'Plano Básico',
      price: 'R$ 199,00',
      period: '/mês',
      description: 'Ideal para quem está começando',
      features: [
        'Consulta inicial de 40 minutos',
        'Plano de treino personalizado',
        'Acompanhamento quinzenal (a cada 15 dias)',
        'Acesso à biblioteca de exercícios',
        'Registro de atividades'
      ],
      notIncluded: [
        'Mensagens diretas com professor',
        'Consultas semanais',
        'Fotos de progresso'
      ],
      popular: false
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      price: 'R$ 500,00',
      period: '/mês',
      description: 'Para quem busca resultados mais rápidos',
      features: [
        'Consulta inicial de 40 minutos',
        'Plano de treino personalizado',
        'Acompanhamento semanal (a cada 7 dias)',
        'Acesso à biblioteca de exercícios',
        'Registro de atividades',
        'Fotos de progresso',
        'Mensagens diretas com professor',
        'Suporte prioritário',
        'Ajustes de treino mais frequentes'
      ],
      notIncluded: [],
      popular: true
    }
  ];

  const handleSelectPlan = (planId: 'basic' | 'premium') => {
    setSelectedPlan(planId);
    // Aqui seria redirecionado para o cadastro com o plano selecionado
    navigate(`/register?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Escolha Seu Plano
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecione o plano que melhor se adequa aos seus objetivos e necessidades de acompanhamento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`bg-card/50 backdrop-blur-sm relative ${
                plan.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Incluso:</h4>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.notIncluded.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Não incluso:</h4>
                    {plan.notIncluded.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full border border-muted-foreground/50 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground line-through">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {plan.id === 'basic' ? 'Acompanhamento quinzenal' : 'Acompanhamento semanal'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Consulta inicial de 40 minutos
                  </div>
                  {plan.id === 'premium' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      Chat direto com professor
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id as 'basic' | 'premium')}
                >
                  Começar com {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Já tem uma conta?
          </p>
          <Button variant="outline" onClick={() => navigate('/login')}>
            Fazer Login
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Plans;
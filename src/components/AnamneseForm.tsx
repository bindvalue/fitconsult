import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Heart, 
  Activity, 
  Target, 
  Calendar,
  AlertTriangle,
  Clock,
  Zap
} from "lucide-react";

interface AnamneseFormProps {
  onSubmit?: (data: any) => void;
}

const AnamneseForm = ({ onSubmit }: AnamneseFormProps) => {
  const [formData, setFormData] = useState({
    // Dados pessoais
    name: "",
    age: "",
    weight: "",
    height: "",
    gender: "",
    
    // Histórico de saúde
    healthConditions: [] as string[],
    medications: "",
    injuries: "",
    
    // Experiência com exercícios
    exerciseExperience: "",
    currentlyExercising: "",
    exerciseFrequency: "",
    
    // Objetivos
    primaryGoal: "",
    secondaryGoals: [] as string[],
    timeFrame: "",
    
    // Disponibilidade
    availableDays: [] as string[],
    preferredTime: "",
    sessionDuration: "",
    
    // Preferências
    exercisePreferences: [] as string[],
    dislikes: "",
    
    // Motivação
    motivation: "",
    previousAttempts: "",
    barriers: ""
  });

  const healthConditions = [
    "Hipertensão", "Diabetes", "Problemas cardíacos", "Problemas na coluna",
    "Artrite", "Asma", "Outras condições respiratórias", "Nenhuma"
  ];

  const goals = [
    "Perder peso", "Ganhar massa muscular", "Melhorar condicionamento",
    "Reabilitação", "Bem-estar geral", "Competição esportiva"
  ];

  const daysOfWeek = [
    "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"
  ];

  const exerciseTypes = [
    "Musculação", "Cardio", "Pilates", "Yoga", "Natação", "Corrida",
    "Dança", "Artes marciais", "Esportes coletivos"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const handleCheckboxChange = (value: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
        : [...(prev[field as keyof typeof prev] as string[]), value]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Anamnese do Aluno</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Questionário completo para conhecer melhor o perfil e objetivos do aluno
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Dados Pessoais</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Digite seu nome completo"
                  />
                </div>
                
                <div>
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="Ex: 25"
                  />
                </div>
                
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    placeholder="Ex: 70"
                  />
                </div>
                
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: e.target.value})}
                    placeholder="Ex: 170"
                  />
                </div>
              </div>
              
              <div>
                <Label>Sexo</Label>
                <RadioGroup 
                  value={formData.gender} 
                  onValueChange={(value) => setFormData({...formData, gender: value})}
                  className="flex space-x-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Masculino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Feminino</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Saúde */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Histórico de Saúde</h3>
              </div>
              
              <div>
                <Label>Condições de saúde (marque todas que se aplicam):</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {healthConditions.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={condition}
                        checked={formData.healthConditions.includes(condition)}
                        onCheckedChange={() => handleCheckboxChange(condition, 'healthConditions')}
                      />
                      <Label htmlFor={condition} className="text-sm">{condition}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="medications">Medicamentos em uso</Label>
                <Textarea
                  id="medications"
                  value={formData.medications}
                  onChange={(e) => setFormData({...formData, medications: e.target.value})}
                  placeholder="Liste os medicamentos que você usa atualmente"
                />
              </div>
              
              <div>
                <Label htmlFor="injuries">Lesões ou limitações físicas</Label>
                <Textarea
                  id="injuries"
                  value={formData.injuries}
                  onChange={(e) => setFormData({...formData, injuries: e.target.value})}
                  placeholder="Descreva qualquer lesão ou limitação física"
                />
              </div>
            </div>

            {/* Experiência com Exercícios */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Experiência com Exercícios</h3>
              </div>
              
              <div>
                <Label>Você já treina atualmente?</Label>
                <RadioGroup 
                  value={formData.currentlyExercising} 
                  onValueChange={(value) => setFormData({...formData, currentlyExercising: value})}
                  className="flex space-x-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="exercising-yes" />
                    <Label htmlFor="exercising-yes">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="exercising-no" />
                    <Label htmlFor="exercising-no">Não</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label>Nível de experiência com exercícios</Label>
                <RadioGroup 
                  value={formData.exerciseExperience} 
                  onValueChange={(value) => setFormData({...formData, exerciseExperience: value})}
                  className="space-y-2 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <Label htmlFor="beginner">Iniciante (pouca ou nenhuma experiência)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <Label htmlFor="intermediate">Intermediário (alguma experiência)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <Label htmlFor="advanced">Avançado (muita experiência)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Objetivos */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Objetivos</h3>
              </div>
              
              <div>
                <Label>Qual é seu objetivo principal?</Label>
                <RadioGroup 
                  value={formData.primaryGoal} 
                  onValueChange={(value) => setFormData({...formData, primaryGoal: value})}
                  className="space-y-2 mt-2"
                >
                  {goals.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <RadioGroupItem value={goal} id={goal} />
                      <Label htmlFor={goal}>{goal}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div>
                <Label>Objetivos secundários (opcionais):</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {goals.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={`secondary-${goal}`}
                        checked={formData.secondaryGoals.includes(goal)}
                        onCheckedChange={() => handleCheckboxChange(goal, 'secondaryGoals')}
                      />
                      <Label htmlFor={`secondary-${goal}`} className="text-sm">{goal}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Disponibilidade */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Disponibilidade</h3>
              </div>
              
              <div>
                <Label>Quantas vezes por semana você pode treinar?</Label>
                <RadioGroup 
                  value={formData.exerciseFrequency} 
                  onValueChange={(value) => setFormData({...formData, exerciseFrequency: value})}
                  className="flex flex-wrap gap-4 mt-2"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <div key={num} className="flex items-center space-x-2">
                      <RadioGroupItem value={num.toString()} id={`freq-${num}`} />
                      <Label htmlFor={`freq-${num}`}>{num}x</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div>
                <Label>Dias da semana disponíveis:</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={formData.availableDays.includes(day)}
                        onCheckedChange={() => handleCheckboxChange(day, 'availableDays')}
                      />
                      <Label htmlFor={day} className="text-sm">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preferências */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Preferências</h3>
              </div>
              
              <div>
                <Label>Tipos de exercício que você gosta ou tem interesse:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {exerciseTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={formData.exercisePreferences.includes(type)}
                        onCheckedChange={() => handleCheckboxChange(type, 'exercisePreferences')}
                      />
                      <Label htmlFor={type} className="text-sm">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="motivation">O que te motiva a fazer exercícios?</Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                  placeholder="Compartilhe suas motivações..."
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-center pt-6">
              <Button type="submit" size="lg" className="px-12">
                Finalizar Anamnese
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnamneseForm;
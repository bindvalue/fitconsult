-- Criar tabela de desafios (challenges)
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL DEFAULT 'fitness',
  points INTEGER NOT NULL DEFAULT 10,
  difficulty VARCHAR NOT NULL DEFAULT 'medium',
  is_predefined BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.professor_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de desafios dos alunos
CREATE TABLE public.student_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.professor_profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR NOT NULL DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(student_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies para challenges
CREATE POLICY "Authenticated users can view challenges" 
ON public.challenges 
FOR SELECT 
USING (true);

CREATE POLICY "Professors can create challenges" 
ON public.challenges 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.professor_profiles 
    WHERE user_id = auth.uid() AND id = created_by
  )
);

CREATE POLICY "Professors can update own challenges" 
ON public.challenges 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.professor_profiles 
    WHERE user_id = auth.uid() AND id = created_by
  )
);

-- RLS policies para student_challenges
CREATE POLICY "Students can view own challenges" 
ON public.student_challenges 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles 
    WHERE user_id = auth.uid() AND id = student_id
  )
);

CREATE POLICY "Professors can view assigned challenges" 
ON public.student_challenges 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.professor_profiles 
    WHERE user_id = auth.uid() AND id = assigned_by
  )
);

CREATE POLICY "Professors can assign challenges" 
ON public.student_challenges 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.professor_profiles 
    WHERE user_id = auth.uid() AND id = assigned_by
  )
);

CREATE POLICY "Professors can update assigned challenges" 
ON public.student_challenges 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.professor_profiles 
    WHERE user_id = auth.uid() AND id = assigned_by
  )
);

CREATE POLICY "Students can update own challenge progress" 
ON public.student_challenges 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles 
    WHERE user_id = auth.uid() AND id = student_id
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns desafios predefinidos
INSERT INTO public.challenges (title, description, category, points, difficulty, is_predefined) VALUES
('Primeira Semana Completa', 'Complete todos os treinos da primeira semana do seu plano', 'consistency', 50, 'easy', true),
('Mês de Consistência', 'Complete treinos por 30 dias consecutivos', 'consistency', 200, 'hard', true),
('Evolução de Peso', 'Aumente o peso em pelo menos um exercício em 10%', 'strength', 100, 'medium', true),
('Cardio Champion', 'Complete 10 treinos de cardio no mês', 'cardio', 80, 'medium', true),
('Early Bird', 'Complete 5 treinos antes das 8h da manhã', 'lifestyle', 60, 'medium', true),
('Personal Record', 'Bata seu recorde pessoal em qualquer exercício', 'achievement', 150, 'hard', true),
('Semana Perfeita', 'Complete todos os treinos planejados para a semana', 'consistency', 70, 'easy', true),
('Hidratação Master', 'Beba pelo menos 2L de água por 7 dias consecutivos', 'lifestyle', 40, 'easy', true);
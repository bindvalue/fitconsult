-- Primeiro, corrigir a política RLS para workout_plans
-- O erro acontece porque professor_id deve referenciar user_id, não o ID do professor_profiles
DROP POLICY IF EXISTS "Professors can manage workout plans" ON public.workout_plans;

-- Criar nova política que permite professores criarem e gerenciarem planos
CREATE POLICY "Professors can manage workout plans" 
ON public.workout_plans 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.professor_profiles 
    WHERE professor_profiles.user_id = auth.uid() 
    AND professor_profiles.id = workout_plans.professor_id
  )
);

-- Modificar workout_plans para CrossFit
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS workout_type VARCHAR(50) DEFAULT 'WOD';
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS time_cap_minutes INTEGER;
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS scaling_options JSONB;

-- Criar tabela de exercícios do CrossFit
CREATE TABLE IF NOT EXISTS public.crossfit_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'strength', 'metcon', 'gymnastics', 'cardio'
  movement_pattern VARCHAR(100), -- 'squat', 'pull', 'push', 'hinge', 'carry'
  equipment_needed TEXT[],
  description TEXT,
  scaling_options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Popular exercícios básicos do CrossFit
INSERT INTO public.crossfit_exercises (name, category, movement_pattern, equipment_needed, description) VALUES
('Air Squat', 'gymnastics', 'squat', '{}', 'Agachamento livre sem peso'),
('Push-up', 'gymnastics', 'push', '{}', 'Flexão de braço'),
('Pull-up', 'gymnastics', 'pull', '{''pull-up bar''}', 'Barra fixa'),
('Burpee', 'metcon', 'full body', '{}', 'Movimento completo: agachamento, prancha, salto'),
('Deadlift', 'strength', 'hinge', '{''barbell'', ''plates''}', 'Levantamento terra'),
('Back Squat', 'strength', 'squat', '{''barbell'', ''rack'', ''plates''}', 'Agachamento com barra nas costas'),
('Overhead Press', 'strength', 'push', '{''barbell'', ''plates''}', 'Desenvolvimento militar'),
('Row', 'cardio', 'pull', '{''rowing machine''}', 'Remada no ergômetro'),
('Box Jump', 'metcon', 'jump', '{''box''}', 'Salto na caixa'),
('Kettlebell Swing', 'metcon', 'hinge', '{''kettlebell''}', 'Balanço com kettlebell'),
('Thrusters', 'metcon', 'squat', '{''barbell'', ''plates''}', 'Agachamento frontal + desenvolvimento'),
('Wall Ball', 'metcon', 'squat', '{''medicine ball'', ''target''}', 'Arremesso de medicine ball'),
('Double Unders', 'cardio', 'jump', '{''jump rope''}', 'Pular corda com dupla passada'),
('Toes-to-Bar', 'gymnastics', 'pull', '{''pull-up bar''}', 'Elevação de pernas até a barra'),
('Handstand Push-up', 'gymnastics', 'push', '{''wall''}', 'Flexão de braço na parada de mão');

-- Habilitar RLS na nova tabela
ALTER TABLE public.crossfit_exercises ENABLE ROW LEVEL SECURITY;

-- Política para permitir visualização dos exercícios por todos usuários autenticados
CREATE POLICY "Authenticated users can view exercises" 
ON public.crossfit_exercises 
FOR SELECT 
USING (true);

-- Apenas professores podem gerenciar exercícios
CREATE POLICY "Professors can manage exercises" 
ON public.crossfit_exercises 
FOR ALL 
USING (get_current_user_role() = 'professor');
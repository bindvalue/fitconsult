-- Define os tipos de plano como enum
DO $$ BEGIN
    CREATE TYPE public.subscription_plan AS ENUM ('basic', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Atualizar tabela subscriptions para usar o enum
ALTER TABLE public.subscriptions 
ALTER COLUMN plan_type TYPE public.subscription_plan 
USING plan_type::public.subscription_plan;

-- Função para verificar se um estudante tem plano premium
CREATE OR REPLACE FUNCTION public.has_premium_plan(student_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.subscriptions s
    JOIN public.student_profiles sp ON s.student_id = sp.id
    WHERE sp.user_id = student_user_id
      AND s.plan_type = 'premium'
      AND s.active = true
      AND s.starts_at <= now()
      AND s.expires_at > now()
  );
$$;

-- Função para verificar se um estudante tem qualquer plano ativo
CREATE OR REPLACE FUNCTION public.has_active_plan(student_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.subscriptions s
    JOIN public.student_profiles sp ON s.student_id = sp.id
    WHERE sp.user_id = student_user_id
      AND s.active = true
      AND s.starts_at <= now()
      AND s.expires_at > now()
  );
$$;

-- Atualizar políticas RLS para consultations (apenas premium)
DROP POLICY IF EXISTS "Students can view own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Students can create consultations" ON public.consultations;

CREATE POLICY "Premium students can view own consultations"
ON public.consultations 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = student_id AND 
  public.has_premium_plan(auth.uid())
);

CREATE POLICY "Premium students can create consultations"
ON public.consultations 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = student_id AND 
  public.has_premium_plan(auth.uid())
);

-- Políticas para workout_plans (ambos os planos têm acesso)
DROP POLICY IF EXISTS "Students can view own workout plans" ON public.workout_plans;

CREATE POLICY "Students with active plan can view own workout plans"
ON public.workout_plans 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp 
    WHERE sp.id = workout_plans.student_id 
      AND sp.user_id = auth.uid()
  ) AND 
  public.has_active_plan(auth.uid())
);

-- Políticas para messages (ambos os planos têm acesso ao chat)
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users with active plan can view own messages"
ON public.messages 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id) AND
  (
    public.has_active_plan(auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'professor')
  )
);

CREATE POLICY "Users with active plan can send messages"
ON public.messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  (
    public.has_active_plan(auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'professor')
  )
);

-- Políticas para workout_sessions (ambos os planos têm acesso)
DROP POLICY IF EXISTS "Students can view own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Students can create own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Students can update own workout sessions" ON public.workout_sessions;

CREATE POLICY "Students with active plan can view own workout sessions"
ON public.workout_sessions 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp 
    WHERE sp.id = workout_sessions.student_id 
      AND sp.user_id = auth.uid()
  ) AND 
  public.has_active_plan(auth.uid())
);

CREATE POLICY "Students with active plan can create own workout sessions"
ON public.workout_sessions 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp 
    WHERE sp.id = workout_sessions.student_id 
      AND sp.user_id = auth.uid()
  ) AND 
  public.has_active_plan(auth.uid())
);

CREATE POLICY "Students with active plan can update own workout sessions"
ON public.workout_sessions 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp 
    WHERE sp.id = workout_sessions.student_id 
      AND sp.user_id = auth.uid()
  ) AND 
  public.has_active_plan(auth.uid())
);

-- Políticas para student_challenges (ambos os planos têm acesso)
DROP POLICY IF EXISTS "Students can view own challenges" ON public.student_challenges;
DROP POLICY IF EXISTS "Students can update own challenge progress" ON public.student_challenges;

CREATE POLICY "Students with active plan can view own challenges"
ON public.student_challenges 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp 
    WHERE sp.id = student_challenges.student_id 
      AND sp.user_id = auth.uid()
  ) AND 
  public.has_active_plan(auth.uid())
);

CREATE POLICY "Students with active plan can update own challenge progress"
ON public.student_challenges 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp 
    WHERE sp.id = student_challenges.student_id 
      AND sp.user_id = auth.uid()
  ) AND 
  public.has_active_plan(auth.uid())
);

-- Políticas para activity_logs (ambos os planos têm acesso)
DROP POLICY IF EXISTS "Students can view own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Students can create own activity logs" ON public.activity_logs;

CREATE POLICY "Students with active plan can view own activity logs"
ON public.activity_logs 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = student_id AND 
  public.has_active_plan(auth.uid())
);

CREATE POLICY "Students with active plan can create own activity logs"
ON public.activity_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = student_id AND 
  public.has_active_plan(auth.uid())
);

-- Políticas para progress_photos (ambos os planos têm acesso)
DROP POLICY IF EXISTS "Students can view own progress photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Students can manage own progress photos" ON public.progress_photos;

CREATE POLICY "Students with active plan can view own progress photos"
ON public.progress_photos 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = student_id AND 
  public.has_active_plan(auth.uid())
);

CREATE POLICY "Students with active plan can manage own progress photos"
ON public.progress_photos 
FOR ALL
TO authenticated
USING (
  auth.uid() = student_id AND 
  public.has_active_plan(auth.uid())
);

-- Políticas para anamnesis (ambos os planos têm acesso)
DROP POLICY IF EXISTS "Students can view own anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Students can create own anamnesis" ON public.anamnesis;

CREATE POLICY "Students with active plan can view own anamnesis"
ON public.anamnesis 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = student_id AND 
  public.has_active_plan(auth.uid())
);

CREATE POLICY "Students with active plan can create own anamnesis"
ON public.anamnesis 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = student_id AND 
  public.has_active_plan(auth.uid())
);
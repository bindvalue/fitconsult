-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for professor_profiles
CREATE POLICY "Professor profiles are viewable by everyone" ON public.professor_profiles
  FOR SELECT USING (true);

CREATE POLICY "Professors can manage own profile" ON public.professor_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for student_profiles
CREATE POLICY "Students can view own profile" ON public.student_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can update own profile" ON public.student_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own profile" ON public.student_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professors can view student profiles" ON public.student_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'professor'
    )
  );

-- Create policies for anamnesis
CREATE POLICY "Students can view own anamnesis" ON public.anamnesis
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create own anamnesis" ON public.anamnesis
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Professors can view anamnesis" ON public.anamnesis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'professor'
    )
  );

-- Create policies for workout_plans
CREATE POLICY "Students can view own workout plans" ON public.workout_plans
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Professors can manage workout plans" ON public.workout_plans
  FOR ALL USING (auth.uid() = professor_id);

-- Create policies for consultations
CREATE POLICY "Students can view own consultations" ON public.consultations
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Professors can view own consultations" ON public.consultations
  FOR SELECT USING (auth.uid() = professor_id);

CREATE POLICY "Professors can manage consultations" ON public.consultations
  FOR ALL USING (auth.uid() = professor_id);

-- Create policies for messages
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create policies for activity_logs
CREATE POLICY "Students can view own activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create own activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Professors can view student activity logs" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'professor'
    )
  );

-- Create policies for progress_photos
CREATE POLICY "Students can view own progress photos" ON public.progress_photos
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can manage own progress photos" ON public.progress_photos
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Professors can view student progress photos" ON public.progress_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'professor'
    )
  );

-- Create policies for subscriptions
CREATE POLICY "Students can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  
  -- Create profile based on role
  IF (NEW.raw_user_meta_data->>'role' = 'professor') THEN
    INSERT INTO public.professor_profiles (user_id, cref, specialization, experience_years)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'cref',
      NEW.raw_user_meta_data->>'specialization',
      COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0)
    );
  ELSE
    INSERT INTO public.student_profiles (user_id, age, height, weight, phone, emergency_contact, emergency_phone)
    VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
      COALESCE((NEW.raw_user_meta_data->>'height')::numeric, NULL),
      COALESCE((NEW.raw_user_meta_data->>'weight')::numeric, NULL),
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'emergency_contact',
      NEW.raw_user_meta_data->>'emergency_phone'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
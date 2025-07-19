-- Update the handle_new_user function to include bio field for professors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    INSERT INTO public.professor_profiles (user_id, cref, specialization, experience_years, bio)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'cref',
      NEW.raw_user_meta_data->>'specialization',
      COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
      NEW.raw_user_meta_data->>'bio'
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
$function$;
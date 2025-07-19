-- Adicionar coluna google_meet_link na tabela consultations para armazenar o link do Google Meet
ALTER TABLE public.consultations 
ADD COLUMN google_meet_link TEXT;
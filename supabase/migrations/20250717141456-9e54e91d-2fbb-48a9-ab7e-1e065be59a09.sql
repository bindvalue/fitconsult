-- Adicionar coluna observation na tabela workout_sessions
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS observation TEXT;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS completed_status BOOLEAN DEFAULT true;
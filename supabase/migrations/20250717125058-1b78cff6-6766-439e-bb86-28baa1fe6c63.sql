-- Inserir plano de exemplo para o aluno Catarina
INSERT INTO public.subscriptions (student_id, plan_type, starts_at, expires_at, active)
VALUES (
  'a5cc64af-f325-45bb-b020-566d57041dba',
  'CrossFit Premium',
  '2025-01-01'::timestamp with time zone,
  '2025-12-31'::timestamp with time zone,
  true
);
-- Ativar replicação completa para a tabela messages para suporte ao realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Adicionar a tabela messages à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
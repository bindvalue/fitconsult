-- Adicionar suporte para edição de mensagens
ALTER TABLE public.messages 
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN original_message TEXT;
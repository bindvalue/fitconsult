import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Send, MessageSquare, Edit2, MoreVertical, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  sent_at: string;
  read_at?: string;
  edited_at?: string;
  original_message?: string;
  sender?: {
    name: string;
    email: string;
  };
  receiver?: {
    name: string;
    email: string;
  };
}

interface ChatComponentProps {
  recipientId: string;
  recipientName: string;
  recipientType: 'student' | 'professor';
}

const ChatComponent = ({ recipientId, recipientName, recipientType }: ChatComponentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id && recipientId) {
      fetchMessages();
    }
  }, [user?.id, recipientId]);

  // Realtime listener para sincronização instantânea
  useEffect(() => {
    if (!user?.id || !recipientId) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id}))`
        },
        async (payload) => {
          console.log('Nova mensagem recebida:', payload);
          
          // Buscar dados do usuário para a nova mensagem
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', [payload.new.sender_id, payload.new.receiver_id]);

          const newMessage: Message = {
            id: payload.new.id,
            message: payload.new.message,
            sender_id: payload.new.sender_id,
            receiver_id: payload.new.receiver_id,
            sent_at: payload.new.sent_at,
            read_at: payload.new.read_at,
            edited_at: payload.new.edited_at,
            original_message: payload.new.original_message,
            sender: userData?.find(u => u.id === payload.new.sender_id),
            receiver: userData?.find(u => u.id === payload.new.receiver_id)
          };

          setMessages(prev => {
            // Verificar se a mensagem já existe para evitar duplicação
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });

          // Marcar como lida se for mensagem recebida
          if (payload.new.receiver_id === user.id && payload.new.sender_id === recipientId) {
            await supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', payload.new.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id}))`
        },
        async (payload) => {
          console.log('Mensagem atualizada:', payload);
          
          // Buscar dados do usuário para a mensagem atualizada
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', [payload.new.sender_id, payload.new.receiver_id]);

          const updatedMessage: Message = {
            id: payload.new.id,
            message: payload.new.message,
            sender_id: payload.new.sender_id,
            receiver_id: payload.new.receiver_id,
            sent_at: payload.new.sent_at,
            read_at: payload.new.read_at,
            edited_at: payload.new.edited_at,
            original_message: payload.new.original_message,
            sender: userData?.find(u => u.id === payload.new.sender_id),
            receiver: userData?.find(u => u.id === payload.new.receiver_id)
          };

          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, recipientId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }
    };

    // Usar setTimeout para garantir que o DOM foi atualizado
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  const fetchMessages = async () => {
    if (!user?.id || !recipientId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      let finalMessages: Message[] = [];
      
      if (data && data.length > 0) {
        // Buscar dados dos usuários separadamente
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', [...new Set([...data.map(m => m.sender_id), ...data.map(m => m.receiver_id)])]);

        if (usersError) {
          console.error('Error fetching users:', usersError);
        }

        // Combinar dados
        finalMessages = data.map(message => ({
          ...message,
          sender: usersData?.find(u => u.id === message.sender_id),
          receiver: usersData?.find(u => u.id === message.receiver_id)
        }));
        
        // Mark messages as read if they're from the recipient
        const unreadMessages = data.filter(msg => 
          msg.receiver_id === user.id && 
          msg.sender_id === recipientId && 
          !msg.read_at
        );

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadMessages.map(msg => msg.id));
        }
      }

      setMessages(finalMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Erro ao carregar mensagens',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !recipientId) return;

    setSending(true);
    const messageText = newMessage.trim();
    
    try {
      // Limpar o input imediatamente para melhor UX
      setNewMessage('');
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          message: messageText,
          sender_id: user.id,
          receiver_id: recipientId
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar mensagem temporária no estado local para renderização imediata
      const tempMessage: Message = {
        id: data.id,
        message: messageText,
        sender_id: user.id,
        receiver_id: recipientId,
        sent_at: new Date().toISOString(),
        sender: { name: user.name, email: user.email },
        receiver: { name: recipientName, email: '' }
      };

      setMessages(prev => {
        // Verificar se a mensagem já existe para evitar duplicação
        const exists = prev.some(msg => msg.id === tempMessage.id);
        if (exists) return prev;
        return [...prev, tempMessage];
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      // Restaurar mensagem no input em caso de erro
      setNewMessage(messageText);
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message.id);
    setEditedText(message.message);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editedText.trim()) return;

    try {
      const originalMessage = messages.find(msg => msg.id === messageId);
      
      const { error } = await supabase
        .from('messages')
        .update({
          message: editedText.trim(),
          edited_at: new Date().toISOString(),
          original_message: originalMessage?.original_message || originalMessage?.message
        })
        .eq('id', messageId);

      if (error) throw error;

      setEditingMessage(null);
      setEditedText('');
      
      toast({
        title: 'Mensagem editada com sucesso',
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Error editing message:', error);
      toast({
        title: 'Erro ao editar mensagem',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditedText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent, messageId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(messageId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const canEditMessage = (message: Message) => {
    const isFromMe = message.sender_id === user?.id;
    const sentTime = new Date(message.sent_at).getTime();
    const now = new Date().getTime();
    const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutos em ms
    
    return isFromMe && sentTime > fiveMinutesAgo;
  };

  return (
    <Card className="h-[600px] flex flex-col max-w-full">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversa com {recipientName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 min-h-0 overflow-hidden" ref={scrollAreaRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Carregando mensagens...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Seja o primeiro a enviar uma mensagem!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {messages.map((message) => {
                const isFromMe = message.sender_id === user?.id;
                const senderName = isFromMe ? 'Você' : (message.sender?.name || 'Usuário');
                const isEditing = editingMessage === message.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 animate-fade-in ${isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isFromMe && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(senderName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`flex flex-col ${isFromMe ? 'items-end' : 'items-start'} max-w-[calc(100%-3rem)]`}>
                      <div
                        className={`max-w-full p-3 rounded-lg relative group transition-all duration-200 hover:shadow-md break-words overflow-wrap-anywhere ${
                          isFromMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 animate-scale-in min-w-0">
                            <Input
                              value={editedText}
                              onChange={(e) => setEditedText(e.target.value)}
                              onKeyPress={(e) => handleEditKeyPress(e, message.id)}
                              className="text-sm flex-1 bg-background/80 min-w-0"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(message.id)}
                              disabled={!editedText.trim()}
                              className="hover-scale flex-shrink-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="hover-scale flex-shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                            {message.edited_at && (
                              <p className="text-xs opacity-70 mt-1 italic">
                                (editada)
                              </p>
                            )}
                            {isFromMe && canEditMessage(message) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover-scale"
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="animate-scale-in">
                                  <DropdownMenuItem
                                    onClick={() => handleEditMessage(message)}
                                    className="cursor-pointer hover:bg-muted/50"
                                  >
                                    <Edit2 className="h-3 w-3 mr-2" />
                                    Editar mensagem
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.sent_at), 'HH:mm', { locale: ptBR })}
                        </span>
                        {message.edited_at && (
                          <span className="text-xs text-muted-foreground">
                            • editada {format(new Date(message.edited_at), 'HH:mm', { locale: ptBR })}
                          </span>
                        )}
                        {isFromMe && message.read_at && (
                          <span className="text-xs text-blue-500 font-medium">• ✓ Lida</span>
                        )}
                        {isFromMe && !message.read_at && (
                          <span className="text-xs text-muted-foreground">• ✓ Enviada</span>
                        )}
                      </div>
                    </div>
                    
                    {isFromMe && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(user?.name || 'Você')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 items-end flex-shrink-0 border-t pt-4">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem... (Enter para enviar)"
              disabled={sending}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            />
            <div className="text-xs text-muted-foreground mt-1 px-2">
              {sending ? 'Enviando...' : 'Shift+Enter para nova linha'}
            </div>
          </div>
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="hover-scale mb-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatComponent;
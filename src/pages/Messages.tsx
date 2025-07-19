import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navigation from '@/components/Navigation';
import { MessageSquare, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ChatComponent from '@/components/ChatComponent';
import { Footer } from '@/components/Footer';

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  sent_at: string;
  read_at?: string;
  sender?: {
    name: string;
    email: string;
  };
  receiver?: {
    name: string;
    email: string;
  };
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (user?.id) {
      fetchContacts();
      
      // Limpar localStorage de mensagens lidas antigas (mais de 30 dias)
      const cleanupOldReadMessages = () => {
        const storageKey = `messages_read_${user.id}`;
        try {
          localStorage.removeItem(storageKey);
        } catch (error) {
          console.error('Erro ao limpar localStorage:', error);
        }
      };
      
      cleanupOldReadMessages();
    }
  }, [user?.id]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredContacts(
        contacts.filter(contact =>
          contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchTerm, contacts]);

  // Realtime listener para atualizar a lista de contatos quando novas mensagens chegarem
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages-list-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
        },
        (payload) => {
          // Atualizar a lista de contatos quando uma nova mensagem chegar
          setTimeout(() => fetchContacts(), 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
        },
        (payload) => {
          // Atualizar a lista de contatos quando uma mensagem for editada ou marcada como lida
          setTimeout(() => fetchContacts(), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchContacts = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let contactsData: Contact[] = [];

      if (user.type === 'professor') {
        // Professor can message students
        const { data: studentsData, error } = await supabase
          .from('student_profiles')
          .select(`
            id,
            user_id,
            users!inner(name, email, role)
          `);

        if (error) throw error;

        contactsData = studentsData?.map(student => ({
          id: student.user_id,
          name: student.users.name,
          email: student.users.email,
          role: student.users.role
        })) || [];
      } else {
        // Student can message professors
        const { data: professorsData, error } = await supabase
          .from('professor_profiles')
          .select(`
            id,
            user_id,
            users!inner(name, email, role)
          `);

        if (error) throw error;

        contactsData = professorsData?.map(professor => ({
          id: professor.user_id,
          name: professor.users.name,
          email: professor.users.email,
          role: professor.users.role
        })) || [];
      }

      // Fetch last messages and unread counts for each contact
      const contactsWithMessages = await Promise.all(
        contactsData.map(async (contact) => {
          const { data: messagesData } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${user.id})`)
            .order('sent_at', { ascending: false })
            .limit(1);

          const { data: unreadData } = await supabase
            .from('messages')
            .select('id')
            .eq('sender_id', contact.id)
            .eq('receiver_id', user.id)
            .is('read_at', null);

          const lastMessage = messagesData?.[0];
          const unreadCount = unreadData?.length || 0;
          
          return {
            ...contact,
            lastMessage: lastMessage?.message,
            lastMessageTime: lastMessage?.sent_at,
            unreadCount: unreadCount
          };
        })
      );

      // Sort by last message time
      contactsWithMessages.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setContacts(contactsWithMessages);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Erro ao carregar contatos',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    return role === 'professor' ? 'Professor' : 'Aluno';
  };

  const getRoleColor = (role: string) => {
    return role === 'professor' ? 'bg-blue-500' : 'bg-green-500';
  };

  const markAllMessagesAsRead = async () => {
    if (!user?.id) return;

    try {
      // Primeiro, atualizar o estado local imediatamente para feedback visual
      setContacts(prevContacts => 
        prevContacts.map(c => ({ ...c, unreadCount: 0 }))
      );

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('receiver_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Erro ao marcar todas as mensagens como lidas:', error);
        // Reverter o estado local em caso de erro
        await fetchContacts();
        toast({
          title: 'Erro',
          description: 'Erro ao marcar mensagens como lidas',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Sucesso',
          description: 'Todas as mensagens foram marcadas como lidas',
        });
        
        // Aguardar um pouco antes de recarregar para evitar conflitos
        setTimeout(() => {
          fetchContacts();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao marcar todas as mensagens como lidas:', error);
      // Reverter o estado local em caso de erro
      await fetchContacts();
      toast({
        title: 'Erro',
        description: 'Erro ao marcar mensagens como lidas',
        variant: 'destructive'
      });
    }
  };

  const handleContactClick = async (contact: Contact) => {
    // Marcar mensagens não lidas como lidas
    if (contact.unreadCount && contact.unreadCount > 0) {
      // Atualizar o estado local imediatamente para feedback visual
      setContacts(prevContacts => 
        prevContacts.map(c => 
          c.id === contact.id 
            ? { ...c, unreadCount: 0 }
            : c
        )
      );

      try {
        const { error } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('sender_id', contact.id)
          .eq('receiver_id', user?.id)
          .is('read_at', null);
        
        if (error) {
          console.error('Erro ao marcar mensagens como lidas:', error);
          // Reverter o estado local em caso de erro
          setContacts(prevContacts => 
            prevContacts.map(c => 
              c.id === contact.id 
                ? { ...c, unreadCount: contact.unreadCount }
                : c
            )
          );
        }
      } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
        // Reverter o estado local em caso de erro
        setContacts(prevContacts => 
          prevContacts.map(c => 
            c.id === contact.id 
              ? { ...c, unreadCount: contact.unreadCount }
              : c
          )
        );
      }
    }
    
    setSelectedContact(contact);
  };

  if (selectedContact) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col">
        <Navigation userType={user?.type && user.type !== 'admin' ? user.type : 'student'} userName={user?.name || ''} userEmail={user?.email || ''} />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedContact(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Mensagens</h1>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <ChatComponent
              recipientId={selectedContact.id}
              recipientName={selectedContact.name}
              recipientType={selectedContact.role as 'student' | 'professor'}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col">
      <Navigation userType={user?.type && user.type !== 'admin' ? user.type : 'student'} userName={user?.name || ''} userEmail={user?.email || ''} />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Mensagens</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conversas</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllMessagesAsRead}
                  disabled={!contacts.some(c => c.unreadCount && c.unreadCount > 0)}
                >
                  Marcar todas como lidas
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contatos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Carregando contatos...</div>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleContactClick(contact)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`text-white ${getRoleColor(contact.role)}`}>
                            {getInitials(contact.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{contact.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getRoleLabel(contact.role)}
                            </Badge>
                            {contact.unreadCount && contact.unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white text-xs">
                                {contact.unreadCount}
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground truncate">
                            {contact.lastMessage || 'Nenhuma mensagem ainda'}
                          </p>

                          {contact.lastMessageTime && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(contact.lastMessageTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Messages;
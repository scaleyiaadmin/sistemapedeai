import { useState, useMemo } from 'react';
import { 
  MessageSquare, Search, User, Bot, Clock, 
  Phone, Mail, ChevronRight, Eye
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock conversation data - In production, this would come from Supabase
interface Message {
  id: string;
  sender: 'bot' | 'customer';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: boolean;
  messages: Message[];
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'João Silva',
    customerPhone: '(11) 99999-1234',
    lastMessage: 'Obrigado! Vou pedir uma cerveja.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    unread: true,
    messages: [
      { id: '1', sender: 'customer', content: 'Olá! Gostaria de ver o cardápio.', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
      { id: '2', sender: 'bot', content: 'Olá João! Bem-vindo ao PedeAI! 🍽️ Aqui está nosso cardápio: \n\n🍺 Bar:\n- Cerveja Pilsen - R$ 12,00\n- Caipirinha - R$ 18,00\n\n🍖 Cozinha:\n- Picanha Grelhada - R$ 89,00\n- Fritas Especiais - R$ 28,00', timestamp: new Date(Date.now() - 1000 * 60 * 29) },
      { id: '3', sender: 'customer', content: 'Quais cervejas vocês têm?', timestamp: new Date(Date.now() - 1000 * 60 * 20) },
      { id: '4', sender: 'bot', content: 'Temos as seguintes opções de cerveja:\n\n🍺 Cerveja Pilsen (600ml) - R$ 12,00\n🍺 Cerveja Premium (Long Neck) - R$ 15,00\n🍺 Cerveja Artesanal IPA - R$ 22,00\n\nGostaria de fazer um pedido?', timestamp: new Date(Date.now() - 1000 * 60 * 19) },
      { id: '5', sender: 'customer', content: 'Obrigado! Vou pedir uma cerveja.', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    ],
  },
  {
    id: '2',
    customerId: '2',
    customerName: 'Maria Santos',
    customerPhone: '(11) 98888-5678',
    lastMessage: 'Pedido confirmado! Mesa 5.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 15),
    unread: false,
    messages: [
      { id: '1', sender: 'customer', content: 'Boa noite! Estou na mesa 5.', timestamp: new Date(Date.now() - 1000 * 60 * 45) },
      { id: '2', sender: 'bot', content: 'Boa noite Maria! Identificamos você na Mesa 5. O que gostaria de pedir?', timestamp: new Date(Date.now() - 1000 * 60 * 44) },
      { id: '3', sender: 'customer', content: 'Quero uma picanha e uma salada caesar', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
      { id: '4', sender: 'bot', content: '✅ Pedido confirmado!\n\n🍖 Picanha Grelhada - R$ 89,00\n🥗 Salada Caesar - R$ 35,00\n\nTotal: R$ 124,00\n\nSeu pedido está sendo preparado! Tempo estimado: 25 minutos.', timestamp: new Date(Date.now() - 1000 * 60 * 29) },
      { id: '5', sender: 'customer', content: 'Perfeito, obrigada!', timestamp: new Date(Date.now() - 1000 * 60 * 28) },
      { id: '6', sender: 'bot', content: 'Pedido confirmado! Mesa 5.', timestamp: new Date(Date.now() - 1000 * 60 * 15) },
    ],
  },
  {
    id: '3',
    customerId: '3',
    customerName: 'Carlos Oliveira',
    customerPhone: '(11) 97777-9012',
    lastMessage: 'A conta será enviada para sua mesa.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60),
    unread: false,
    messages: [
      { id: '1', sender: 'customer', content: 'Pode fechar a conta da mesa 3?', timestamp: new Date(Date.now() - 1000 * 60 * 65) },
      { id: '2', sender: 'bot', content: 'Claro! Aqui está o resumo da sua conta:\n\n🍺 3x Cerveja Pilsen - R$ 36,00\n🍟 1x Fritas Especiais - R$ 28,00\n\nSubtotal: R$ 64,00\nTaxa de serviço (10%): R$ 6,40\n\n💰 Total: R$ 70,40\n\nComo gostaria de pagar?', timestamp: new Date(Date.now() - 1000 * 60 * 64) },
      { id: '3', sender: 'customer', content: 'PIX', timestamp: new Date(Date.now() - 1000 * 60 * 62) },
      { id: '4', sender: 'bot', content: 'A conta será enviada para sua mesa.', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
    ],
  },
];

const ConversationsView: React.FC = () => {
  const { customers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const filteredConversations = useMemo(() => {
    return mockConversations.filter(conv => 
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customerPhone.includes(searchQuery)
    );
  }, [searchQuery]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* Conversations List */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Conversas
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-lg"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedConversation?.id === conv.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-secondary'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground truncate">{conv.customerName}</span>
                      {conv.unread && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(conv.lastMessageTime)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Conversation Detail */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedConversation.customerName}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {selectedConversation.customerPhone}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Eye className="w-3 h-3" />
                Somente Leitura
              </Badge>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${
                      message.sender === 'customer' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {message.sender === 'customer' && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.sender === 'customer'
                          ? 'bg-secondary text-foreground rounded-tl-sm'
                          : 'bg-primary text-primary-foreground rounded-tr-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'customer' ? 'text-muted-foreground' : 'text-primary-foreground/70'
                      }`}>
                        {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {message.sender === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Read-only notice */}
            <div className="p-4 border-t border-border bg-secondary/50">
              <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                Esta conversa é somente leitura. O cliente conversa diretamente com o agente.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Selecione uma conversa</h3>
              <p className="text-muted-foreground max-w-sm">
                Escolha uma conversa à esquerda para visualizar o histórico de mensagens entre o cliente e o agente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsView;

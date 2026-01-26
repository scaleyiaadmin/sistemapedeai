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
    <div className="flex-1 overflow-hidden bg-background">
      <div className="w-full h-full flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border bg-secondary/5">
            <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Conversas
            </h2>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                placeholder="Buscar conversa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-background border-border shadow-inner text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-200 group ${selectedConversation?.id === conv.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'hover:bg-secondary hover:translate-x-1'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors ${selectedConversation?.id === conv.id ? 'bg-white/20' : 'bg-secondary-foreground/5 group-hover:bg-primary/10'
                      }`}>
                      <User className={`w-6 h-6 ${selectedConversation?.id === conv.id ? 'text-white' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-bold truncate ${selectedConversation?.id === conv.id ? 'text-white' : 'text-foreground'}`}>
                          {conv.customerName}
                        </span>
                        {conv.unread && (
                          <span className={`w-2.5 h-2.5 rounded-full ring-4 ring-background flex-shrink-0 animate-pulse ${selectedConversation?.id === conv.id ? 'bg-white' : 'bg-primary'
                            }`} />
                        )}
                      </div>
                      <p className={`text-xs truncate font-medium ${selectedConversation?.id === conv.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock className={`w-3 h-3 ${selectedConversation?.id === conv.id ? 'text-white/60' : 'text-muted-foreground/50'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${selectedConversation?.id === conv.id ? 'text-white/60' : 'text-muted-foreground/50'}`}>
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Conversation Detail */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="px-8 py-5 border-b border-border bg-card/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground leading-tight">{selectedConversation.customerName}</h3>
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-tighter">
                        <Phone className="w-3 h-3 text-primary/50" />
                        {selectedConversation.customerPhone}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">Mesa {selectedConversation.id}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-2 h-8 px-4 rounded-full border-border bg-secondary/50 text-xs font-bold text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  Visualização do Garçom
                </Badge>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-8 bg-[#fdfdfd]">
                <div className="space-y-6 max-w-2xl mx-auto">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-end gap-3 ${message.sender === 'customer' ? 'justify-start' : 'justify-end'
                        }`}
                    >
                      {message.sender === 'customer' && (
                        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 border border-border/50 shadow-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm border ${message.sender === 'customer'
                          ? 'bg-white text-foreground border-border/50 rounded-bl-none'
                          : 'bg-primary text-primary-foreground border-primary/10 rounded-br-none'
                          }`}
                      >
                        <p className="whitespace-pre-line text-sm font-medium leading-relaxed">{message.content}</p>
                        <div className={`text-[10px] mt-2 font-black uppercase tracking-tighter flex items-center justify-end gap-1 ${message.sender === 'customer' ? 'text-muted-foreground/50' : 'text-primary-foreground/60'
                          }`}>
                          <Clock className="w-3 h-3" />
                          {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {message.sender === 'bot' && (
                        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-sm">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Read-only notice */}
              <div className="px-8 py-5 border-t border-border bg-secondary/10">
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <div className="h-px flex-1 bg-border/50" />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border/50 shadow-sm text-[10px] font-black uppercase tracking-widest">
                    <Eye className="w-4 h-4 text-primary" />
                    Chat Monitorado pelo Agente
                  </div>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-12 bg-[#F8F9FA]">
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6 shadow-sm border border-border/50">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">Suas Conversas</h3>
                <p className="text-muted-foreground max-w-sm mx-auto font-medium text-sm leading-relaxed">
                  Selecione um cliente à esquerda para acompanhar o progresso do atendimento em tempo real.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsView;

import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    Users,
    Store,
    PlusCircle,
    LayoutDashboard,
    LogOut,
    Loader2,
    TrendingUp,
    Search,
    Circle,
    History,
    ChevronRight,
    RefreshCw,
    BarChart3,
    Phone,
    UserCircle,
    Edit3,
    Trash2,
    X,
    FileText
} from 'lucide-react';
import SystemLogs from '@/components/admin/SystemLogs';
import Logo from '@/components/Logo';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';

const AdminDashboard: React.FC = () => {
    const { adminLogout } = useApp();
    const [stats, setStats] = useState({
        totalRestaurants: 0,
        totalUsers: 0,
    });
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'restaurants' | 'logs'>('dashboard');

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

    // New restaurant form state
    const [newRestaurant, setNewRestaurant] = useState({
        nome: '',
        email: '',
        senha: '',
        quantidade_mesas: '10',
        telefone: '',
        telefone_dono: '',
    });
    const [editingRestaurant, setEditingRestaurant] = useState<any | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch restaurants
            const { data: resData, count: resCount } = await supabase
                .from('Restaurantes')
                .select('*', { count: 'exact' });

            // Fetch users - ensuring we get the count even if data is partial
            const { data: userData, count: usersCount, error: userError } = await supabase
                .from('Usuários')
                .select('id, id_restaurante', { count: 'exact' });

            if (userError) {
                console.error('Error fetching users:', userError);
                toast.error(`Erro Usuários: ${userError.message}`);
            }

            console.log('Admin Debug - Restaurants:', resData);
            console.log('Admin Debug - Users Data:', userData);
            console.log('Admin Debug - Users Count:', usersCount);

            const totalUsersCalculated = usersCount ?? userData?.length ?? 0;

            if (totalUsersCalculated === 0 && resCount && resCount > 0) {
                console.warn('Alerta: Restaurantes encontrados, mas usuários retornaram zero. Verifique as políticas de RLS no Supabase.');
            }

            setStats({
                totalRestaurants: resCount || 0,
                totalUsers: totalUsersCalculated,
            });
            setRestaurants(resData || []);

            // Process chart data: Users per restaurant
            const userCounts = (userData || []).reduce((acc: any, curr) => {
                const resId = curr.id_restaurante;
                if (resId) {
                    acc[resId] = (acc[resId] || 0) + 1;
                } else {
                    acc['unlinked'] = (acc['unlinked'] || 0) + 1;
                }
                return acc;
            }, {});

            const dataForChart = (resData || []).map(res => ({
                name: res.nome || 'Restaurante',
                users: userCounts[res.id] || 0
            }));

            // Add unlinked users to chart if any exist
            if (userCounts['unlinked']) {
                dataForChart.push({
                    name: 'Sem Restaurante',
                    users: userCounts['unlinked']
                });
            }

            const finalChartData = dataForChart
                .sort((a, b) => b.users - a.users)
                .slice(0, 10);

            setChartData(finalChartData);

        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error('Erro ao carregar dados do painel');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingRestaurant) {
                const { error } = await supabase
                    .from('Restaurantes')
                    .update({
                        nome: newRestaurant.nome,
                        email: newRestaurant.email,
                        senha: newRestaurant.senha,
                        quantidade_mesas: newRestaurant.quantidade_mesas,
                        telefone: newRestaurant.telefone,
                        // telefone_dono: newRestaurant.telefone_dono,
                    })
                    .eq('id', editingRestaurant.id);

                if (error) throw error;
                toast.success('Restaurante atualizado com sucesso!');
                setEditingRestaurant(null);
            } else {
                const { error } = await supabase
                    .from('Restaurantes')
                    .insert([
                        {
                            nome: newRestaurant.nome,
                            email: newRestaurant.email,
                            senha: newRestaurant.senha,
                            quantidade_mesas: newRestaurant.quantidade_mesas,
                            telefone: newRestaurant.telefone,
                        }
                    ]);

                if (error) throw error;
                toast.success('Restaurante cadastrado com sucesso!');
            }

            setNewRestaurant({ nome: '', email: '', senha: '', quantidade_mesas: '10', telefone: '', telefone_dono: '' });
            fetchData();
        } catch (error: any) {
            console.error('Error saving restaurant:', error);
            toast.error(error.message || 'Erro ao processar solicitação');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (res: any) => {
        setEditingRestaurant(res);
        setNewRestaurant({
            nome: res.nome || '',
            email: res.email || '',
            senha: res.senha || '',
            quantidade_mesas: String(res.quantidade_mesas || '10'),
            telefone: res.telefone || '',
            telefone_dono: res.telefone_dono || '',
        });
        // Scroll to form if on mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteRestaurant = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o restaurante "${name}"?`)) return;

        try {
            const { error } = await supabase
                .from('Restaurantes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Restaurante removido com sucesso!');
            fetchData();
        } catch (error: any) {
            toast.error('Erro ao remover restaurante');
        }
    };

    const cancelEdit = () => {
        setEditingRestaurant(null);
        setNewRestaurant({ nome: '', email: '', senha: '', quantidade_mesas: '10', telefone: '', telefone_dono: '' });
    };

    const generateRandomPassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewRestaurant(prev => ({ ...prev, senha: password }));
        toast.info('Senha aleatória gerada!');
    };

    const filteredRestaurants = restaurants.filter(r =>
        r.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
            {/* Header - Matching original Topbar style */}
            <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between shadow-sm sticky top-0 z-50">
                {/* Left: Logo + Brand Name */}
                <div className="flex items-center gap-3 min-w-[140px]">
                    <Logo size="sm" />
                    <div className="h-6 w-px bg-border mx-1" />
                    <span className="font-semibold text-foreground text-sm">
                        Admin
                    </span>
                </div>

                {/* Center: Navigation Pill Buttons */}
                <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-full border border-border/50">
                    <Button
                        variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('dashboard')}
                        className={`rounded-full px-5 h-8 text-xs font-bold transition-all ${activeTab === 'dashboard'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                            }`}
                    >
                        Dashboard
                    </Button>
                    <Button
                        variant={activeTab === 'restaurants' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('restaurants')}
                        className={`rounded-full px-5 h-8 text-xs font-bold transition-all ${activeTab === 'restaurants'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                            }`}
                    >
                        Restaurantes
                    </Button>
                    <Button
                        variant={activeTab === 'logs' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('logs')}
                        className={`rounded-full px-5 h-8 text-xs font-bold transition-all ${activeTab === 'logs'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                            }`}
                    >
                        Logs
                    </Button>
                </div>

                {/* Right: Status, Search, Logout */}
                <div className="flex items-center gap-3 min-w-[140px] justify-end">
                    <div className="hidden md:flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                        <Circle className="w-2 h-2 fill-current animate-pulse" />
                        <span>Online</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={adminLogout}
                        className="rounded-full h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-colors group"
                        title="Sair"
                    >
                        <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-6 w-full space-y-6 overflow-y-auto bg-[#FAFAFA]">
                {activeTab === 'dashboard' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                                <p className="text-sm text-muted-foreground">Visão geral da plataforma</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchData}
                                className="gap-2 h-9"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Atualizar
                            </Button>
                        </div>

                        {/* Simple Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Estabelecimentos */}
                            <Card className="border-none shadow-sm bg-white">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <Store className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+12%</span>
                                    </div>
                                    <div className="text-2xl font-bold text-foreground mb-1">{stats.totalRestaurants}</div>
                                    <div className="text-xs text-muted-foreground">Estabelecimentos</div>
                                </CardContent>
                            </Card>

                            {/* Usuários */}
                            <Card className="border-none shadow-sm bg-white">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">+8%</span>
                                    </div>
                                    <div className="text-2xl font-bold text-foreground mb-1">{stats.totalUsers}</div>
                                    <div className="text-xs text-muted-foreground">Usuários Ativos</div>
                                </CardContent>
                            </Card>

                            {/* Média */}
                            <Card className="border-none shadow-sm bg-white">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                            <BarChart3 className="w-5 h-5 text-purple-600" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-foreground mb-1">
                                        {stats.totalRestaurants > 0 ? (stats.totalUsers / stats.totalRestaurants).toFixed(1) : 0}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Média por Loja</div>
                                </CardContent>
                            </Card>

                            {/* Taxa de Crescimento */}
                            <Card className="border-none shadow-sm bg-white">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">+5%</span>
                                    </div>
                                    <div className="text-2xl font-bold text-foreground mb-1">
                                        {stats.totalRestaurants > 0 ? ((stats.totalUsers / stats.totalRestaurants) * 10).toFixed(0) : 0}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">Taxa de Engajamento</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Chart - Takes 2 columns */}
                            <Card className="lg:col-span-2 border-none shadow-sm bg-white">
                                <CardHeader className="border-b px-6 py-4">
                                    <CardTitle className="text-base font-semibold">Distribuição de Usuários</CardTitle>
                                    <CardDescription className="text-xs">Top 10 restaurantes por número de usuários</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                                                    cursor={{ fill: '#f8f9fa' }}
                                                />
                                                <Bar dataKey="users" radius={[6, 6, 0, 0]} fill="#3b82f6">
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Stats - Takes 1 column */}
                            <Card className="border-none shadow-sm bg-white">
                                <CardHeader className="border-b px-6 py-4">
                                    <CardTitle className="text-base font-semibold">Estatísticas Rápidas</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-sm text-muted-foreground">Total de Mesas</span>
                                        <span className="text-sm font-bold text-foreground">
                                            {restaurants.reduce((acc, r) => acc + (parseInt(r.quantidade_mesas) || 0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-sm text-muted-foreground">Média Mesas/Loja</span>
                                        <span className="text-sm font-bold text-foreground">
                                            {stats.totalRestaurants > 0
                                                ? (restaurants.reduce((acc, r) => acc + (parseInt(r.quantidade_mesas) || 0), 0) / stats.totalRestaurants).toFixed(0)
                                                : 0
                                            }
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-sm text-muted-foreground">Novos Este Mês</span>
                                        <span className="text-sm font-bold text-emerald-600">+2</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-muted-foreground">Status Geral</span>
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Operacional</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activity */}
                        <Card className="border-none shadow-sm bg-white">
                            <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b">
                                <div>
                                    <CardTitle className="text-base font-semibold">Cadastros Recentes</CardTitle>
                                    <CardDescription className="text-xs">Últimos estabelecimentos adicionados</CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveTab('restaurants')}
                                    className="text-xs font-medium text-primary hover:bg-primary/5"
                                >
                                    Ver Todos
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {restaurants.slice(0, 5).map((res) => (
                                        <div key={res.id} className="px-6 py-4 hover:bg-secondary/5 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                        {res.nome?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">{res.nome}</p>
                                                        <p className="text-xs text-muted-foreground">{res.email}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">{new Date(res.created_at).toLocaleDateString('pt-BR')}</p>
                                                    <p className="text-xs font-medium text-foreground">{res.quantidade_mesas} mesas</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SystemLogs />
                    </div>
                )}

                {activeTab === 'restaurants' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 items-start">
                        {/* Add Restaurant Form */}
                        <Card className="lg:col-span-4 shadow-md border-border bg-card overflow-hidden sticky top-24">
                            <CardHeader className="px-6 py-5 border-b border-border/40 bg-secondary/5">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                        {editingRestaurant ? <Edit3 className="w-5 h-5 text-primary" /> : <PlusCircle className="w-5 h-5 text-primary" />}
                                        {editingRestaurant ? 'Editar Restaurante' : 'Novo Restaurante'}
                                    </CardTitle>
                                    {editingRestaurant && (
                                        <Button variant="ghost" size="icon" onClick={cancelEdit} className="h-8 w-8 rounded-full text-muted-foreground">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                                <CardDescription className="text-xs">
                                    {editingRestaurant ? `Editando: ${editingRestaurant.nome}` : 'Expandir rede de estabelecimentos.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleAddRestaurant} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="res-name" className="font-black text-[10px] uppercase text-muted-foreground/70 tracking-tight pl-1">Nome Comercial</Label>
                                        <Input
                                            id="res-name"
                                            placeholder="Ex: Pizzaria Real"
                                            value={newRestaurant.nome}
                                            onChange={e => setNewRestaurant({ ...newRestaurant, nome: e.target.value })}
                                            className="bg-secondary/30 border-none rounded-xl h-12 text-sm focus-visible:ring-primary shadow-inner"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="res-email" className="font-black text-[10px] uppercase text-muted-foreground/70 tracking-tight pl-1">Email de Acesso</Label>
                                        <Input
                                            id="res-email"
                                            type="email"
                                            placeholder="restaurante@pedeai.com"
                                            value={newRestaurant.email}
                                            onChange={e => setNewRestaurant({ ...newRestaurant, email: e.target.value })}
                                            className="bg-secondary/30 border-none rounded-xl h-12 text-sm focus-visible:ring-primary shadow-inner"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="res-phone" className="font-black text-[10px] uppercase text-muted-foreground/70 tracking-tight pl-1">Telefone Principal</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                                                <Input
                                                    id="res-phone"
                                                    placeholder="(00) 00000-0000"
                                                    value={newRestaurant.telefone}
                                                    onChange={e => setNewRestaurant({ ...newRestaurant, telefone: e.target.value })}
                                                    className="bg-secondary/30 border-none rounded-xl h-12 pl-10 text-sm focus-visible:ring-primary shadow-inner"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="owner-phone" className="font-black text-[10px] uppercase text-muted-foreground/70 tracking-tight pl-1">Telefone do Dono</Label>
                                            <div className="relative">
                                                <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                                                <Input
                                                    id="owner-phone"
                                                    placeholder="(00) 00000-0000"
                                                    value={newRestaurant.telefone_dono}
                                                    onChange={e => setNewRestaurant({ ...newRestaurant, telefone_dono: e.target.value })}
                                                    className="bg-secondary/30 border-none rounded-xl h-12 pl-10 text-sm focus-visible:ring-primary shadow-inner"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="res-pass" className="font-black text-[10px] uppercase text-muted-foreground/70 tracking-tight pl-1">Senha de Acesso</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="res-pass"
                                                type="text"
                                                placeholder="••••••••"
                                                value={newRestaurant.senha}
                                                onChange={e => setNewRestaurant({ ...newRestaurant, senha: e.target.value })}
                                                className="bg-secondary/30 border-none rounded-xl h-12 text-sm flex-1 focus-visible:ring-primary shadow-inner"
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                onClick={generateRandomPassword}
                                                className="shrink-0 rounded-xl h-12 w-12 shadow-sm border border-border/50 hover:bg-white transition-colors"
                                                title="Gerar senha aleatória"
                                            >
                                                <RefreshCw className="w-4 h-4 text-primary" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="res-tables" className="font-black text-[10px] uppercase text-muted-foreground/70 tracking-tight pl-1">Quantidade de Mesas</Label>
                                        <Input
                                            id="res-tables"
                                            type="number"
                                            value={newRestaurant.quantidade_mesas}
                                            onChange={e => setNewRestaurant({ ...newRestaurant, quantidade_mesas: e.target.value })}
                                            className="bg-secondary/30 border-none rounded-xl h-12 text-sm focus-visible:ring-primary shadow-inner"
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full mt-2 bg-primary text-white font-black h-14 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] transition-all uppercase text-xs tracking-widest"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : editingRestaurant ? 'Atualizar Dados' : 'Finalizar Cadastro'}
                                    </Button>
                                    {editingRestaurant && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={cancelEdit}
                                            className="w-full text-muted-foreground font-bold text-[10px] uppercase tracking-widest mt-2"
                                        >
                                            Cancelar Edição
                                        </Button>
                                    )}
                                </form>
                            </CardContent>
                        </Card>

                        {/* List Column */}
                        <Card className="lg:col-span-8 shadow-md border-border bg-card overflow-hidden flex flex-col">
                            <CardHeader className="flex flex-row items-center justify-between px-8 py-5 border-b border-border/40 bg-secondary/5">
                                <div>
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Store className="w-5 h-5 text-primary" />
                                        Gestão de Lojas
                                    </CardTitle>
                                    <CardDescription className="text-xs">Lista completa de parceiros integrados.</CardDescription>
                                </div>
                                <div className="relative w-80">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                    <Input
                                        placeholder="Buscar por nome ou email..."
                                        className="pl-10 h-10 rounded-full bg-white border-border shadow-sm text-xs focus-visible:ring-primary"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1">
                                <div className="overflow-x-auto h-full">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="text-[10px] text-muted-foreground uppercase bg-secondary/20 font-black tracking-widest sticky top-0 z-10">
                                            <tr>
                                                <th className="px-8 py-5 border-b border-border/50">Restaurante</th>
                                                <th className="px-8 py-5 border-b border-border/50">Contato Administrativo</th>
                                                <th className="px-8 py-5 border-b border-border/50 text-center">Mesas</th>
                                                <th className="px-8 py-5 border-b border-border/50 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-24 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                                                            <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">Sincronizando Banco...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredRestaurants.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-24 text-center">
                                                        <p className="text-sm font-bold text-muted-foreground/40 italic">Nenhum resultado para "{searchTerm}"</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredRestaurants.map((res) => (
                                                    <tr key={res.id} className="hover:bg-secondary/5 transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                                    {res.nome?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <p className="font-bold text-foreground transition-colors">{res.nome}</p>
                                                                    <p className="text-[9px] uppercase font-black text-muted-foreground/40 tracking-wider">Início: {new Date(res.created_at).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <p className="text-foreground font-bold text-xs">{res.email}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] text-muted-foreground font-mono bg-secondary/40 px-2 py-0.5 rounded border border-border/30">L: {res.senha}</span>
                                                                {res.telefone && <span className="text-[10px] text-primary/70 font-bold flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {res.telefone}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <span className="font-black text-xs text-foreground bg-secondary/50 px-4 py-1.5 rounded-xl border border-border/30 shadow-sm">{res.quantidade_mesas}</span>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleEditClick(res)}
                                                                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                                    title="Editar"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteRestaurant(res.id, res.nome)}
                                                                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                                    title="Excluir"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                                <div className="w-px h-4 bg-border/50 mx-1" />
                                                                <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-widest text-primary hover:bg-primary/10 rounded-full h-8 px-4 border border-transparent hover:border-primary/20 transition-all">
                                                                    Aceder
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;

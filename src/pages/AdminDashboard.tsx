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
    X
} from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'restaurants'>('dashboard');

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

            <main className="flex-1 p-8 max-w-[1280px] mx-auto w-full space-y-8 overflow-y-auto">
                {activeTab === 'dashboard' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-foreground tracking-tight">Visão Geral</h1>
                                <p className="text-muted-foreground font-medium">Controle e estatísticas da plataforma</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 rounded-full h-10 px-6 border-border shadow-sm hover:bg-secondary/50">
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="font-bold text-xs uppercase tracking-wider">Sincronizar</span>
                            </Button>
                        </div>

                        {/* Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="bg-card border-border shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Estabelecimentos Ativos
                                    </CardTitle>
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Store className="w-5 h-5 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black text-foreground">{stats.totalRestaurants}</div>
                                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold mt-1">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>+2 novos este mês</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-border shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Usuários Totais
                                    </CardTitle>
                                    <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-info" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black text-foreground">{stats.totalUsers}</div>
                                    <div className="text-xs text-muted-foreground font-medium mt-1">
                                        Sincronizado com o Supabase
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-border shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Média de Clientes / Loja
                                    </CardTitle>
                                    <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-warning" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black text-foreground">
                                        {stats.totalRestaurants > 0 ? (stats.totalUsers / stats.totalRestaurants).toFixed(1) : 0}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-medium mt-1">
                                        Engajamento médio da rede
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 gap-6">
                            <Card className="bg-card border-border shadow-sm overflow-hidden">
                                <CardHeader className="border-b border-border/40 bg-secondary/5 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-primary" />
                                                Usuários por Restaurante
                                            </CardTitle>
                                            <CardDescription className="text-xs">Engajamento total por estabelecimento</CardDescription>
                                        </div>
                                        <div className="bg-white/50 p-1.5 rounded-lg border border-border/50">
                                            <BarChart3 className="w-4 h-4 text-muted-foreground/50" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="h-[320px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    cursor={{ fill: '#f1f5f9' }}
                                                />
                                                <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent History Table at Dashboard */}
                        <Card className="bg-card border-border shadow-md overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-border/40">
                                <div>
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <History className="w-5 h-5 text-primary" />
                                        Cadastros Recentes
                                    </CardTitle>
                                    <CardDescription className="text-xs">Últimos estabelecimentos integrados</CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveTab('restaurants')}
                                    className="text-primary hover:bg-primary/5 rounded-full font-black text-[10px] uppercase tracking-widest px-4"
                                >
                                    Ver Todos
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-[10px] text-muted-foreground uppercase bg-secondary/20 font-black tracking-widest">
                                            <tr>
                                                <th className="px-8 py-4">Restaurante</th>
                                                <th className="px-8 py-4">Data de Início</th>
                                                <th className="px-8 py-4 text-center">Status</th>
                                                <th className="px-8 py-4 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {restaurants.slice(0, 5).map((res) => (
                                                <tr key={res.id} className="hover:bg-secondary/5 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                                {res.nome?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-bold text-foreground">{res.nome}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-muted-foreground font-medium">{new Date(res.created_at).toLocaleDateString()}</td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100/50 text-emerald-700 border border-emerald-200/50">
                                                            Ativo
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-primary hover:bg-primary/5">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
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

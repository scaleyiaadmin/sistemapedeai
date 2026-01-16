import { useMemo } from 'react';
import { 
  TrendingUp, DollarSign, ShoppingBag, Users, 
  ArrowUpRight, ArrowDownRight, Package
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DashboardHome: React.FC = () => {
  const { orders, products, tables, customers, stockMovements } = useApp();

  // Calculate daily sales metrics
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate total sales from delivered orders (simulated)
    const totalSales = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    }, 0) + 1250.50; // Add mock previous sales

    // Product sales count
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    // Sort by quantity sold
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Add mock products if not enough
    if (topProducts.length < 5) {
      const mockProducts = [
        { name: 'Cerveja Pilsen', quantity: 45, revenue: 540 },
        { name: 'Picanha Grelhada', quantity: 12, revenue: 1068 },
        { name: 'Caipirinha', quantity: 28, revenue: 504 },
        { name: 'Fritas Especiais', quantity: 18, revenue: 504 },
        { name: 'Água Mineral', quantity: 35, revenue: 175 },
      ];
      mockProducts.forEach((mp) => {
        if (topProducts.length < 5 && !topProducts.find(p => p.name === mp.name)) {
          topProducts.push(mp);
        }
      });
    }

    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;

    return {
      totalSales,
      topProducts: topProducts.slice(0, 5),
      occupiedTables,
      totalTables: tables.length,
      pendingOrders,
      totalCustomers: customers.length,
    };
  }, [orders, tables, customers]);

  // Recent stock movements
  const recentMovements = stockMovements.slice(0, 5);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumo do dia</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sales */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas do Dia
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {metrics.totalSales.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 text-sm text-success mt-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>+12.5% vs ontem</span>
              </div>
            </CardContent>
          </Card>

          {/* Occupied Tables */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mesas Ocupadas
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {metrics.occupiedTables}/{metrics.totalTables}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {((metrics.occupiedTables / metrics.totalTables) * 100).toFixed(0)}% ocupação
              </div>
            </CardContent>
          </Card>

          {/* Pending Orders */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pedidos Pendentes
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {metrics.pendingOrders}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Aguardando preparo
              </div>
            </CardContent>
          </Card>

          {/* Total Customers */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Cadastrados
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {metrics.totalCustomers}
              </div>
              <div className="flex items-center gap-1 text-sm text-success mt-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>+3 esta semana</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Produtos Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-primary/20 text-primary' :
                        index === 1 ? 'bg-info/20 text-info' :
                        index === 2 ? 'bg-warning/20 text-warning' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.quantity} vendidos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">R$ {product.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity / Stock Movements */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Movimentação Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMovements.length > 0 ? (
                  recentMovements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          movement.type === 'in' ? 'bg-success/20' : 'bg-destructive/20'
                        }`}>
                          {movement.type === 'in' ? (
                            <ArrowUpRight className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{movement.productName}</p>
                          <p className="text-sm text-muted-foreground">{movement.reason}</p>
                        </div>
                      </div>
                      <Badge variant={movement.type === 'in' ? 'default' : 'destructive'}>
                        {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma movimentação recente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Bar */}
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <div className="flex items-center justify-around divide-x divide-border">
              <div className="text-center px-4">
                <p className="text-2xl font-bold text-primary">{products.filter(p => p.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Produtos Ativos</p>
              </div>
              <div className="text-center px-4">
                <p className="text-2xl font-bold text-warning">{products.filter(p => p.stock <= (p.minStock || 10)).length}</p>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
              </div>
              <div className="text-center px-4">
                <p className="text-2xl font-bold text-info">{orders.filter(o => o.station === 'bar').length}</p>
                <p className="text-sm text-muted-foreground">Pedidos Bar</p>
              </div>
              <div className="text-center px-4">
                <p className="text-2xl font-bold text-accent">{orders.filter(o => o.station === 'kitchen').length}</p>
                <p className="text-sm text-muted-foreground">Pedidos Cozinha</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;

import { useState } from 'react';
import { Beer, Utensils, Bell, Receipt, HelpCircle } from 'lucide-react';
import { useApp, Table } from '@/contexts/AppContext';
import TableDetailModal from './TableDetailModal';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const TableGrid: React.FC = () => {
  const { tables, settings, filter, orders } = useApp();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const getTableOrders = (tableId: number) => {
    return orders.filter(o => o.tableId === tableId);
  };

  const hasBarOrders = (tableId: number) => {
    return getTableOrders(tableId).some(o => o.station === 'bar');
  };

  const hasKitchenOrders = (tableId: number) => {
    return getTableOrders(tableId).some(o => o.station === 'kitchen');
  };

  const filteredTables = tables.filter(table => {
    if (filter === 'all') return true;
    const tableOrders = getTableOrders(table.id);
    if (filter === 'bar') return tableOrders.some(o => o.station === 'bar');
    if (filter === 'kitchen') return tableOrders.some(o => o.station === 'kitchen');
    return true;
  });

  const getAlertClass = (table: Table) => {
    if (!settings.flashingEnabled || !table.alert) return '';
    if (table.alert === 'waiter') return 'animate-flash-yellow';
    if (table.alert === 'bill') return 'animate-flash-blue';
    return '';
  };

  const legendItems = [
    { color: 'bg-free', borderColor: 'border-free', label: 'Mesa Livre' },
    { color: 'bg-occupied', borderColor: 'border-occupied', label: 'Mesa Ocupada' },
    { color: 'bg-warning/50', borderColor: 'border-warning', label: 'Chamar Garçom', icon: Bell },
    { color: 'bg-info/50', borderColor: 'border-info', label: 'Pedir Conta', icon: Receipt },
  ];

  return (
    <>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Mesas ({tables.length})
          </h2>

          {/* Legend Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                Legenda
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <h4 className="font-semibold text-foreground mb-3">Legenda de Status</h4>
              <div className="space-y-2">
                {legendItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg border-2 ${item.borderColor} ${item.color} flex items-center justify-center`}>
                      {item.icon && <item.icon className="w-4 h-4" />}
                    </div>
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2">
                  <p className="text-xs text-muted-foreground">Ícones nos cards:</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Beer className="w-4 h-4 text-info" />
                      <span className="text-xs text-muted-foreground">Bar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Utensils className="w-4 h-4 text-warning" />
                      <span className="text-xs text-muted-foreground">Cozinha</span>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Responsive Grid - Optimized for tablets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 touch-pan-y">
          {filteredTables.map((table) => (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`
                relative p-4 rounded-xl bg-card border-2 transition-all duration-200 
                hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                touch-manipulation select-none
                min-h-[100px] flex flex-col items-center justify-center
                ${table.status === 'occupied' ? 'border-occupied' : 'border-free'}
                ${getAlertClass(table)}
              `}
            >
              {/* Alert Icons */}
              {table.alert && (
                <div className="absolute top-2 right-2">
                  {table.alert === 'waiter' && (
                    <Bell className="w-4 h-4 text-warning animate-pulse" />
                  )}
                  {table.alert === 'bill' && (
                    <Receipt className="w-4 h-4 text-info animate-pulse" />
                  )}
                </div>
              )}

              {/* Table Number */}
              <div className="text-3xl font-bold text-foreground mb-1">
                {table.id}
              </div>

              {/* Status Text */}
              <p className={`text-xs font-medium ${table.status === 'occupied' ? 'text-occupied' : 'text-free'}`}>
                {table.status === 'occupied' ? 'Ocupada' : 'Livre'}
              </p>

              {/* Station Icons */}
              <div className="flex items-center gap-1 mt-2">
                {hasBarOrders(table.id) && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-info/20">
                    <Beer className="w-3 h-3 text-info" />
                  </div>
                )}
                {hasKitchenOrders(table.id) && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-warning/20">
                    <Utensils className="w-3 h-3 text-warning" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTable && (
        <TableDetailModal 
          table={selectedTable} 
          onClose={() => setSelectedTable(null)} 
        />
      )}
    </>
  );
};

export default TableGrid;

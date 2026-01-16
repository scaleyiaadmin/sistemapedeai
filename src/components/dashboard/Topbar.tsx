import { useState } from 'react';
import { Search, Settings, Circle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import SettingsModal from './SettingsModal';

interface TopbarProps {
  activeView: 'dashboard' | 'operation' | 'conversations';
  onViewChange: (view: 'dashboard' | 'operation' | 'conversations') => void;
}

const Topbar: React.FC<TopbarProps> = ({ activeView, onViewChange }) => {
  const { settings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnline] = useState(true);

  const navItems = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'operation', label: 'Operação' },
    { value: 'conversations', label: 'Conversas' },
  ] as const;

  return (
    <>
      <header className="h-16 bg-card border-b border-border px-4 flex items-center justify-between shadow-sm">
        {/* Left: Logo + Restaurant Name */}
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="h-6 w-px bg-border" />
          <span className="font-semibold text-foreground text-sm">
            {settings.restaurantName}
          </span>
        </div>

        {/* Center: Navigation */}
        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <Button
              key={item.value}
              variant={activeView === item.value ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onViewChange(item.value)}
              className={`rounded-full px-4 transition-all ${
                activeView === item.value 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {/* Right: Status, Search, Settings */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
                <Circle className="w-2.5 h-2.5 fill-current" />
                <span className="hidden sm:inline">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-destructive text-sm font-medium">
                <Circle className="w-2.5 h-2.5 fill-current" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48 h-9 rounded-full bg-secondary border-none"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-full hover:bg-secondary"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </Button>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};

export default Topbar;

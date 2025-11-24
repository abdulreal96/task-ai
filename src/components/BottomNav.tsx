import { LucideIcon } from 'lucide-react';

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type BottomNavProps = {
  items: NavItem[];
  currentScreen: string;
  onNavigate: (screen: any) => void;
};

export function BottomNav({ items, currentScreen, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

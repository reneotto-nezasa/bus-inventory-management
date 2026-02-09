import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Grid3X3,
  MapPin,
  Bus,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';

export type PageId = 'dashboard' | 'seatmaps' | 'boarding' | 'trips' | 'import';

interface NavItem {
  id: PageId;
  labelKey: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { id: 'seatmaps', labelKey: 'nav.seatMaps', icon: Grid3X3 },
  { id: 'boarding', labelKey: 'nav.boardingPoints', icon: MapPin },
  { id: 'trips', labelKey: 'nav.trips', icon: Bus },
  { id: 'import', labelKey: 'nav.import', icon: Upload },
];

interface AppLayoutProps {
  children: ReactNode;
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AppLayout({
  children,
  activePage,
  onPageChange,
  collapsed,
  onToggleCollapse,
}: AppLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 text-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex items-center h-16 px-4 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <Bus className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg">FleetManager</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 mx-auto bg-teal-500 rounded-lg flex items-center justify-center">
              <Bus className="w-5 h-5" />
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-700">
          <LanguageToggle collapsed={collapsed} />
        </div>

        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center h-12 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </aside>

      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  );
}

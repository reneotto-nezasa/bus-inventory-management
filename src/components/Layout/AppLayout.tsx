import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Grid3X3,
  MapPin,
  Bus,
  Upload,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-all duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-64 lg:w-16' : 'w-64'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
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
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="lg:hidden">{t(item.labelKey)}</span>
                {!collapsed && <span className="hidden lg:inline">{t(item.labelKey)}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-700">
          <LanguageToggle collapsed={collapsed} />
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center h-12 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">FleetManager</span>
          </div>
          <div className="w-10"></div>
        </header>

        <main
          className={`flex-1 transition-all duration-300 lg:${
            collapsed ? 'ml-16' : 'ml-64'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MonitorPlay, Image as ImageIcon, Settings } from 'lucide-react';
import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export default function AdminLayout() {
  const location = useLocation();
  const tvHeartbeat = useStore((state) => state.tvHeartbeat);

  useEffect(() => {
    const channel = new BroadcastChannel('hardsoft_tv_channel');
    channel.onmessage = (event) => {
      if (event.data.type === 'PING') {
        tvHeartbeat(event.data.tvId);
      }
    };
    return () => channel.close();
  }, [tvHeartbeat]);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Écrans', path: '/admin/screens', icon: MonitorPlay },
    { name: 'Médiathèque', path: '/admin/media', icon: ImageIcon },
  ];

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden text-neutral-900">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <MonitorPlay className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">HardSoft TV</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-300">
            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
              A
            </div>
            <div>
              <p className="font-medium text-white">Admin</p>
              <p className="text-xs text-neutral-500">administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-neutral-800">
            {navItems.find(i => location.pathname.startsWith(i.path))?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Serveur Connecté
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

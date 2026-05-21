import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MonitorPlay, Image as ImageIcon, Settings, Calendar, Building, ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { io } from 'socket.io-client';

export default function AdminLayout() {
  const location = useLocation();
  const tvHeartbeat = useStore((state) => state.tvHeartbeat);
  const schedules = useStore((state) => state.schedules || []);
  const slides = useStore((state) => state.slides || []);
  const tvs = useStore((state) => state.tvs || []);
  const organizations = useStore((state) => state.organizations || []);
  const currentOrgId = useStore((state) => state.currentOrgId);
  const setCurrentOrgId = useStore((state) => state.setCurrentOrgId);

  useEffect(() => {
    const channel = new BroadcastChannel('hardsoft_tv_channel');
    channel.onmessage = (event) => {
      if (event.data.type === 'PING') {
        tvHeartbeat(event.data.tvId);
      }
    };
    return () => channel.close();
  }, [tvHeartbeat]);

  // Synchronize schedules, slides & TVs with backend server and handle live statuses
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Admin Sync] Connected. Broadcasting data maps to engine...');
      socket.emit("sync_data", { schedules, slides, tvs });
    });

    // Mirror online/offline events back inside Zustand store
    socket.on('tv_online', (tvId: string) => {
      useStore.getState().updateTVStatus(tvId, 'ONLINE');
    });

    socket.on('tv_offline', (tvId: string) => {
      useStore.getState().updateTVStatus(tvId, 'OFFLINE');
    });

    // Re-sync whenever local lists are updated
    socket.emit("sync_data", { schedules, slides, tvs });

    return () => {
      socket.disconnect();
    };
  }, [schedules, slides, tvs]);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Écrans', path: '/admin/screens', icon: MonitorPlay },
    { name: 'Médiathèque', path: '/admin/media', icon: ImageIcon },
    { name: 'Planning', path: '/admin/planning', icon: Calendar },
  ];

  const activeOrg = organizations.find(o => o.id === currentOrgId);

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden text-neutral-900 font-sans">
      {/* Sidebar */}
      <aside className="w-68 bg-neutral-900 text-white flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-neutral-800">
          <MonitorPlay className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight leading-none text-white">HardSoft SaaS</h1>
            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Digital Signage</span>
          </div>
        </div>

        {/* Multi-Tenant Organization Selector */}
        <div className="p-4 border-b border-neutral-850 bg-neutral-950/40">
          <label className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase block mb-2 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" /> Structure Active
          </label>
          <select 
            value={currentOrgId}
            onChange={(e) => setCurrentOrgId(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-xs text-white font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer focus:outline-none"
          >
            <option value="ALL">🌐 [SUPER ADMIN] Tous les Écrans</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>
                🏢 {org.name}
              </option>
            ))}
          </select>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10" 
                    : "text-neutral-300 hover:bg-neutral-800/60 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-300">
            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-bold text-blue-400 border border-neutral-600 shrink-0">
              {currentOrgId === 'ALL' ? <ShieldCheck className="w-4 h-4 text-blue-400" /> : activeOrg?.name.substring(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate text-xs">
                {currentOrgId === 'ALL' ? 'Super Administrateur' : activeOrg?.name}
              </p>
              <p className="text-[10px] text-neutral-500 truncate capitalize font-medium">
                {currentOrgId === 'ALL' ? 'SaaS Global Operator' : activeOrg?.type}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-800">
              {navItems.find(i => location.pathname.startsWith(i.path))?.name || 'Tableau de Bord'}
            </h2>
            <span className="text-neutral-300">|</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full ${currentOrgId === 'ALL' ? 'bg-indigo-500' : 'bg-green-500'}`}></span>
              Mode : {currentOrgId === 'ALL' ? 'Vue Globale' : activeOrg?.name}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-neutral-500">
            <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200/50 px-3 py-1.5 rounded-full select-none shadow-sm shadow-green-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              SaaS Engine Connecté
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

import { Activity, Monitor, WifiOff, FileImage, Calendar, HelpCircle, CheckCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export default function Dashboard() {
  const tvs = useStore((state) => state.tvs || []);
  const slides = useStore((state) => state.slides || []);
  const schedules = useStore((state) => state.schedules || []);
  const groups = useStore((state) => state.groups || []);
  const currentOrgId = useStore((state) => state.currentOrgId);

  // Filter lists based on multi-tenant scope selected
  const filteredTvs = currentOrgId === 'ALL' 
    ? tvs 
    : tvs.filter(t => t.orgId === currentOrgId);

  const filteredSlides = currentOrgId === 'ALL' 
    ? slides 
    : slides.filter(s => s.orgId === currentOrgId || s.orgId === 'SYSTEM');

  const filteredSchedules = currentOrgId === 'ALL' 
    ? schedules 
    : schedules.filter(s => s.orgId === currentOrgId);

  const filteredGroups = currentOrgId === 'ALL'
    ? groups
    : groups.filter(g => g.orgId === currentOrgId);

  // Derived state analytics
  const onlineTvs = filteredTvs.filter(tv => tv.status === 'ONLINE').length;
  const offlineTvs = filteredTvs.filter(tv => tv.status === 'OFFLINE').length;
  const activeSchedules = filteredSchedules.filter(s => s.isActive).length;

  return (
    <div className="space-y-6 text-neutral-800 leading-relaxed font-sans">
      
      {/* Dynamic Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 border border-blue-100">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Écrans</p>
            <p className="text-lg font-extrabold text-neutral-900 mt-0.5">{filteredTvs.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center shrink-0 border border-green-100">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Actives (Live)</p>
            <p className="text-lg font-extrabold text-neutral-900 mt-0.5">{onlineTvs}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 text-red-650 rounded-lg flex items-center justify-center shrink-0 border border-red-100">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Hors Ligne</p>
            <p className="text-lg font-extrabold text-neutral-900 mt-0.5">{offlineTvs}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-50 text-purple-650 rounded-lg flex items-center justify-center shrink-0 border border-purple-100">
            <FileImage className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Médiathèque</p>
            <p className="text-lg font-extrabold text-neutral-900 mt-0.5">{filteredSlides.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4 col-span-2 md:col-span-1">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0 border border-amber-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tranches de Plannings</p>
            <p className="text-lg font-extrabold text-neutral-900 mt-0.5">{activeSchedules}</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Recent Screen logs monitor */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-neutral-800 text-sm mb-1">États et lecture en direct</h3>
            <p className="text-xs text-neutral-500 mb-4">Aperçu en temps réel de ce qui est diffusé sur vos signages.</p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {filteredTvs.map((tv) => (
                <div key={tv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100/50 rounded-xl border border-neutral-200/50 gap-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      tv.status === 'ONLINE' ? "bg-green-500 animate-pulse" : "bg-neutral-300"
                    )} />
                    <div>
                      <p className="font-bold text-xs text-neutral-805 leading-none">{tv.name}</p>
                      <p className="text-[10px] text-neutral-550 mt-1">ID: {tv.id} &bull; Zone: {tv.location}</p>
                    </div>
                  </div>
                  
                  <div className="text-[11px] font-medium text-right self-start sm:self-center">
                    {tv.currentSlide ? (
                      <span className="text-blue-600 bg-blue-50/50 border border-blue-200 text-[10px] px-2 py-0.5 rounded-md font-bold">
                        Direct : {tv.currentSlide.title}
                      </span>
                    ) : (
                      <span className="text-neutral-500 italic">Planification automatique active</span>
                    )}
                  </div>
                </div>
              ))}

              {filteredTvs.length === 0 && (
                <div className="text-center py-10 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                  <Monitor className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-neutral-500 text-xs">Aucun écran rattaché pour le moment.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-neutral-150 text-[10px] text-neutral-400 flex justify-between items-center">
            <span>Isolation du locataire : <strong>{currentOrgId === 'ALL' ? 'Super-administrateur ALL' : currentOrgId}</strong></span>
            <span>Serveur WebSocket optimal</span>
          </div>
        </div>

        {/* Right Side: Quick Setup & SaaS logic pointers */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <h3 className="font-bold text-neutral-800 text-sm mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-5 h-5 text-blue-600" /> Guide de couplage
            </h3>
            <p className="text-xs text-neutral-500">Comment coupler et utiliser les écrans d'affichage digital</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex gap-3">
              <span className="w-5 h-5 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
              <div>
                <strong className="block text-neutral-800">Initialiser l'affichage</strong>
                <p className="text-neutral-500 text-[11px] mt-0.5">Ouvrez une fenêtre Smart TV depuis le menu principal pour simuler un écran.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-5 h-5 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
              <div>
                <strong className="block text-neutral-800">Assigner à une structure</strong>
                <p className="text-neutral-500 text-[11px] mt-0.5">Associez vos écrans à des groupes de diffusion d'hôtel ou de cuisine, filtrez l'isolation dans la sidebar.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-5 h-5 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
              <div>
                <strong className="block text-neutral-800">Pilote d'urgence</strong>
                <p className="text-neutral-500 text-[11px] mt-0.5">Castez des slides d'urgence en direct, la TV réagit en moins de 100ms par WebSocket !</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-4 text-[11px] space-y-2">
            <span className="font-bold text-neutral-700 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" /> État de l'infrastructure
            </span>
            <p className="text-neutral-500">Moteur de calcul réactif, WebSocket en ligne et base locale en mémoire synchronisée.</p>
          </div>
        </div>

      </div>

    </div>
  );
}

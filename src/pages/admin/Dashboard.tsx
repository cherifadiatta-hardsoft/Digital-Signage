import { Activity, Monitor, WifiOff, FileImage } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function Dashboard() {
  const tvs = useStore((state) => state.tvs);
  const slides = useStore((state) => state.slides);

  const onlineTvs = tvs.filter(tv => tv.status === 'ONLINE').length;
  const offlineTvs = tvs.filter(tv => tv.status === 'OFFLINE').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Total Écrans</p>
            <p className="text-2xl font-bold text-neutral-900">{tvs.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Écrans en ligne</p>
            <p className="text-2xl font-bold text-neutral-900">{onlineTvs}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
            <WifiOff className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Écrans hors ligne</p>
            <p className="text-2xl font-bold text-neutral-900">{offlineTvs}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
            <FileImage className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Média Totaux</p>
            <p className="text-2xl font-bold text-neutral-900">{slides.length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-2/3 bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Écrans Récemment Actifs</h3>
          <div className="space-y-4">
            {tvs.map((tv) => (
              <div key={tv.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    tv.status === 'ONLINE' ? "bg-green-500" : "bg-neutral-300"
                  )} />
                  <div>
                    <p className="font-medium text-neutral-900">{tv.name}</p>
                    <p className="text-sm text-neutral-500">{tv.id} &bull; {tv.location}</p>
                  </div>
                </div>
                <div className="text-sm text-right">
                  {tv.currentSlide ? (
                    <span className="text-blue-600 font-medium">En lecture : {tv.currentSlide.title}</span>
                  ) : (
                    <span className="text-neutral-500">En attente de contenu</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/3 bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Guide Rapide</h3>
          <div className="prose prose-sm text-neutral-500">
            <p><strong>1.</strong> Ouvrez l'interface TV dans un nouvel onglet avec l'ID de la TV pour simuler son allumage.</p>
            <p><strong>2.</strong> Allez dans l'onglet <strong>Écrans</strong> pour envoyer un contenu en temps réel.</p>
            <p><strong>3.</strong> Observez l'écran changer instantanément !</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal utility function for local file since utils is one level deeper
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

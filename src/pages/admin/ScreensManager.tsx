import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Send, MonitorPlay, ExternalLink, Plus, KeyRound } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Slide } from '../../types';

export default function ScreensManager() {
  const tvs = useStore((state) => state.tvs);
  const slides = useStore((state) => state.slides);
  const assignSlideToTV = useStore((state) => state.assignSlideToTV);
  const addTV = useStore((state) => state.addTV);

  const [selectedTV, setSelectedTV] = useState<string | null>(null);
  
  // New TV modal state
  const [isAddingTV, setIsAddingTV] = useState(false);
  const [newTVDetails, setNewTVDetails] = useState({ name: '', location: '' });
  const [generatedTV, setGeneratedTV] = useState<{ id: string; code: string } | null>(null);

  const handleSendSlide = (slide: Slide) => {
    if (selectedTV) {
      assignSlideToTV(selectedTV, slide);
    }
  };

  const handleCreateTV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTVDetails.name) return;

    const newId = `TV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    
    addTV({
      id: newId,
      name: newTVDetails.name,
      location: newTVDetails.location,
      code: newCode,
      status: 'OFFLINE',
      lastOnline: new Date().toISOString(),
      currentPlaylistId: null,
    });

    setGeneratedTV({ id: newId, code: newCode });
    setNewTVDetails({ name: '', location: '' });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)]">
      {/* TV List */}
      <div className="w-1/2 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <h3 className="font-semibold text-neutral-800">Écrans Connectés</h3>
          <button 
            onClick={() => { setIsAddingTV(true); setGeneratedTV(null); }}
            className="text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvel Écran
          </button>
        </div>

        {isAddingTV && (
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            {generatedTV ? (
              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm text-center">
                <MonitorPlay className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-bold text-neutral-900 mb-1">Écran Enregistré</h4>
                <p className="text-sm text-neutral-500 mb-4">Entrez ces informations sur la Smart TV pour la connecter.</p>
                <div className="inline-block text-left bg-neutral-50 px-6 py-4 rounded-xl border border-neutral-200 mb-4">
                  <div className="mb-2">
                    <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider block mb-1">TV ID</span>
                    <span className="font-mono font-bold text-lg text-neutral-900 tracking-wider font-medium">{generatedTV.id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <KeyRound className="w-3 h-3" /> Code d'accès
                    </span>
                    <span className="font-mono font-bold text-2xl text-blue-600 tracking-wider">{generatedTV.code}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddingTV(false)}
                  className="block w-full py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800"
                >
                  Terminer
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTV} className="space-y-3">
                <h4 className="font-medium text-sm text-neutral-800 mb-2">Ajouter un nouvel écran</h4>
                <input 
                  type="text" 
                  placeholder="Nom de l'écran (ex: Écran Hall d'entrée)" 
                  value={newTVDetails.name}
                  onChange={e => setNewTVDetails({...newTVDetails, name: e.target.value})}
                  className="w-full text-sm border border-neutral-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Emplacement (ex: Bâtiment A)" 
                  value={newTVDetails.location}
                  onChange={e => setNewTVDetails({...newTVDetails, location: e.target.value})}
                  className="w-full text-sm border border-neutral-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddingTV(false)} className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded">
                    Annuler
                  </button>
                  <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded">
                    Générer Code
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {tvs.map((tv) => (
            <div 
              key={tv.id} 
              onClick={() => setSelectedTV(tv.id)}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all",
                selectedTV === tv.id 
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                  : "border-neutral-200 hover:border-neutral-300 bg-white"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-neutral-900 flex items-center gap-2">
                    <MonitorPlay className="w-4 h-4 text-neutral-500" />
                    {tv.name}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">ID: {tv.id} &bull; {tv.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1.5",
                    tv.status === 'ONLINE' ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      tv.status === 'ONLINE' ? "bg-green-500" : "bg-neutral-400"
                    )}></span>
                    {tv.status}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-neutral-500">Contenu actuel : </span>
                  {tv.currentSlide ? (
                    <span className="font-medium text-neutral-900">{tv.currentSlide.title}</span>
                  ) : (
                    <span className="text-neutral-400 italic">Aucun contenu</span>
                  )}
                </div>
                
                {/* Simulated Viewer Launcher */}
                <a 
                  href={`/login-tv`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Lien Connexion
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-1/2 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col">
        {selectedTV ? (
          <>
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="font-semibold text-neutral-800">Contrôle : {tvs.find(t => t.id === selectedTV)?.name}</h3>
              <p className="text-sm text-neutral-500 mt-1">Envoyer un contenu instantanément à cet écran</p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                {slides.map((slide) => (
                  <div key={slide.id} className="border border-neutral-200 rounded-lg overflow-hidden flex flex-col bg-white hover:shadow-md transition-shadow">
                    <div className="h-32 bg-neutral-100 relative">
                      {slide.type === 'image' && (
                        <img src={slide.content} alt={slide.title} className="w-full h-full object-cover" />
                      )}
                      {slide.type === 'text' && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-blue-50">
                          <p className="text-sm font-medium text-blue-900 line-clamp-3">{slide.content}</p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                        {slide.duration}s
                      </div>
                    </div>
                    <div className="p-3 border-t border-neutral-100 flex-1 flex flex-col justify-between">
                      <p className="font-medium text-sm text-neutral-900 line-clamp-1 mb-3">{slide.title}</p>
                      
                      <button 
                        onClick={() => handleSendSlide(slide)}
                        className="w-full flex justify-center items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white py-1.5 rounded-md text-sm font-medium transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Envoyer à l'écran
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="col-span-2 mt-4">
                   <button 
                      onClick={() => assignSlideToTV(selectedTV, null)}
                      className="w-full border-2 border-dashed border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Arrêter la diffusion (Afficher Logo)
                    </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 p-8 text-center">
            <MonitorPlay className="w-12 h-12 text-neutral-300 mb-4" />
            <p className="text-lg font-medium text-neutral-700">Sélectionnez un écran</p>
            <p className="text-sm max-w-sm mt-2">Cliquez sur un écran dans la liste de gauche pour voir ses détails et lui envoyer du contenu.</p>
          </div>
        )}
      </div>
    </div>
  );
}


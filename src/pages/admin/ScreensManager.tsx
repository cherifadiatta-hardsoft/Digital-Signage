import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Send, MonitorPlay, ExternalLink, Plus, KeyRound, CheckCircle2, Settings, Trash2, RefreshCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Slide } from '../../types';
import { supabase } from '../../lib/supabaseClient';

export default function ScreensManager() {
  const tvs = useStore((state) => state.tvs);
  const slides = useStore((state) => state.slides);
  const assignSlideToTV = useStore((state) => state.assignSlideToTV);
  const addTV = useStore((state) => state.addTV);
  const updateTV = useStore((state) => state.updateTV);
  const deleteTV = useStore((state) => state.deleteTV);
  const broadcastSlide = useStore((state) => state.broadcastSlide);

  const [selectedTV, setSelectedTV] = useState<string | null>(null);
  const [sentStatus, setSentStatus] = useState<string | null>(null);
  
  // New TV modal state
  const [isAddingTV, setIsAddingTV] = useState(false);
  const [newTVDetails, setNewTVDetails] = useState({ name: '', location: '' });
  const [generatedTV, setGeneratedTV] = useState<{ id: string; code: string } | null>(null);
  const [editingTV, setEditingTV] = useState<{ id: string; originalId: string; name: string; location: string } | null>(null);

  const handleSendSlide = async (slide: Slide | null) => {
    if (selectedTV) {
      assignSlideToTV(selectedTV, slide);
      
      // Local fallback sync
      const channel = new BroadcastChannel('hardsoft_tv_channel');
      channel.postMessage({ type: 'UPDATE_SLIDE', tvId: selectedTV, slide });
      channel.close();
      
      // Production Supabase sync
      if (supabase) {
        await supabase
          .from('tv_control')
          .upsert({ 
            tv_id: selectedTV, 
            current_slide_url: slide ? JSON.stringify(slide) : null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'tv_id' });
      }
      
      if (slide) {
        setSentStatus(slide.id);
        setTimeout(() => setSentStatus(null), 2000);
      }
    }
  };

  const handleBroadcast = async (slide: Slide | null) => {
    broadcastSlide(slide);
    
    // Local fallback sync
    const channel = new BroadcastChannel('hardsoft_tv_channel');
    channel.postMessage({ type: 'UPDATE_SLIDE', tvId: 'ALL', slide });
    channel.close();

    // Production Supabase sync
    if (supabase) {
      const activeTvs = tvs.filter(t => t.status === 'ONLINE').map(t => t.id);
      
      if (activeTvs.length > 0) {
        const updates = activeTvs.map(tvId => ({
          tv_id: tvId,
          current_slide_url: slide ? JSON.stringify(slide) : null,
          updated_at: new Date().toISOString()
        }));

        await supabase.from('tv_control').upsert(updates, { onConflict: 'tv_id' });
      }
    }

    if (slide) {
      setSentStatus('broadcast-' + slide.id);
      setTimeout(() => setSentStatus(null), 2000);
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

  const handleUpdateTV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTV || !editingTV.name) return;
    
    updateTV(editingTV.originalId, {
      id: editingTV.id, // ID could potentially be modified
      name: editingTV.name,
      location: editingTV.location,
    });
    setEditingTV(null);
  };

  const handleRegenerateCode = (tvId: string) => {
    if (confirm("Voulez-vous vraiment générer un nouveau code d'accès pour cet écran ? Les accès actuels seront révoqués.")) {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      updateTV(tvId, { code: newCode });
      alert(`Nouveau code généré : ${newCode}`);
    }
  };

  const handleRegenerateId = (tvId: string) => {
    if (confirm("Voulez-vous vraiment générer un nouvel identifiant (ID) pour cet écran ? Les liens existants ne fonctionneront plus.")) {
      const newId = `TV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      updateTV(tvId, { id: newId });
      alert(`Nouvel identifiant généré : ${newId}`);
      if (selectedTV === tvId) {
        setSelectedTV(newId);
      }
    }
  };

  const handleDeleteTV = (tvId: string) => {
    if (confirm("Voulez-vous vraiment supprimer cet écran ?")) {
      deleteTV(tvId);
      if (selectedTV === tvId) setSelectedTV(null);
    }
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
                <div className="inline-block text-left bg-neutral-50 px-6 py-4 rounded-xl border border-neutral-200 mb-4 w-full">
                  <div className="mb-2 flex justify-between items-start">
                    <div>
                      <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider block mb-1">TV ID</span>
                      <span className="font-mono font-bold text-lg text-neutral-900 tracking-wider font-medium">{generatedTV.id}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <KeyRound className="w-3 h-3" /> Code d'accès
                    </span>
                    <span className="font-mono font-bold text-2xl text-blue-600 tracking-wider">{generatedTV.code}</span>
                  </div>
                  <div className="pt-3 border-t border-neutral-200">
                    <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider block mb-2">Lien direct d'accès</span>
                    <div className="flex items-center gap-2">
                       <input 
                         readOnly 
                         value={`${window.location.origin}/#/tv/client/${generatedTV.id}?code=${generatedTV.code}`} 
                         className="flex-1 text-xs font-mono p-2 bg-white border border-neutral-300 rounded outline-none"
                         onClick={(e) => (e.target as HTMLInputElement).select()}
                       />
                       <a 
                         href={`/#/tv/client/${generatedTV.id}?code=${generatedTV.code}`} 
                         target="_blank" 
                         rel="noreferrer"
                         className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                         title="Ouvrir dans un nouvel onglet"
                       >
                         <ExternalLink className="w-4 h-4" />
                       </a>
                    </div>
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
              {editingTV && editingTV.originalId === tv.id ? (
                <div onClick={(e) => e.stopPropagation()} className="space-y-4">
                  <h4 className="font-medium text-sm text-neutral-800">Configuration de l'écran</h4>
                  <form onSubmit={handleUpdateTV} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Nom</label>
                      <input 
                        type="text" 
                        value={editingTV.name}
                        onChange={e => setEditingTV({...editingTV, name: e.target.value})}
                        className="w-full text-sm border border-neutral-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Emplacement</label>
                      <input 
                        type="text" 
                        value={editingTV.location}
                        onChange={e => setEditingTV({...editingTV, location: e.target.value})}
                        className="w-full text-sm border border-neutral-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="pt-2 border-t border-neutral-200 flex flex-col gap-2">
                       <button type="button" onClick={() => handleRegenerateId(tv.id)} className="w-full text-left px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded flex items-center gap-2 transition-colors">
                         <RefreshCcw className="w-4 h-4" /> Réinitialiser l'Identifiant (ID)
                       </button>
                       <button type="button" onClick={() => handleRegenerateCode(tv.id)} className="w-full text-left px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded flex items-center gap-2 transition-colors">
                         <KeyRound className="w-4 h-4" /> Réinitialiser le Code d'accès
                       </button>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setEditingTV(null)} className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded">
                        Annuler
                      </button>
                      <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded">
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-neutral-900 flex items-center gap-2">
                        <MonitorPlay className="w-4 h-4 text-neutral-500" />
                        {tv.name}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1">ID: {tv.id} &bull; {tv.location} &bull; Code: {tv.code}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingTV({ id: tv.id, originalId: tv.id, name: tv.name, location: tv.location || '' })}}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                        title="Configuration"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTV(tv.id) }}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <a 
                        href={`/#/tv/client/${tv.id}?code=${tv.code}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Ouvrir le navigateur web (Lien Direct)"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <span className={cn(
                        "ml-1.5 text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1.5",
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
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-1/2 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col">
        {selectedTV ? (
          <>
            <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-neutral-800">Contrôle : {tvs.find(t => t.id === selectedTV)?.name}</h3>
                <p className="text-sm text-neutral-500 mt-1">Envoyer un contenu instantanément à cet écran</p>
              </div>
              <button
                onClick={() => setSelectedTV(null)}
                className="text-xs px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-md font-medium transition-colors"
                title="Désélectionner pour diffuser sur tous les écrans"
              >
                Tout voir
              </button>
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
                        disabled={sentStatus === slide.id}
                        className={cn(
                          "w-full flex justify-center items-center gap-2 py-1.5 rounded-md text-sm font-medium transition-colors",
                          sentStatus === slide.id 
                            ? "bg-green-500 text-white"
                            : "bg-neutral-900 hover:bg-neutral-800 text-white"
                        )}
                      >
                        {sentStatus === slide.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Envoyé !
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Envoyer sa propre slide
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="col-span-2 mt-4">
                   <button 
                      onClick={() => handleSendSlide(null)}
                      className="w-full border-2 border-dashed border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Arrêter la diffusion (Afficher Logo)
                    </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 border-b border-blue-200 bg-blue-50">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <Send className="w-4 h-4" /> Diffusion Générale
              </h3>
              <p className="text-sm text-blue-700 mt-1">Sélectionnez un contenu à diffuser instantanément sur TOUS les écrans en ligne.</p>
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
                        onClick={() => handleBroadcast(slide)}
                        disabled={sentStatus === 'broadcast-' + slide.id}
                        className={cn(
                          "w-full flex justify-center items-center gap-2 py-1.5 rounded-md text-sm font-medium transition-colors",
                          sentStatus === 'broadcast-' + slide.id 
                            ? "bg-green-500 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                      >
                        {sentStatus === 'broadcast-' + slide.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Diffusé partout !
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Diffuser à tous
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="col-span-2 mt-4">
                   <button 
                      onClick={() => handleBroadcast(null)}
                      className="w-full border-2 border-dashed border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Arrêter la diffusion globale (Afficher Logo)
                    </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


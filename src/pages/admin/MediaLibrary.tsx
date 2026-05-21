import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Plus, 
  Image as ImageIcon, 
  FileText, 
  Clock, 
  Sparkles, 
  Loader2, 
  Edit3, 
  Trash2, 
  X,
  Building,
  Layers,
  CheckCircle2,
  FileCode
} from 'lucide-react';
import { Slide } from '../../types';
import { cn } from '../../lib/utils';

export default function MediaLibrary() {
  const slides = useStore((state) => state.slides || []);
  const organizations = useStore((state) => state.organizations || []);
  const currentOrgId = useStore((state) => state.currentOrgId);
  
  // Actions
  const addSlide = useStore((state) => state.addSlide);
  const updateSlide = useStore((state) => state.updateSlide);
  const deleteSlide = useStore((state) => state.deleteSlide);

  // States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  const [newSlide, setNewSlide] = useState({
    title: '',
    type: 'image' as 'image' | 'video' | 'html' | 'text',
    content: '',
    duration: 10,
    orgId: 'org-terroubi'
  });

  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [isEditingGenerating, setIsEditingGenerating] = useState(false);
  const [aiEditPrompt, setAiEditPrompt] = useState('');

  // Align defaults on active organization changes
  useEffect(() => {
    if (currentOrgId !== 'ALL') {
      setNewSlide(prev => ({ ...prev, orgId: currentOrgId }));
    }
  }, [currentOrgId]);

  // Filters for Isolation
  const filteredSlides = currentOrgId === 'ALL'
    ? slides
    : slides.filter(s => s.orgId === currentOrgId || s.orgId === 'SYSTEM');

  const handleGenerateAIForEdit = async () => {
    if (!aiEditPrompt || !editingSlide) return;
    setIsEditingGenerating(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiEditPrompt })
      });
      
      const data = await response.json();
      if (response.ok) {
        setEditingSlide({
          ...editingSlide,
          type: 'text',
          content: data.text
        });
      } else {
        setErrorMsg("Erreur: " + data.error);
      }
    } catch (err) {
      setErrorMsg("Erreur de connexion au serveur AI");
    } finally {
      setIsEditingGenerating(false);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide || !editingSlide.title || !editingSlide.content) return;
    
    updateSlide(editingSlide.id, {
      title: editingSlide.title,
      type: editingSlide.type,
      content: editingSlide.content,
      duration: editingSlide.duration,
      orgId: editingSlide.orgId
    });
    
    setEditingSlide(null);
    setAiEditPrompt('');
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la slide "${title}" ?`)) {
      deleteSlide(id);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      
      const data = await response.json();
      if (response.ok) {
        setNewSlide({
          ...newSlide,
          type: 'text',
          content: data.text
        });
      } else {
        setErrorMsg("Erreur: " + data.error);
      }
    } catch (err) {
      setErrorMsg("Erreur de connexion au serveur AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlide.title || !newSlide.content) return;
    
    const targetedOrg = currentOrgId === 'ALL' ? newSlide.orgId : currentOrgId;

    addSlide({
      id: `slide-${Date.now()}`,
      title: newSlide.title,
      type: newSlide.type,
      content: newSlide.content,
      duration: newSlide.duration,
      orgId: targetedOrg,
      createdAt: new Date().toISOString(),
    });
    
    setIsAdding(false);
    setNewSlide({ 
      title: '', 
      type: 'image', 
      content: '', 
      duration: 10,
      orgId: currentOrgId === 'ALL' ? 'org-terroubi' : currentOrgId 
    });
    setAiPrompt('');
  };

  const getOrgName = (orgId: string) => {
    if (orgId === 'SYSTEM') return 'Système (Global)';
    return organizations.find(o => o.id === orgId)?.name || orgId;
  };

  return (
    <div className="space-y-6 text-neutral-800 leading-relaxed font-sans">
      
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="font-extrabold bg-red-100 px-2 py-0.5 rounded text-[10px] uppercase">Erreur</span>
            <span>{errorMsg}</span>
          </div>
          <button 
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 font-bold px-1.5"
          >
            &times;
          </button>
        </div>
      )}

      {/* Banner info */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" /> Médiathèque &amp; Slides IA
          </h2>
          <p className="text-neutral-500 text-xs mt-1">
            Gérez votre stock d'images de bouclages, de vidéos d'annonces ou créez des diapositives percutantes par intelligence artificielle.
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" /> Ajouter une Slide
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="font-bold text-sm text-neutral-850 mb-4 pb-2 border-b border-neutral-100">Nouveau média</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2 md:col-span-1 space-y-1">
              <label className="font-semibold text-neutral-605">Titre de la Diapositive</label>
              <input 
                type="text" 
                value={newSlide.title}
                onChange={e => setNewSlide({...newSlide, title: e.target.value})}
                className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex: Promotion Buffet de Midi"
                required
              />
            </div>
            
            <div className="col-span-2 md:col-span-1 space-y-1">
              <label className="font-semibold text-neutral-605">Type d'affichage</label>
              <select 
                value={newSlide.type}
                onChange={e => setNewSlide({...newSlide, type: e.target.value as any, content: ''})}
                className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:outline-none bg-white font-medium"
              >
                <option value="image">Image ou Vidéo (URL extérieure)</option>
                <option value="text">Texte défilant style Dashboard (Annonce)</option>
              </select>
            </div>

            {currentOrgId === 'ALL' && (
              <div className="col-span-2 space-y-1">
                <label className="font-semibold text-neutral-605">Structure de rattachement (SaaS isolation)</label>
                <select
                  value={newSlide.orgId}
                  onChange={e => setNewSlide({...newSlide, orgId: e.target.value})}
                  className="w-full border border-neutral-300 rounded-lg py-2 px-3 bg-white"
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                  <option value="SYSTEM">Générique (Système public)</option>
                </select>
              </div>
            )}

            {newSlide.type === 'text' && (
              <div className="col-span-2 bg-gradient-to-r from-blue-50/50 to-purple-50 p-4 rounded-xl border border-blue-200/50 my-1">
                <label className="font-bold text-blue-900 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" /> Rédaction Instantanée par IA (Gemini)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ex: Rédige un message accueillant pour les arrivées tardives dans le lobby de la réception de l'hôtel"
                    className="flex-1 border border-blue-200 bg-white rounded-lg py-2 px-3 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                  <button 
                    type="button" 
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !aiPrompt}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors text-xs shadow-sm"
                  >
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Rédiger
                  </button>
                </div>
              </div>
            )}

            <div className="col-span-2 space-y-1">
              <label className="font-semibold text-neutral-605">
                {newSlide.type === 'image' ? 'Lien absolu (URL) de l\'image de fond' : 'Format textuel de l\'annonce (Prend en charge les balises HTML de base)'}
              </label>
              {newSlide.type === 'text' ? (
                <textarea 
                  value={newSlide.content}
                  onChange={e => setNewSlide({...newSlide, content: e.target.value})}
                  className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                  placeholder="<h2>Bienvenue au Terrou-bi</h2><p>Le buffet de noël débute à midi !</p>"
                  rows={4}
                  required
                />
              ) : (
                <input 
                  type="url" 
                  value={newSlide.content}
                  onChange={e => setNewSlide({...newSlide, content: e.target.value})}
                  className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:ring-1 focus:ring-blue-500"
                  placeholder="https://images.unsplash.com/... ou lien de stockage CDN"
                  required
                />
              )}
            </div>

            <div className="col-span-2 md:col-span-1 space-y-1">
              <label className="font-semibold text-neutral-605">Durée d'affichage par cycle (secondes)</label>
              <input 
                type="number" 
                min="5"
                max="3600"
                value={newSlide.duration}
                onChange={e => setNewSlide({...newSlide, duration: parseInt(e.target.value) || 10})}
                className="w-full border border-neutral-300 rounded-lg py-2 px-3"
                required
              />
            </div>

            <div className="col-span-2 pt-3 border-t border-neutral-100 flex justify-end gap-2 font-semibold">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-3.5 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 shadow-sm"
              >
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slide elements list */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {filteredSlides.map(slide => (
          <div key={slide.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative flex flex-col justify-between">
            <div className="h-40 bg-neutral-100 relative shrink-0">
              {slide.type === 'image' && (
                <img src={slide.content} alt={slide.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              )}
              {slide.type === 'text' && (
                <div className="w-full h-full flex items-center justify-center p-5 text-center bg-blue-50 border-b border-blue-105">
                  <p className="text-xs font-semibold text-blue-900 line-clamp-4 leading-relaxed font-mono">{slide.content}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              
              {/* Floating modifiers */}
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm p-1.5 rounded-lg z-10">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditingSlide(slide); }}
                  className="text-white hover:text-blue-300 transition-colors"
                  title="Modifier"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(slide.id, slide.title); }}
                  className="text-white hover:text-red-405 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-neutral-900 text-xs line-clamp-2 leading-snug">{slide.title}</h4>
                  {slide.type === 'image' ? <ImageIcon className="w-4 h-4 text-neutral-400 shrink-0" /> : <FileText className="w-4 h-4 text-indigo-400 shrink-0" />}
                </div>
                {currentOrgId === 'ALL' && (
                  <div className="mb-2">
                    <span className="bg-purple-50 text-purple-705 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md uppercase">
                      {getOrgName(slide.orgId || '')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-semibold border-t border-neutral-100 pt-2.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Cycle de {slide.duration}s</span>
              </div>
            </div>
          </div>
        ))}

        {filteredSlides.length === 0 && (
          <div className="col-span-full py-12 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            <ImageIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-500 font-medium text-xs">Aucune slide enregistrée pour cette structure.</p>
          </div>
        )}
      </div>

      {/* Editing dialog */}
      {editingSlide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 text-neutral-900 leading-normal">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-850 flex items-center gap-1.5">
                <Edit3 className="w-4.5 h-4.5 text-blue-600" /> Éditer la Diapositive
              </h3>
              <button 
                type="button"
                onClick={() => { setEditingSlide(null); setAiEditPrompt(''); }} 
                className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1 space-y-1">
                  <label className="font-semibold text-neutral-605">Titre</label>
                  <input 
                    type="text" 
                    value={editingSlide.title}
                    onChange={e => setEditingSlide({...editingSlide, title: e.target.value})}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1 space-y-1">
                  <label className="font-semibold text-neutral-605">Type d'affichage</label>
                  <select 
                    value={editingSlide.type}
                    onChange={e => setEditingSlide({...editingSlide, type: e.target.value as any})}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 bg-white font-semibold"
                  >
                    <option value="image">Image (URL)</option>
                    <option value="text">Texte (Annonce)</option>
                  </select>
                </div>

                {editingSlide.type === 'text' && (
                  <div className="col-span-2 bg-gradient-to-r from-blue-50/50 to-purple-50 p-4 rounded-xl border border-blue-200/50 my-1">
                    <label className="font-bold text-blue-900 flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" /> Ré-écriture ou Amélioration par IA (Gemini)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={aiEditPrompt}
                        onChange={e => setAiEditPrompt(e.target.value)}
                        placeholder="Ex: Améliore l'orthographe ou rend ça plus professionnel"
                        className="flex-1 border border-blue-205 bg-white rounded-lg py-2 px-3 focus:ring-1 focus:ring-blue-500"
                      />
                      <button 
                        type="button" 
                        onClick={handleGenerateAIForEdit}
                        disabled={isEditingGenerating || !aiEditPrompt}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1 transition-colors text-xs"
                      >
                        {isEditingGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Améliorer
                      </button>
                    </div>
                  </div>
                )}

                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-neutral-605">Contenu</label>
                  {editingSlide.type === 'text' ? (
                    <textarea 
                      value={editingSlide.content}
                      onChange={e => setEditingSlide({...editingSlide, content: e.target.value})}
                      className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                      rows={4}
                      required
                    />
                  ) : (
                    <input 
                      type="url" 
                      value={editingSlide.content}
                      onChange={e => setEditingSlide({...editingSlide, content: e.target.value})}
                      className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:ring-1 focus:ring-blue-500 font-medium"
                      required
                    />
                  )}
                </div>

                <div className="col-span-2 md:col-span-1 space-y-1">
                  <label className="font-semibold text-neutral-605">Durée (secondes)</label>
                  <input 
                    type="number" 
                    min="5"
                    max="3600"
                    value={editingSlide.duration}
                    onChange={e => setEditingSlide({...editingSlide, duration: parseInt(e.target.value) || 10})}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2 font-semibold">
                <button 
                  type="button" 
                  onClick={() => { setEditingSlide(null); setAiEditPrompt(''); }}
                  className="px-3.5 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 shadow-sm"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

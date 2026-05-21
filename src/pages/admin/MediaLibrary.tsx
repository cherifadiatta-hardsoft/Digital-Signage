import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, Image as ImageIcon, FileText, Clock, Sparkles, Loader2, Edit3, Trash2, X } from 'lucide-react';
import { Slide } from '../../types';

export default function MediaLibrary() {
  const slides = useStore((state) => state.slides);
  const addSlide = useStore((state) => state.addSlide);
  const updateSlide = useStore((state) => state.updateSlide);
  const deleteSlide = useStore((state) => state.deleteSlide);

  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [newSlide, setNewSlide] = useState({
    title: '',
    type: 'image' as const,
    content: '',
    duration: 10,
  });

  // State for slide editing functionality
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [isEditingGenerating, setIsEditingGenerating] = useState(false);
  const [aiEditPrompt, setAiEditPrompt] = useState('');

  const handleGenerateAIForEdit = async () => {
    if (!aiEditPrompt || !editingSlide) return;
    setIsEditingGenerating(true);
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
        alert("Erreur: " + data.error);
      }
    } catch (err) {
      alert("Erreur de connexion au serveur AI");
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
      duration: editingSlide.duration
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
        alert("Erreur: " + data.error);
      }
    } catch (err) {
      alert("Erreur de connexion au serveur AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlide.title || !newSlide.content) return;
    
    addSlide({
      id: `slide-${Date.now()}`,
      title: newSlide.title,
      type: newSlide.type,
      content: newSlide.content,
      duration: newSlide.duration,
      createdAt: new Date().toISOString(),
    });
    
    setIsAdding(false);
    setNewSlide({ title: '', type: 'image', content: '', duration: 10 });
    setAiPrompt('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Médiathèque</h2>
          <p className="text-sm text-neutral-500">Gérez vos images, vidéos et textes</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un média
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <h3 className="font-medium mb-4 text-neutral-800">Nouveau média</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1 space-y-1">
              <label className="text-sm font-medium text-neutral-700">Titre</label>
              <input 
                type="text" 
                value={newSlide.title}
                onChange={e => setNewSlide({...newSlide, title: e.target.value})}
                className="w-full border border-neutral-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ex: Promotion de Noël"
                required
              />
            </div>
            
            <div className="col-span-2 md:col-span-1 space-y-1">
              <label className="text-sm font-medium text-neutral-700">Type de contenu</label>
              <select 
                value={newSlide.type}
                onChange={e => setNewSlide({...newSlide, type: e.target.value as any})}
                className="w-full border border-neutral-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="image">Image (URL)</option>
                <option value="text">Texte (Annonce)</option>
              </select>
            </div>

            {newSlide.type === 'text' && (
              <div className="col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100 mb-2">
                <label className="text-sm font-medium text-indigo-900 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Génération par IA (Gemini)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ex: Génère une annonce publicitaire courte pour une boulangerie"
                    className="flex-1 border border-indigo-200 bg-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <button 
                    type="button" 
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !aiPrompt}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Générer
                  </button>
                </div>
              </div>
            )}

            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium text-neutral-700">
                {newSlide.type === 'image' ? 'URL de l\'image' : 'Contenu du texte'}
              </label>
              {newSlide.type === 'text' ? (
                <textarea 
                  value={newSlide.content}
                  onChange={e => setNewSlide({...newSlide, content: e.target.value})}
                  className="w-full border border-neutral-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={4}
                  required
                />
              ) : (
                <input 
                  type="url" 
                  value={newSlide.content}
                  onChange={e => setNewSlide({...newSlide, content: e.target.value})}
                  className="w-full border border-neutral-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="https://..."
                  required
                />
              )}
            </div>

            <div className="col-span-2 md:col-span-1 space-y-1">
              <label className="text-sm font-medium text-neutral-700">Durée d'affichage (secondes)</label>
              <input 
                type="number" 
                min="5"
                max="3600"
                value={newSlide.duration}
                onChange={e => setNewSlide({...newSlide, duration: parseInt(e.target.value) || 10})}
                className="w-full border border-neutral-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div className="col-span-2 pt-2 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 font-medium text-sm transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 font-medium text-sm transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {slides.map(slide => (
          <div key={slide.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative">
            <div className="h-40 bg-neutral-100 relative">
              {slide.type === 'image' && (
                <img src={slide.content} alt={slide.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              )}
              {slide.type === 'text' && (
                <div className="w-full h-full flex items-center justify-center p-6 text-center bg-blue-50">
                  <p className="text-sm font-medium text-blue-900 line-clamp-4">{slide.content}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              
              {/* Floating Quick Action Buttons on Hover */}
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
                  className="text-white hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t border-neutral-100">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-neutral-900 text-sm line-clamp-1">{slide.title}</h4>
                {slide.type === 'image' ? <ImageIcon className="w-4 h-4 text-neutral-400 shrink-0" /> : <FileText className="w-4 h-4 text-neutral-400 shrink-0" />}
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{slide.duration}s</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Slide Modal Dialog */}
      {editingSlide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-neutral-900">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" /> Éditer la Diapositive
              </h3>
              <button 
                type="button"
                onClick={() => { setEditingSlide(null); setAiEditPrompt(''); }} 
                className="text-neutral-400 hover:text-neutral-600 p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1 space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Titre</label>
                  <input 
                    type="text" 
                    value={editingSlide.title}
                    onChange={e => setEditingSlide({...editingSlide, title: e.target.value})}
                    className="w-full border border-neutral-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1 space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Type de contenu</label>
                  <select 
                    value={editingSlide.type}
                    onChange={e => setEditingSlide({...editingSlide, type: e.target.value as any})}
                    className="w-full border border-neutral-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="image">Image (URL)</option>
                    <option value="text">Texte (Annonce)</option>
                  </select>
                </div>

                {editingSlide.type === 'text' && (
                  <div className="col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100 mb-2">
                    <label className="text-sm font-medium text-indigo-900 flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> Génération par IA (Gemini)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={aiEditPrompt}
                        onChange={e => setAiEditPrompt(e.target.value)}
                        placeholder="Ex: Réécris le texte de manière plus percutante"
                        className="flex-1 border border-indigo-200 bg-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                      <button 
                        type="button" 
                        onClick={handleGenerateAIForEdit}
                        disabled={isEditingGenerating || !aiEditPrompt}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors"
                      >
                        {isEditingGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Générer
                      </button>
                    </div>
                  </div>
                )}

                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-neutral-700">
                    {editingSlide.type === 'image' ? 'URL de l\'image' : 'Contenu du texte'}
                  </label>
                  {editingSlide.type === 'text' ? (
                    <textarea 
                      value={editingSlide.content}
                      onChange={e => setEditingSlide({...editingSlide, content: e.target.value})}
                      className="w-full border border-neutral-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={4}
                      required
                    />
                  ) : (
                    <input 
                      type="url" 
                      value={editingSlide.content}
                      onChange={e => setEditingSlide({...editingSlide, content: e.target.value})}
                      className="w-full border border-neutral-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                  )}
                </div>

                <div className="col-span-2 md:col-span-1 space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Durée d'affichage (secondes)</label>
                  <input 
                    type="number" 
                    min="5"
                    max="3600"
                    value={editingSlide.duration}
                    onChange={e => setEditingSlide({...editingSlide, duration: parseInt(e.target.value) || 10})}
                    className="w-full border border-neutral-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => { setEditingSlide(null); setAiEditPrompt(''); }}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 font-medium text-sm transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 font-medium text-sm transition-colors"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

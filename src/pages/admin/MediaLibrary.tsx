import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, Image as ImageIcon, FileText, Clock } from 'lucide-react';

export default function MediaLibrary() {
  const slides = useStore((state) => state.slides);
  const addSlide = useStore((state) => state.addSlide);

  const [isAdding, setIsAdding] = useState(false);
  const [newSlide, setNewSlide] = useState({
    title: '',
    type: 'image' as const,
    content: '',
    duration: 10,
  });

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

            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium text-neutral-700">
                {newSlide.type === 'image' ? 'URL de l\'image' : 'Contenu du texte'}
              </label>
              {newSlide.type === 'text' ? (
                <textarea 
                  value={newSlide.content}
                  onChange={e => setNewSlide({...newSlide, content: e.target.value})}
                  className="w-full border border-neutral-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={3}
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
          <div key={slide.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="h-40 bg-neutral-100 relative">
              {slide.type === 'image' && (
                <img src={slide.content} alt={slide.title} className="w-full h-full object-cover" />
              )}
              {slide.type === 'text' && (
                <div className="w-full h-full flex items-center justify-center p-6 text-center bg-blue-50">
                  <p className="text-sm font-medium text-blue-900 line-clamp-4">{slide.content}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
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
    </div>
  );
}

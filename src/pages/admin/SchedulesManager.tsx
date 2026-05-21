import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Check, 
  AlertCircle, 
  ToggleLeft, 
  ToggleRight, 
  X, 
  Sparkles, 
  Monitor, 
  LayoutGrid, 
  Layers, 
  Building 
} from 'lucide-react';
import { Schedule, Slide, SmartTV, ScreenGroup } from '../../types';
import { cn } from '../../lib/utils';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi', short: 'Lun' },
  { value: 2, label: 'Mardi', short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi', short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi', short: 'Sam' },
  { value: 0, label: 'Dimanche', short: 'Dim' }
];

export default function SchedulesManager() {
  const schedules = useStore((state) => state.schedules || []);
  const tvs = useStore((state) => state.tvs || []);
  const slides = useStore((state) => state.slides || []);
  const groups = useStore((state) => state.groups || []);
  const organizations = useStore((state) => state.organizations || []);
  const currentOrgId = useStore((state) => state.currentOrgId);
  
  // Actions
  const addSchedule = useStore((state) => state.addSchedule);
  const updateSchedule = useStore((state) => state.updateSchedule);
  const deleteSchedule = useStore((state) => state.deleteSchedule);

  // States
  const [isAdding, setIsAdding] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Filter lists based on the active Tenant / Organization
  const filteredSchedules = currentOrgId === 'ALL'
    ? schedules
    : schedules.filter(s => s.orgId === currentOrgId);

  const filteredTvs = currentOrgId === 'ALL'
    ? tvs
    : tvs.filter(t => t.orgId === currentOrgId);

  const filteredSlides = currentOrgId === 'ALL'
    ? slides
    : slides.filter(s => s.orgId === currentOrgId || s.orgId === 'SYSTEM');

  const filteredGroups = currentOrgId === 'ALL'
    ? groups
    : groups.filter(g => g.orgId === currentOrgId);

  // New form fields
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    orgId: 'org-terroubi',
    targetType: 'ALL' as 'TV' | 'GROUP' | 'ALL',
    targetId: 'ALL',
    slideId: '',
    startTime: '08:00',
    endTime: '17:00',
    daysOfWeek: [1, 2, 3, 4, 5] as number[],
    isActive: true
  });

  // Adjust default values whenever active Tenant profile shifts
  useEffect(() => {
    const defaultOrg = currentOrgId === 'ALL' ? 'org-terroubi' : currentOrgId;
    setNewSchedule(prev => ({
      ...prev,
      orgId: defaultOrg,
      slideId: filteredSlides[0]?.id || '',
      targetId: 'ALL',
      targetType: 'ALL'
    }));
  }, [currentOrgId, slides]);

  const handleDayToggle = (day: number) => {
    if (newSchedule.daysOfWeek.includes(day)) {
      setNewSchedule({
        ...newSchedule,
        daysOfWeek: newSchedule.daysOfWeek.filter((d) => d !== day)
      });
    } else {
      setNewSchedule({
        ...newSchedule,
        daysOfWeek: [...newSchedule.daysOfWeek, day]
      });
    }
  };

  const handleEditDayToggle = (day: number) => {
    if (!editingSchedule) return;
    if (editingSchedule.daysOfWeek.includes(day)) {
      setEditingSchedule({
        ...editingSchedule,
        daysOfWeek: editingSchedule.daysOfWeek.filter((d) => d !== day)
      });
    } else {
      setEditingSchedule({
        ...editingSchedule,
        daysOfWeek: [...editingSchedule.daysOfWeek, day]
      });
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.name || !newSchedule.slideId) return;

    const targetOrg = currentOrgId === 'ALL' ? newSchedule.orgId : currentOrgId;

    const created: Schedule = {
      id: 'sched-' + Date.now(),
      name: newSchedule.name,
      orgId: targetOrg,
      targetType: newSchedule.targetType,
      targetId: newSchedule.targetId,
      tvId: newSchedule.targetType === 'TV' ? newSchedule.targetId : 'ALL',
      slideId: newSchedule.slideId,
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      daysOfWeek: newSchedule.daysOfWeek,
      isActive: newSchedule.isActive
    };

    addSchedule(created);
    setIsAdding(false);
    
    // Reset
    setNewSchedule({
      name: '',
      orgId: targetOrg,
      targetType: 'ALL',
      targetId: 'ALL',
      slideId: filteredSlides[0]?.id || '',
      startTime: '08:00',
      endTime: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      isActive: true
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule || !editingSchedule.name || !editingSchedule.slideId) return;

    updateSchedule(editingSchedule.id, editingSchedule);
    setEditingSchedule(null);
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    updateSchedule(id, { isActive: !currentStatus });
  };

  const getTargetLabel = (schedule: Schedule) => {
    if (schedule.targetType === 'ALL' || schedule.tvId === 'ALL' && !schedule.targetType) {
      return 'Tous les Écrans';
    }
    if (schedule.targetType === 'GROUP') {
      const g = groups.find(g => g.id === schedule.targetId);
      return `Groupe: ${g ? g.name : schedule.targetId}`;
    }
    const t = tvs.find(t => t.id === schedule.targetId);
    return `Écran: ${t ? t.name : schedule.targetId}`;
  };

  const getOrgLabel = (orgId: string) => {
    return organizations.find(o => o.id === orgId)?.name || orgId;
  };

  const getSlideTitle = (slideId: string) => {
    return slides.find((s) => s.id === slideId)?.title || 'Contenu Inconnu';
  };

  const getSlideThumbnail = (slideId: string) => {
    return slides.find((s) => s.id === slideId) || null;
  };

  return (
    <div className="space-y-6 text-neutral-800 leading-relaxed font-sans">
      
      {/* Header banner */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> Planification Automatique (Planning)
          </h1>
          <p className="text-neutral-500 text-xs mt-1">
            Programmez vos diffusions par tranches horaires ou par jours de la semaine sur vos groupes ou d'un écran individuel.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            if (filteredSlides.length > 0) {
              setNewSchedule(prev => ({ ...prev, slideId: filteredSlides[0].id }));
            }
          }}
          className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" /> Nouvelle Planification
        </button>
      </div>

      {filteredSchedules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
          <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-700">Aucun planning programmé</h3>
          <p className="text-neutral-500 text-xs mt-1 max-w-sm mx-auto p-2">
            Il n'y a aucune règle de programmation horaire pour {currentOrgId === 'ALL' ? 'vos structures' : 'cette structure'}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSchedules.map((schedule) => {
            const slide = getSlideThumbnail(schedule.slideId);
            return (
              <div
                key={schedule.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-stretch ${
                  schedule.isActive ? 'border-neutral-200' : 'border-neutral-200 bg-neutral-50/40 opacity-75'
                }`}
              >
                {/* Thumbnail sidebar */}
                <div className="w-full md:w-44 bg-neutral-100 flex items-center justify-center relative p-3 shrink-0 h-32 md:h-auto border-b md:border-b-0 md:border-r border-neutral-150">
                  {slide ? (
                    slide.type === 'image' ? (
                      <img 
                        src={slide.content} 
                        alt={slide.title} 
                        className="w-full h-full object-cover rounded-lg border border-neutral-200" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-50 border border-blue-200 rounded-lg flex flex-col items-center justify-center text-center p-2">
                        <p className="text-[10px] font-bold text-blue-900 line-clamp-3 leading-tight">{slide.content}</p>
                      </div>
                    )
                  ) : (
                    <div className="text-xs text-neutral-400 italic">Aperçu indisponible</div>
                  )}
                  <span className="absolute top-2 left-2 bg-neutral-900/80 text-white text-[9px] px-2 py-0.5 rounded-md font-extrabold tracking-wider uppercase backdrop-blur-sm">
                    {slide?.type || 'Inconnu'}
                  </span>
                </div>

                {/* Info panel */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-neutral-900 leading-tight">
                            {schedule.name}
                          </h3>
                          {currentOrgId === 'ALL' && (
                            <span className="bg-purple-50 text-purple-700 border border-purple-200/50 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                              {getOrgLabel(schedule.orgId)}
                            </span>
                          )}
                        </div>
                        
                        {/* Interactive metadata capsules */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs mt-3">
                          <span className="flex items-center gap-1 bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md font-medium">
                            <Monitor className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            {getTargetLabel(schedule)}
                          </span>
                          <span className="flex items-center gap-1 bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md font-medium">
                            <LayoutGrid className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            {getSlideTitle(schedule.slideId)}
                          </span>
                          <span className="flex items-center gap-1 bg-neutral-100 text-neutral-750 px-2 py-1 rounded-md font-semibold">
                            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            {schedule.startTime} &mdash; {schedule.endTime}
                          </span>
                        </div>
                      </div>

                      {/* Config actions */}
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleActive(schedule.id, schedule.isActive)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            schedule.isActive ? "text-green-600" : "text-neutral-400"
                          )}
                          title={schedule.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {schedule.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                        </button>
                        <button
                          onClick={() => setEditingSchedule(schedule)}
                          className="px-2.5 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Voulez-vous supprimer cette planification ?')) {
                              deleteSchedule(schedule.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-red-650 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Calendar week check list */}
                  <div className="mt-4 flex gap-1 items-center border-t border-neutral-100 pt-3">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mr-2">Jours programmés :</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = schedule.daysOfWeek.includes(day.value);
                        return (
                          <span
                            key={day.value}
                            className={`text-[10px] w-6 h-6 rounded-lg flex items-center justify-center font-bold transition-all ${
                              isSelected 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-neutral-100 text-neutral-400 font-medium'
                            }`}
                            title={day.label}
                          >
                            {day.short}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Adding schedule slide panel */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 text-neutral-900 leading-normal">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-850 flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-blue-600" /> Programmer une nouvelle diffusion
              </h3>
              <button 
                type="button"
                onClick={() => setIsAdding(false)} 
                className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-154 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-605">Nom du repère de planification</label>
                <input
                  type="text"
                  placeholder="Ex: Formule Midi, Message Nocturne, Info Week-end"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg py-2 px-3 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {currentOrgId === 'ALL' && (
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-605">Structure Rattachée (SaaS Tenant)</label>
                  <select
                    value={newSchedule.orgId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, orgId: e.target.value, targetType: 'ALL', targetId: 'ALL' })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 bg-white text-xs"
                  >
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Advanced logic target selector routing */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-605">Cible d'affichage</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSchedule(prev => ({ ...prev, targetType: 'ALL', targetId: 'ALL' }))}
                    className={cn(
                      "py-2.5 px-3 border rounded-lg text-center font-bold text-[10px] uppercase transition-all", 
                      newSchedule.targetType === 'ALL' 
                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm' 
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    )}
                  >
                    Toute la structure
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const scopeGroups = groups.filter(g => g.orgId === (currentOrgId === 'ALL' ? newSchedule.orgId : currentOrgId));
                      setNewSchedule(prev => ({ ...prev, targetType: 'GROUP', targetId: scopeGroups[0]?.id || '' }));
                    }}
                    className={cn(
                      "py-2.5 px-3 border rounded-lg text-center font-bold text-[10px] uppercase transition-all", 
                      newSchedule.targetType === 'GROUP' 
                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm' 
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    )}
                  >
                    Par Groupe d'écrans
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const scopeTvs = tvs.filter(t => t.orgId === (currentOrgId === 'ALL' ? newSchedule.orgId : currentOrgId));
                      setNewSchedule(prev => ({ ...prev, targetType: 'TV', targetId: scopeTvs[0]?.id || '' }));
                    }}
                    className={cn(
                      "py-2.5 px-3 border rounded-lg text-center font-bold text-[10px] uppercase transition-all", 
                      newSchedule.targetType === 'TV' 
                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm' 
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    )}
                  >
                    Un écran unique
                  </button>
                </div>
              </div>

              {/* Context targeting dropdown selector */}
              {newSchedule.targetType === 'GROUP' && (
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-605">Choisir le Groupe Cible</label>
                  <select
                    value={newSchedule.targetId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, targetId: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 bg-white"
                  >
                    {groups
                      .filter(g => g.orgId === (currentOrgId === 'ALL' ? newSchedule.orgId : currentOrgId))
                      .map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))
                    }
                    {groups.filter(g => g.orgId === (currentOrgId === 'ALL' ? newSchedule.orgId : currentOrgId)).length === 0 && (
                      <option value="">Aucun groupe enregistré dans cette structure</option>
                    )}
                  </select>
                </div>
              )}

              {newSchedule.targetType === 'TV' && (
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-605">Choisir la Smart TV cible</label>
                  <select
                    value={newSchedule.targetId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, targetId: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 bg-white"
                  >
                    {tvs
                      .filter(t => t.orgId === (currentOrgId === 'ALL' ? newSchedule.orgId : currentOrgId))
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.name} (Code: {t.code})</option>
                      ))
                    }
                    {tvs.filter(t => t.orgId === (currentOrgId === 'ALL' ? newSchedule.orgId : currentOrgId)).length === 0 && (
                      <option value="">Aucune Smart TV enregistrée dans cette structure</option>
                    )}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-neutral-605 block">Diapositive (Slide) associée</label>
                <select
                  value={newSchedule.slideId}
                  onChange={(e) => setNewSchedule({ ...newSchedule, slideId: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg py-2 px-3 bg-white"
                  required
                >
                  <option value="" disabled>Choisir une slide...</option>
                  {filteredSlides.map((slide) => (
                    <option key={slide.id} value={slide.id}>
                      {slide.title} ({slide.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time slots and week schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-605">Début de diffusion (Heure)</label>
                  <input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 text-xs outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-605">Fin de diffusion (Heure)</label>
                  <input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-neutral-605 block">Définit les jours applicables</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = newSchedule.daysOfWeek.includes(day.value);
                    return (
                      <button
                        type="button"
                        key={day.value}
                        onClick={() => handleDayToggle(day.value)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-650 text-white'
                            : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-2 border border-neutral-300 text-neutral-600 rounded-lg hover:bg-neutral-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg shadow-sm"
                >
                  Ajouter au Planning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editing schedule panel */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 text-neutral-900 leading-normal">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-850 flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-blue-600" /> Modifier la règle de planification
              </h3>
              <button 
                type="button"
                onClick={() => setEditingSchedule(null)} 
                className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-155 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-605">Nom du planning</label>
                <input
                  type="text"
                  value={editingSchedule.name}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, name: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Target options */}
              <div className="space-y-1.5 col-span-2">
                <label className="font-semibold text-neutral-605">Type de cible d'affichage</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSchedule({ ...editingSchedule, targetType: 'ALL', targetId: 'ALL', tvId: 'ALL' })}
                    className={cn(
                      "py-2 px-3 border rounded-lg text-center font-bold text-[10px] uppercase transition-all", 
                      editingSchedule.targetType === 'ALL' || !editingSchedule.targetType && editingSchedule.tvId === 'ALL'
                        ? 'bg-neutral-900 border-neutral-900 text-white' 
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                    )}
                  >
                    Toute la structure
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const scopeGroups = groups.filter(g => g.orgId === editingSchedule.orgId);
                      setEditingSchedule({ ...editingSchedule, targetType: 'GROUP', targetId: scopeGroups[0]?.id || '', tvId: 'ALL' });
                    }}
                    className={cn(
                      "py-2 px-3 border rounded-lg text-center font-bold text-[10px] uppercase transition-all", 
                      editingSchedule.targetType === 'GROUP' 
                        ? 'bg-neutral-900 border-neutral-900 text-white' 
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                    )}
                  >
                    Par groupe d'écrans
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const scopeTvs = tvs.filter(t => t.orgId === editingSchedule.orgId);
                      setEditingSchedule({ ...editingSchedule, targetType: 'TV', targetId: scopeTvs[0]?.id || '', tvId: scopeTvs[0]?.id || '' });
                    }}
                    className={cn(
                      "py-2 px-3 border rounded-lg text-center font-bold text-[10px] uppercase transition-all", 
                      editingSchedule.targetType === 'TV' 
                        ? 'bg-neutral-900 border-neutral-900 text-white' 
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                    )}
                  >
                    Un écran unique
                  </button>
                </div>
              </div>

              {editingSchedule.targetType === 'GROUP' && (
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-605">Choisir le Groupe Cible</label>
                  <select
                    value={editingSchedule.targetId}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, targetId: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 bg-white"
                  >
                    {groups
                      .filter(g => g.orgId === editingSchedule.orgId)
                      .map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))
                    }
                  </select>
                </div>
              )}

              {editingSchedule.targetType === 'TV' && (
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-605">Choisir l'écran Smart TV cible</label>
                  <select
                    value={editingSchedule.targetId}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, targetId: e.target.value, tvId: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 bg-white"
                  >
                    {tvs
                      .filter(t => t.orgId === editingSchedule.orgId)
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))
                    }
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-neutral-605">Slide à afficher</label>
                <select
                  value={editingSchedule.slideId}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, slideId: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg py-2 px-3 bg-white"
                  required
                >
                  {slides
                    .filter(s => s.orgId === editingSchedule.orgId || s.orgId === 'SYSTEM')
                    .map((slide) => (
                      <option key={slide.id} value={slide.id}>
                        {slide.title} ({slide.type})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-605">Début de diffusion (Heure)</label>
                  <input
                    type="time"
                    value={editingSchedule.startTime}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, startTime: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 text-xs outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-605">Fin de diffusion (Heure)</label>
                  <input
                    type="time"
                    value={editingSchedule.endTime}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, endTime: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-neutral-605 block">Définit les jours applicables</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = editingSchedule.daysOfWeek.includes(day.value);
                    return (
                      <button
                        type="button"
                        key={day.value}
                        onClick={() => handleEditDayToggle(day.value)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-650 text-white'
                            : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="px-3.5 py-2 border border-neutral-300 text-neutral-600 rounded-lg hover:bg-neutral-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg"
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

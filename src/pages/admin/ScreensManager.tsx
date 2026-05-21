import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Send, 
  MonitorPlay, 
  ExternalLink, 
  Plus, 
  KeyRound, 
  CheckCircle2, 
  Settings, 
  Trash2, 
  RefreshCcw,
  Layers,
  Building,
  Bookmark,
  ChevronRight,
  Monitor,
  X,
  PlusCircle,
  Hash,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Slide, SmartTV, ScreenGroup } from '../../types';
import { io, Socket } from 'socket.io-client';

export default function ScreensManager() {
  const tvs = useStore((state) => state.tvs);
  const slides = useStore((state) => state.slides);
  const organizations = useStore((state) => state.organizations || []);
  const groups = useStore((state) => state.groups || []);
  const currentOrgId = useStore((state) => state.currentOrgId);
  
  // Actions
  const assignSlideToTV = useStore((state) => state.assignSlideToTV);
  const addTV = useStore((state) => state.addTV);
  const updateTV = useStore((state) => state.updateTV);
  const deleteTV = useStore((state) => state.deleteTV);
  const broadcastSlide = useStore((state) => state.broadcastSlide);
  const addScreenGroup = useStore((state) => state.addScreenGroup);
  const deleteScreenGroup = useStore((state) => state.deleteScreenGroup);

  // Filtered views depending on current organization context
  const filteredTvs = currentOrgId === 'ALL' 
    ? tvs 
    : tvs.filter(t => t.orgId === currentOrgId);
    
  const filteredSlides = currentOrgId === 'ALL' 
    ? slides 
    : slides.filter(s => s.orgId === currentOrgId || s.orgId === 'SYSTEM');

  const filteredGroups = currentOrgId === 'ALL'
    ? groups
    : groups.filter(g => g.orgId === currentOrgId);

  // Selected screen or group
  const [selectedTV, setSelectedTV] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [sentStatus, setSentStatus] = useState<string | null>(null);
  
  // New TV modal state
  const [isAddingTV, setIsAddingTV] = useState(false);
  const [newTVDetails, setNewTVDetails] = useState({ 
    name: '', 
    location: '', 
    orgId: 'org-terroubi', 
    groupId: '' 
  });
  const [generatedTV, setGeneratedTV] = useState<{ id: string; code: string } | null>(null);
  
  // Group creation modal state
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupDetails, setNewGroupDetails] = useState({
    name: '',
    description: '',
    orgId: 'org-terroubi'
  });

  const [editingTV, setEditingTV] = useState<{ 
    id: string; 
    originalId: string; 
    name: string; 
    location: string;
    orgId: string;
    groupId: string;
  } | null>(null);

  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'reset-id' | 'reset-code', tvId: string } | null>(null);

  // Socket for real-time controls
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Admin dashboard socket
    const newSocket = io(window.location.origin);
    setSocket(newSocket);
    
    // Listen for TV online status to update UI
    newSocket.on('tv_online', (tvId: string) => {
      const tvState = useStore.getState().tvs.find(t => t.id === tvId);
      if (tvState) {
        useStore.getState().updateTVStatus(tvId, 'ONLINE');
      }
    });

    newSocket.on('tv_offline', (tvId: string) => {
      const tvState = useStore.getState().tvs.find(t => t.id === tvId);
      if (tvState) {
        useStore.getState().updateTVStatus(tvId, 'OFFLINE');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Update new TV details default org when context changes
  useEffect(() => {
    if (currentOrgId !== 'ALL') {
      setNewTVDetails(prev => ({ ...prev, orgId: currentOrgId }));
      setNewGroupDetails(prev => ({ ...prev, orgId: currentOrgId }));
    }
  }, [currentOrgId]);

  const handleSendSlide = async (slide: Slide | null) => {
    if (selectedTV) {
      assignSlideToTV(selectedTV, slide);
      
      if (socket) {
        socket.emit('update_slide', { tvId: selectedTV, slide });
      }
      
      if (slide) {
        setSentStatus(slide.id);
        setTimeout(() => setSentStatus(null), 2000);
      }
    }
  };

  const handleSendToGroup = async (slide: Slide | null) => {
    if (selectedGroup) {
      // Find all screens belonging to this group
      const targets = tvs.filter(t => t.groupId === selectedGroup);
      
      targets.forEach(tv => {
        assignSlideToTV(tv.id, slide);
        if (socket) {
          socket.emit('update_slide', { tvId: tv.id, slide });
        }
      });

      if (slide) {
        setSentStatus('group-' + slide.id);
        setTimeout(() => setSentStatus(null), 2000);
      }
    }
  };

  const handleBroadcast = async (slide: Slide | null) => {
    // Broadcast slides relative to either the active tenant or ALL
    if (currentOrgId === 'ALL') {
      broadcastSlide(slide);
      if (socket) {
        socket.emit('update_slide', { tvId: 'ALL', slide });
      }
    } else {
      // Broadcast to all screens in that active organization only!
      const targets = tvs.filter(t => t.orgId === currentOrgId);
      targets.forEach(tv => {
        assignSlideToTV(tv.id, slide);
        if (socket) {
          socket.emit('update_slide', { tvId: tv.id, slide });
        }
      });
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
      orgId: currentOrgId === 'ALL' ? newTVDetails.orgId : currentOrgId,
      groupId: newTVDetails.groupId || null
    });

    setGeneratedTV({ id: newId, code: newCode });
    setNewTVDetails(prev => ({ ...prev, name: '', location: '', groupId: '' }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupDetails.name) return;

    const targetedOrg = currentOrgId === 'ALL' ? newGroupDetails.orgId : currentOrgId;
    const newGroupId = `group-${targetedOrg}-${Date.now()}`;

    addScreenGroup({
      id: newGroupId,
      orgId: targetedOrg,
      name: newGroupDetails.name,
      description: newGroupDetails.description,
      createdAt: new Date().toISOString()
    });

    setIsAddingGroup(false);
    setNewGroupDetails(prev => ({ ...prev, name: '', description: '' }));
  };

  const handleUpdateTV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTV || !editingTV.name) return;
    
    updateTV(editingTV.originalId, {
      id: editingTV.id,
      name: editingTV.name,
      location: editingTV.location,
      orgId: editingTV.orgId,
      groupId: editingTV.groupId || null
    });
    setEditingTV(null);
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'delete') {
      deleteTV(confirmAction.tvId);
      if (selectedTV === confirmAction.tvId) setSelectedTV(null);
    } 
    else if (confirmAction.type === 'reset-code') {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      updateTV(confirmAction.tvId, { code: newCode });
    }
    else if (confirmAction.type === 'reset-id') {
      const newId = `TV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      updateTV(confirmAction.tvId, { id: newId });
      if (selectedTV === confirmAction.tvId) setSelectedTV(newId);
    }
    setConfirmAction(null);
  };

  const getOrgName = (orgId: string) => {
    return organizations.find(o => o.id === orgId)?.name || orgId;
  };

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return 'Aucun groupe';
    return groups.find(g => g.id === groupId)?.name || 'Groupe inconnu';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)] leading-relaxed text-neutral-800 font-sans">
      
      {/* LEFT SECTION: Screens and logical Groups */}
      <div className="w-full lg:w-3/5 bg-transparent flex flex-col gap-6 overflow-hidden max-h-full">
        
        {/* Row for groups management */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-neutral-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" /> Groupes logiques
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Permettent d'envoyer un contenu vers plusieurs TV d'un coup.</p>
            </div>
            <button
              onClick={() => setIsAddingGroup(true)}
              className="text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Nouveau Groupe
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
            <button
              onClick={() => { setSelectedGroup(null); setSelectedTV(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                !selectedGroup && !selectedTV
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              Tout afficher ({filteredTvs.length})
            </button>
            {filteredGroups.map(grp => {
              const tvsInGroup = tvs.filter(t => t.groupId === grp.id);
              const activeGroupStyle = selectedGroup === grp.id;
              return (
                <div key={grp.id} className="inline-flex items-center gap-1">
                  <button
                    onClick={() => { setSelectedGroup(grp.id); setSelectedTV(null); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                      activeGroupStyle
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>{grp.name}</span>
                    <span className={`text-[10px] px-1.5 rounded-full ${activeGroupStyle ? 'bg-blue-800 text-blue-100' : 'bg-neutral-200 text-neutral-700'}`}>
                      {tvsInGroup.length}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Supprimer le groupe "${grp.name}" ? Les TV associées ne seront plus groupées.`)) {
                        deleteScreenGroup(grp.id);
                        if (selectedGroup === grp.id) setSelectedGroup(null);
                      }
                    }}
                    className="p-1 px-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-50 text-xs font-bold font-mono transition-colors"
                    title="Supprimer le groupe"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* TV Master list */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col flex-1 overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-neutral-800">
                {selectedGroup ? `Écrans du Groupe : ${getGroupName(selectedGroup)}` : 'Écrans Connectés'}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Sélectationnez un écran pour commander son affichage</p>
            </div>
            <button 
              onClick={() => { setIsAddingTV(true); setGeneratedTV(null); }}
              className="text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-600/10"
            >
              <Plus className="w-4 h-4" /> Nouvel Écran
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {filteredTvs
              .filter(tv => !selectedGroup || tv.groupId === selectedGroup)
              .map((tv) => {
                const isSelected = selectedTV === tv.id;
                return (
                  <div 
                    key={tv.id} 
                    onClick={() => { setSelectedTV(tv.id); setSelectedGroup(null); }}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col md:flex-row md:items-center justify-between gap-4",
                      isSelected 
                        ? "border-blue-500 bg-blue-50/70 ring-1 ring-blue-500 shadow-sm" 
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    )}
                  >
                    {editingTV && editingTV.originalId === tv.id ? (
                      <div onClick={(e) => e.stopPropagation()} className="w-full space-y-4">
                        <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                          <h4 className="font-bold text-sm text-neutral-850 flex items-center gap-1.5">
                            <Settings className="w-4.5 h-4.5 text-blue-500" /> Configuration de l'écran
                          </h4>
                          <button onClick={() => setEditingTV(null)} className="text-neutral-400 hover:text-neutral-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="bg-blue-100/40 rounded-xl p-3 border border-blue-200/50 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div>
                            <span className="text-neutral-500 block">Identifiant Unique (ID)</span>
                            <span className="font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200 select-all inline-block mt-0.5">{tv.id}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block">Code de couplage</span>
                            <span className="font-mono font-bold text-blue-605 bg-white px-2 py-0.5 rounded border border-blue-200 select-all inline-block mt-0.5">{tv.code}</span>
                          </div>
                          <div className="col-span-2 pt-1">
                            <span className="text-neutral-500 block mb-0.5">Adresse de couplage Smart TV :</span>
                            <input 
                              readOnly 
                              value={`${window.location.origin}/#/tv/client/${tv.id}?code=${tv.code}`} 
                              className="w-full text-[10px] font-mono p-1.5 bg-white border border-neutral-200 rounded outline-none text-neutral-600"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                          </div>
                        </div>

                        <form onSubmit={handleUpdateTV} className="grid grid-cols-2 gap-4 text-xs">
                          <div className="col-span-1">
                            <label className="block font-semibold text-neutral-600 mb-1">Nom de l'écran</label>
                            <input 
                              type="text" 
                              value={editingTV.name}
                              onChange={e => setEditingTV({...editingTV, name: e.target.value})}
                              className="w-full border border-neutral-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                              required
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block font-semibold text-neutral-600 mb-1">Emplacement</label>
                            <input 
                              type="text" 
                              value={editingTV.location}
                              onChange={e => setEditingTV({...editingTV, location: e.target.value})}
                              className="w-full border border-neutral-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          
                          {currentOrgId === 'ALL' && (
                            <div className="col-span-1">
                              <label className="block font-semibold text-neutral-600 mb-1">Organisation</label>
                              <select
                                value={editingTV.orgId}
                                onChange={e => setEditingTV({...editingTV, orgId: e.target.value, groupId: ''})}
                                className="w-full border border-neutral-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 bg-white"
                              >
                                {organizations.map(o => (
                                  <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="col-span-1">
                            <label className="block font-semibold text-neutral-600 mb-1">Groupe d'écrans</label>
                            <select
                              value={editingTV.groupId}
                              onChange={e => setEditingTV({...editingTV, groupId: e.target.value})}
                              className="w-full border border-neutral-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                              <option value="">(Aucun groupe)</option>
                              {groups
                                .filter(g => g.orgId === (currentOrgId === 'ALL' ? editingTV.orgId : currentOrgId))
                                .map(g => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))
                              }
                            </select>
                          </div>

                          <div className="col-span-2 pt-2 border-t border-neutral-150 flex justify-end gap-2">
                            <button type="button" onClick={() => setEditingTV(null)} className="px-3 py-1.5 font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">
                              Annuler
                            </button>
                            <button type="submit" className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                              Enregistrer
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl ${tv.status === 'ONLINE' ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}>
                            <Monitor className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-neutral-800 leading-none">{tv.name}</h4>
                              {currentOrgId === 'ALL' && (
                                <span className="bg-purple-50 text-purple-700 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase">
                                  {getOrgName(tv.orgId)}
                                </span>
                              )}
                              {tv.groupId && (
                                <span className="bg-blue-50 text-blue-700 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Layers className="w-2.5 h-2.5" /> {getGroupName(tv.groupId)}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-neutral-500 mt-1.5">
                              ID: <span className="font-mono font-medium">{tv.id}</span> &bull; Bureau: <span className="font-medium text-neutral-700">{tv.location}</span>
                            </p>
                            
                            {/* Live display metadata */}
                            <div className="mt-2 text-xs flex items-center gap-2">
                              <span className="text-neutral-400 font-medium">Contenu direct : </span>
                              {tv.currentSlide ? (
                                <span className="font-semibold text-neutral-800 bg-amber-50 text-amber-800 border border-amber-200/50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 text-[11px]">
                                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                  {tv.currentSlide.title}
                                </span>
                              ) : (
                                <span className="text-neutral-400 italic">Rutine de planification active</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions line */}
                        <div className="flex items-center gap-1 ml-auto shrink-0 self-end md:self-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setEditingTV({ 
                              id: tv.id, 
                              originalId: tv.id, 
                              name: tv.name, 
                              location: tv.location || '',
                              orgId: tv.orgId,
                              groupId: tv.groupId || ''
                            })}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all"
                            title="Configuration"
                          >
                            <Settings className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'delete', tvId: tv.id })}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                          <a 
                            href={`/#/tv/client/${tv.id}?code=${tv.code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Lien direct TV"
                          >
                            <ExternalLink className="w-4.5 h-4.5" />
                          </a>
                          
                          <span className={cn(
                            "ml-2 text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-full inline-flex items-center gap-1 shadow-sm",
                            tv.status === 'ONLINE' ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full inline-block",
                              tv.status === 'ONLINE' ? "bg-green-500" : "bg-neutral-400"
                            )}></span>
                            {tv.status}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

            {filteredTvs.filter(tv => !selectedGroup || tv.groupId === selectedGroup).length === 0 && (
              <div className="text-center py-12 bg-neutral-50 rounded-xl border border-neutral-200">
                <Monitor className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                <p className="text-neutral-500 font-medium text-sm">Aucun écran trouvé dans ce groupe.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Casting and Direct Control panel */}
      <div className="w-full lg:w-2/5 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden max-h-full">
        {selectedTV ? (
          <>
            <div className="p-4 border-b border-amber-200 bg-amber-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-amber-500" /> Cast Direct : {tvs.find(t => t.id === selectedTV)?.name}
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">Force l'affichage immédiat de cette slide, remplace la planification.</p>
              </div>
              <button
                onClick={() => setSelectedTV(null)}
                className="text-xs px-2.5 py-1.5 bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 rounded-lg font-bold transition-all shrink-0"
              >
                Tout libérer
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {filteredSlides.map((slide) => (
                  <div key={slide.id} className="border border-neutral-200 rounded-xl overflow-hidden flex items-stretch bg-white hover:border-neutral-300 transition-all p-2.5 gap-3">
                    <div className="w-24 bg-neutral-100 rounded-lg overflow-hidden relative shrink-0">
                      {slide.type === 'image' ? (
                        <img src={slide.content} alt={slide.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-blue-50 text-[10px] text-blue-900 line-clamp-3 leading-tight">
                          {slide.content}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-xs text-neutral-900 line-clamp-1">{slide.title}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">Type: {slide.type} &bull; Durée: {slide.duration}s</p>
                      </div>
                      
                      <button 
                        onClick={() => handleSendSlide(slide)}
                        disabled={sentStatus === slide.id}
                        className={cn(
                          "mt-2 w-full flex justify-center items-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-colors",
                          sentStatus === slide.id 
                            ? "bg-green-600 text-white"
                            : "bg-neutral-900 hover:bg-neutral-800 text-white"
                        )}
                      >
                        {sentStatus === slide.id ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-3 h-3" />}
                        {sentStatus === slide.id ? "Couplé !" : "Caster sur cette TV"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                 <button 
                    onClick={() => handleSendSlide(null)}
                    className="w-full border border-dashed border-red-200 text-red-600 hover:bg-red-50/50 py-2.5 rounded-xl text-xs font-bold transition-colors"
                  >
                    Arrêter la diffusion directe (Reprendre planification)
                  </button>
              </div>
            </div>
          </>
        ) : selectedGroup ? (
          <>
            <div className="p-4 border-b border-blue-200 bg-blue-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Layers className="w-4.5 h-4.5 text-blue-500" /> Cast sur Groupe : {getGroupName(selectedGroup)}
                </h3>
                <p className="text-xs text-blue-700 mt-0.5">Actualise instantanément l'écran de TOUTES les TV de ce groupe.</p>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-xs px-2.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-105 text-blue-800 rounded-lg font-bold transition-all shrink-0"
              >
                Retour
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {filteredSlides.map((slide) => (
                  <div key={slide.id} className="border border-neutral-200 rounded-xl overflow-hidden flex items-stretch bg-white hover:border-neutral-300 transition-all p-2.5 gap-3">
                    <div className="w-24 bg-neutral-100 rounded-lg overflow-hidden relative shrink-0">
                      {slide.type === 'image' ? (
                        <img src={slide.content} alt={slide.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-blue-50 text-[10px] text-blue-900 line-clamp-3 leading-tight">
                          {slide.content}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-xs text-neutral-900 line-clamp-1">{slide.title}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">Type: {slide.type} &bull; Durée: {slide.duration}s</p>
                      </div>
                      
                      <button 
                        onClick={() => handleSendToGroup(slide)}
                        disabled={sentStatus === 'group-' + slide.id}
                        className={cn(
                          "mt-2 w-full flex justify-center items-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                          sentStatus === 'group-' + slide.id 
                            ? "bg-green-600 text-white"
                            : "bg-blue-650 hover:bg-blue-700 text-white"
                        )}
                      >
                        {sentStatus === 'group-' + slide.id ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-3 h-3" />}
                        {sentStatus === 'group-' + slide.id ? "Diffusé !" : "Diffuser au Groupe"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                 <button 
                    onClick={() => handleSendToGroup(null)}
                    className="w-full border border-dashed border-red-200 text-red-600 hover:bg-red-50/50 py-2.5 rounded-xl text-xs font-bold transition-colors"
                  >
                    Libérer le groupe (Reprendre planification)
                  </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 border-b border-blue-200 bg-blue-50">
              <h3 className="font-bold text-blue-950 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" /> Diffusion Générale
              </h3>
              <p className="text-xs text-blue-700 mt-0.5">
                {currentOrgId === 'ALL' 
                  ? 'Diffusez une diapo d\'urgence à TOUS les écrans de la plateforme.'
                  : `Diffusez une diapo à TOUS les écrans de "${getOrgName(currentOrgId)}".`
                }
              </p>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {filteredSlides.map((slide) => (
                  <div key={slide.id} className="border border-neutral-200 rounded-xl overflow-hidden flex items-stretch bg-white hover:border-neutral-300 transition-all p-2.5 gap-3">
                    <div className="w-24 bg-neutral-100 rounded-lg overflow-hidden relative shrink-0">
                      {slide.type === 'image' ? (
                        <img src={slide.content} alt={slide.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-blue-50 text-[10px] text-blue-900 line-clamp-3 leading-tight">
                          {slide.content}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-xs text-neutral-900 line-clamp-1">{slide.title}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">Type: {slide.type} &bull; Durée: {slide.duration}s</p>
                      </div>
                      
                      <button 
                        onClick={() => handleBroadcast(slide)}
                        disabled={sentStatus === 'broadcast-' + slide.id}
                        className={cn(
                          "mt-2 w-full flex justify-center items-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                          sentStatus === 'broadcast-' + slide.id 
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                      >
                        {sentStatus === 'broadcast-' + slide.id ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-3 h-3" />}
                        {sentStatus === 'broadcast-' + slide.id ? "Diffusé partout !" : "Diffuser d'urgence"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                 <button 
                    onClick={() => handleBroadcast(null)}
                    className="w-full border border-dashed border-red-200 text-red-600 hover:bg-red-50/50 py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Arrêter la diffusion d'urgence (Reprendre planifications)
                  </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modals & Dialogs */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 text-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in duration-150 p-6 text-neutral-900 leading-normal">
            <h3 className="text-base font-bold text-neutral-900 mb-2">
              {confirmAction.type === 'delete' ? 'Supprimer l\'écran' : 
               confirmAction.type === 'reset-id' ? 'Réinitialiser l\'ID' : 'Réinitialiser le code'}
            </h3>
            <p className="text-neutral-500 mb-6 text-xs">
              {confirmAction.type === 'delete' ? 'Voulez-vous vraiment supprimer cet écran ? Cette action est irréversible.' : 
               confirmAction.type === 'reset-id' ? 'Voulez-vous vraiment générer un nouvel identifiant (ID) pour cet écran ? Les liens d\'accès existants ne fonctionneront plus.' : 
               'Voulez-vous vraiment générer un nouveau code d\'accès pour cet écran ? Les sessions actuelles pourraient être déconnectées.'}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)} className="px-3.5 py-2 font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">
                Annuler
              </button>
              <button 
                onClick={executeConfirmAction}
                className={cn(
                  "px-4 py-2 font-bold text-white rounded-lg",
                  confirmAction.type === 'delete' ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
                )}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Creation Dialog */}
      {isAddingGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 text-neutral-900">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-850 flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-blue-600" /> Nouveau Groupe d'Écrans
              </h3>
              <button onClick={() => setIsAddingGroup(false)} className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-full">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Nom du Groupe</label>
                <input
                  type="text"
                  placeholder="Ex: Écrans Hall de l'hôtel, Menu Boards"
                  value={newGroupDetails.name}
                  onChange={e => setNewGroupDetails({ ...newGroupDetails, name: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Description</label>
                <textarea
                  placeholder="Usage, écrans de secours, etc."
                  value={newGroupDetails.description}
                  onChange={e => setNewGroupDetails({ ...newGroupDetails, description: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:ring-1 focus:ring-blue-500 outline-none h-16 text-xs"
                />
              </div>

              {currentOrgId === 'ALL' && (
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Rattacher à la structure (Tenant)</label>
                  <select
                    value={newGroupDetails.orgId}
                    onChange={e => setNewGroupDetails({ ...newGroupDetails, orgId: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 text-xs bg-white focus:outline-none"
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-150 flex justify-end gap-2 font-semibold">
                <button type="button" onClick={() => setIsAddingGroup(false)} className="px-3.5 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg">
                  Ajouter le Groupe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screen Creation Dialog */}
      {isAddingTV && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 text-neutral-900">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-850 flex items-center gap-1.5">
                <MonitorPlay className="w-5 h-5 text-blue-600" /> Ajouter une nouvelle Smart TV
              </h3>
              <button onClick={() => setIsAddingTV(false)} className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-full">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            {generatedTV ? (
              <div className="p-6 text-center text-xs space-y-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
                  <Monitor className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-neutral-950 text-sm">TV Enregistrée avec succés</h4>
                  <p className="text-neutral-500 mt-1">Saisie sur le lecteur de l'écran pour synchronisation.</p>
                </div>

                <div className="text-left bg-neutral-50 p-4 border border-neutral-200 rounded-xl space-y-3">
                  <div>
                    <span className="text-neutral-400 font-bold uppercase block tracking-wider text-[9px]">ID Unique (TV ID)</span>
                    <span className="font-mono text-neutral-900 font-bold text-sm tracking-wider select-all">{generatedTV.id}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-bold uppercase block tracking-wider text-[9px]">Code de couplage</span>
                    <span className="font-mono text-blue-600 font-extrabold text-xl select-all">{generatedTV.code}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200">
                    <span className="text-neutral-400 font-bold uppercase block tracking-wider text-[9px] mb-1">Lien direct d'accès</span>
                    <input 
                      readOnly 
                      value={`${window.location.origin}/#/tv/client/${generatedTV.id}?code=${generatedTV.code}`} 
                      className="w-full text-[10px] font-mono p-1.5 bg-white border border-neutral-200 rounded outline-none"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setIsAddingTV(false)}
                  className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800"
                >
                  Terminer
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTV} className="p-5 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Nom de l'écran</label>
                  <input
                    type="text"
                    placeholder="Ex: Grand Écran Suite 101, Lobby Mur Gauche"
                    value={newTVDetails.name}
                    onChange={e => setNewTVDetails({ ...newTVDetails, name: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Emplacement physique</label>
                  <input
                    type="text"
                    placeholder="Ex: Bâtiment Annexe - Niveau 1"
                    value={newTVDetails.location}
                    onChange={e => setNewTVDetails({ ...newTVDetails, location: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                  />
                </div>

                {currentOrgId === 'ALL' && (
                  <div className="space-y-1">
                    <label className="font-semibold text-neutral-700">Structure de rattachement (SaaS Tenant)</label>
                    <select
                      value={newTVDetails.orgId}
                      onChange={e => setNewTVDetails({ ...newTVDetails, orgId: e.target.value, groupId: '' })}
                      className="w-full border border-neutral-300 rounded-lg py-2 px-3 text-xs bg-white focus:outline-none"
                    >
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Rattacher directement à un groupe d'écrans</label>
                  <select
                    value={newTVDetails.groupId}
                    onChange={e => setNewTVDetails({ ...newTVDetails, groupId: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg py-2 px-3 text-xs bg-white focus:outline-none"
                  >
                    <option value="">Auncun (Défilement individuel)</option>
                    {groups
                      .filter(g => g.orgId === (currentOrgId === 'ALL' ? newTVDetails.orgId : currentOrgId))
                      .map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="pt-3 border-t border-neutral-150 flex justify-end gap-2 font-semibold">
                  <button type="button" onClick={() => setIsAddingTV(false)} className="px-3.5 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50">
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg">
                    Enregistrer la Smart TV
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

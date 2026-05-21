import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  SmartTV, 
  Slide, 
  Playlist, 
  Schedule, 
  Organization, 
  ScreenGroup, 
  MOCK_SLIDES, 
  MOCK_TVS, 
  MOCK_SCHEDULES, 
  MOCK_ORGANIZATIONS, 
  MOCK_GROUPS 
} from '../types';

interface AppState {
  tvs: SmartTV[];
  slides: Slide[];
  playlists: Playlist[];
  schedules: Schedule[];
  organizations: Organization[];
  groups: ScreenGroup[];
  currentOrgId: string | 'ALL'; // Active Organization Isolation Filter
  
  // Custom Actions
  setCurrentOrgId: (orgId: string | 'ALL') => void;
  updateTVStatus: (id: string, status: 'ONLINE' | 'OFFLINE') => void;
  assignSlideToTV: (tvId: string, slide: Slide | null) => void;
  assignPlaylistToTV: (tvId: string, playlistId: string | null) => void;
  
  addSlide: (slide: Slide) => void;
  updateSlide: (id: string, updates: Partial<Slide>) => void;
  deleteSlide: (id: string) => void;
  
  addTV: (tv: SmartTV) => void;
  updateTV: (oldId: string, updates: Partial<SmartTV>) => void;
  deleteTV: (id: string) => void;
  broadcastSlide: (slide: Slide | null) => void;
  
  // Organization Actions
  addOrganization: (org: Organization) => void;
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  deleteOrganization: (id: string) => void;

  // Screen Group Actions
  addScreenGroup: (group: ScreenGroup) => void;
  updateScreenGroup: (id: string, updates: Partial<ScreenGroup>) => void;
  deleteScreenGroup: (id: string) => void;

  // Schedule Actions
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, updates: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  
  // Used by TV client to broadcast heartbeat
  tvHeartbeat: (tvId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tvs: MOCK_TVS,
      slides: MOCK_SLIDES,
      playlists: [],
      schedules: MOCK_SCHEDULES,
      organizations: MOCK_ORGANIZATIONS,
      groups: MOCK_GROUPS,
      currentOrgId: 'ALL', // default to Super-Admin view/all

      setCurrentOrgId: (orgId) => set({ currentOrgId: orgId }),

      updateTVStatus: (id, status) => set((state) => ({
        tvs: state.tvs.map((tv) => tv.id === id ? { ...tv, status, lastOnline: new Date().toISOString() } : tv)
      })),

      assignSlideToTV: (tvId, slide) => set((state) => ({
        tvs: state.tvs.map((tv) => tv.id === tvId ? { ...tv, currentSlide: slide, currentPlaylistId: null } : tv)
      })),

      assignPlaylistToTV: (tvId, playlistId) => set((state) => ({
        tvs: state.tvs.map((tv) => tv.id === tvId ? { ...tv, currentPlaylistId: playlistId, currentSlide: null } : tv)
      })),

      addSlide: (slide) => set((state) => ({
        slides: [...state.slides, slide]
      })),

      updateSlide: (id, updates) => set((state) => ({
        slides: state.slides.map((s) => s.id === id ? { ...s, ...updates } : s),
        tvs: state.tvs.map((tv) => tv.currentSlide?.id === id 
          ? { ...tv, currentSlide: { ...tv.currentSlide, ...updates } } 
          : tv
        )
      })),

      deleteSlide: (id) => set((state) => ({
        slides: state.slides.filter((s) => s.id !== id),
        tvs: state.tvs.map((tv) => tv.currentSlide?.id === id 
          ? { ...tv, currentSlide: null } 
          : tv
        )
      })),

      addTV: (tv) => set((state) => ({
        tvs: [...state.tvs, tv]
      })),

      updateTV: (oldId, updates) => set((state) => ({
        tvs: state.tvs.map((tv) => tv.id === oldId ? { ...tv, ...updates } : tv)
      })),

      deleteTV: (id) => set((state) => ({
        tvs: state.tvs.filter((tv) => tv.id !== id)
      })),

      broadcastSlide: (slide) => set((state) => ({
        tvs: state.tvs.map((tv) => tv.status === 'ONLINE' ? { ...tv, currentSlide: slide, currentPlaylistId: null } : tv)
      })),

      // Organizations
      addOrganization: (org) => set((state) => ({
        organizations: [...state.organizations, org]
      })),

      updateOrganization: (id, updates) => set((state) => ({
        organizations: state.organizations.map((o) => o.id === id ? { ...o, ...updates } : o)
      })),

      deleteOrganization: (id) => set((state) => ({
        organizations: state.organizations.filter((o) => o.id !== id),
        // Cascading deletion
        groups: state.groups.filter((g) => g.orgId !== id),
        tvs: state.tvs.map((tv) => tv.orgId === id ? { ...tv, orgId: 'SYSTEM' } : tv),
        slides: state.slides.filter((s) => s.orgId !== id),
        schedules: state.schedules.filter((s) => s.orgId !== id)
      })),

      // Screen Groups
      addScreenGroup: (group) => set((state) => ({
        groups: [...state.groups, group]
      })),

      updateScreenGroup: (id, updates) => set((state) => ({
        groups: state.groups.map((g) => g.id === id ? { ...g, ...updates } : g)
      })),

      deleteScreenGroup: (id) => set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
        // Clear references from SmartTVs
        tvs: state.tvs.map((tv) => tv.groupId === id ? { ...tv, groupId: null } : tv),
        schedules: state.schedules.filter((s) => s.targetType === 'GROUP' && s.targetId === id ? false : true)
      })),

      addSchedule: (schedule) => set((state) => ({
        schedules: [...state.schedules, schedule]
      })),

      updateSchedule: (id, updates) => set((state) => ({
        schedules: state.schedules.map((s) => s.id === id ? { ...s, ...updates } : s)
      })),

      deleteSchedule: (id) => set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id)
      })),

      tvHeartbeat: (tvId) => set((state) => ({
        tvs: state.tvs.map((tv) => 
          tv.id === tvId 
            ? { ...tv, status: 'ONLINE', lastOnline: new Date().toISOString() } 
            : tv
        )
      })),
    }),
    {
      name: 'hardsoft-display-storage',
    }
  )
);

export const syncTabs = () => {
  window.addEventListener('storage', (e) => {
    if (e.key === 'hardsoft-display-storage') {
      useStore.persist.rehydrate();
    }
  });
};

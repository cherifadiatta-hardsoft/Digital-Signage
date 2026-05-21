import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SmartTV, Slide, Playlist, MOCK_SLIDES, MOCK_TVS } from '../types';

interface AppState {
  tvs: SmartTV[];
  slides: Slide[];
  playlists: Playlist[];
  
  // Actions
  updateTVStatus: (id: string, status: 'ONLINE' | 'OFFLINE') => void;
  assignSlideToTV: (tvId: string, slide: Slide | null) => void;
  assignPlaylistToTV: (tvId: string, playlistId: string | null) => void;
  addSlide: (slide: Slide) => void;
  addTV: (tv: SmartTV) => void;
  updateTV: (oldId: string, updates: Partial<SmartTV>) => void;
  deleteTV: (id: string) => void;
  broadcastSlide: (slide: Slide | null) => void;
  
  // Used by TV client to broadcast their heartbeat
  tvHeartbeat: (tvId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tvs: MOCK_TVS,
      slides: MOCK_SLIDES,
      playlists: [],

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

// Helper to manually trigger synchronization across browser tabs (simulating WebSockets)
export const syncTabs = () => {
  window.addEventListener('storage', (e) => {
    if (e.key === 'hardsoft-display-storage') {
      useStore.persist.rehydrate();
    }
  });
};


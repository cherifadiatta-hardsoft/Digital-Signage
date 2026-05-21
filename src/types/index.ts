export type SlideType = 'image' | 'video' | 'html' | 'text';

export interface Slide {
  id: string;
  title: string;
  type: SlideType;
  content: string; // URL to image/video or text content
  duration: number; // in seconds
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  slides: string[]; // slide IDs
  createdBy: string;
}

export interface SmartTV {
  id: string;
  name: string;
  code: string; // auth code
  status: 'ONLINE' | 'OFFLINE';
  lastOnline: string;
  location: string;
  currentSlide?: Slide | null; // Currently forced slide, overrides playlist
  currentPlaylistId?: string | null;
}

// Default mock data to populate our fake DB
export const MOCK_SLIDES: Slide[] = [
  {
    id: 'slide-1',
    title: 'Hôtel Accueil - Welcome',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1542314831-c6a4d27ce66b?auto=format&fit=crop&q=80',
    duration: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slide-2',
    title: 'Restaurant Promotion',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80',
    duration: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slide-3',
    title: 'Météo du jour',
    type: 'text',
    content: 'Il fait beau à Dakar ! 28°C aujourd\'hui.',
    duration: 8,
    createdAt: new Date().toISOString(),
  }
];

export const MOCK_TVS: SmartTV[] = [
  {
    id: 'TV-DAKAR-001',
    name: 'Réception Principale',
    code: '123456',
    status: 'OFFLINE',
    lastOnline: new Date().toISOString(),
    location: 'Lobby',
    currentPlaylistId: null,
  },
  {
    id: 'TV-DAKAR-002',
    name: 'Restaurant',
    code: '123456',
    status: 'OFFLINE',
    lastOnline: new Date().toISOString(),
    location: '1er Étage',
    currentPlaylistId: null,
  }
];

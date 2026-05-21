export type SlideType = 'image' | 'video' | 'html' | 'text';

export interface Organization {
  id: string;
  name: string;
  type: 'hotel' | 'restaurant' | 'pharmacy' | 'retail' | 'other';
  logo?: string;
  address?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ScreenGroup {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Slide {
  id: string;
  title: string;
  type: SlideType;
  content: string; // URL to image/video or text content
  duration: number; // in seconds
  createdAt: string;
  orgId: string; // Tenant isolation key, or 'SYSTEM' for template slides
}

export interface Schedule {
  id: string;
  name: string;
  orgId: string; // Tenant isolation key
  targetType: 'TV' | 'GROUP' | 'ALL'; // Targets specific TV, Group, or All TVs in the Org
  targetId: string; // Specific TV ID, Group ID, or 'ALL'
  tvId: string; // Keep for backward compatibility (matches targetId when targetType === 'TV')
  slideId: string;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  isActive: boolean;
}

export interface Playlist {
  id: string;
  orgId: string;
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
  currentSlide?: Slide | null; // For manual direct overrides
  currentPlaylistId?: string | null;
  orgId: string; // Tenant ID
  groupId?: string | null; // Associated group ID
}

// Default Organizations
export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-terroubi',
    name: 'Hôtel Terrou-Bi Dakar',
    type: 'hotel',
    logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
    address: 'Boulevard Martin Luther King, Dakar',
    phone: '+221 33 889 80 00',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'org-dakarfood',
    name: 'Dakar Food Restaurant',
    type: 'restaurant',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80',
    address: 'Avenue Bourguiba, Dakar',
    phone: '+221 77 123 45 67',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'org-pharmaciehlm',
    name: 'Pharmacie de la Médina',
    type: 'pharmacy',
    logo: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80',
    address: 'Rue 6, Médina, Dakar',
    phone: '+221 33 821 11 22',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

// Screen Groups per Organization
export const MOCK_GROUPS: ScreenGroup[] = [
  // Hôtel Terrou-Bi
  {
    id: 'group-reception',
    orgId: 'org-terroubi',
    name: 'Zone Réception & Hall',
    description: 'Écrans pour l\'accueil des clients du lobby',
    createdAt: new Date().toISOString()
  },
  {
    id: 'group-spa-pool',
    orgId: 'org-terroubi',
    name: 'Espace Spa & Piscine',
    description: 'Écrans situés autour de l\'espace bien-être',
    createdAt: new Date().toISOString()
  },
  {
    id: 'group-hotel-resto',
    orgId: 'org-terroubi',
    name: 'Restaurant Gaston',
    description: 'Promotions et menus du chef',
    createdAt: new Date().toISOString()
  },
  
  // Dakar Food
  {
    id: 'group-menus',
    orgId: 'org-dakarfood',
    name: 'Panneaux de Menu (Menu Boards)',
    description: 'Écrans d\'affichage des prix et formules au-dessus de la caisse',
    createdAt: new Date().toISOString()
  },
  {
    id: 'group-kitchen',
    orgId: 'org-dakarfood',
    name: 'Suivi Cuisine',
    description: 'Écrans d\'affichage des commandes en préparation',
    createdAt: new Date().toISOString()
  },
  {
    id: 'group-vip',
    orgId: 'org-dakarfood',
    name: 'Salon Privé (VIP)',
    description: 'Ambiance lounge et événements spéciaux',
    createdAt: new Date().toISOString()
  }
];

// Default mock slides
export const MOCK_SLIDES: Slide[] = [
  // Hôtel Terrou-Bi Slides
  {
    id: 'slide-terrou-welcome',
    title: 'Mot d\'accueil Terrou-Bi',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1542314831-c6a4d27ce66b?auto=format&fit=crop&q=80',
    duration: 12,
    orgId: 'org-terroubi',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slide-terrou-spa',
    title: 'Promotion Spa Relaxant',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80',
    duration: 15,
    orgId: 'org-terroubi',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slide-terrou-buffet',
    title: 'Buffet fruits de mer du Vendredi',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80',
    duration: 12,
    orgId: 'org-terroubi',
    createdAt: new Date().toISOString(),
  },
  
  // Dakar Food Slides
  {
    id: 'slide-food-lunch',
    title: 'Menu Complet Midi',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80',
    duration: 10,
    orgId: 'org-dakarfood',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slide-food-burger',
    title: 'Promo Smash Burger XXL',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80',
    duration: 15,
    orgId: 'org-dakarfood',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slide-food-text',
    title: 'Devise de Dakar Food',
    type: 'text',
    content: 'Une cuisine saine et savoureuse, cuite au feu de bois.',
    duration: 8,
    orgId: 'org-dakarfood',
    createdAt: new Date().toISOString(),
  },

  // Pharmacie Médina Slides
  {
    id: 'slide-pharma-welcome',
    title: 'Bienvenue & Informations',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80',
    duration: 10,
    orgId: 'org-pharmaciehlm',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slide-pharma-promo',
    title: 'Offre Solaire - Achetez-en 1, obtenez 1 gratuit',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80',
    duration: 15,
    orgId: 'org-pharmaciehlm',
    createdAt: new Date().toISOString(),
  }
];

// Prepopulated schedules with Tenant isolation and targeting Screen Groups
export const MOCK_SCHEDULES: Schedule[] = [
  // Hôtel Terrou-Bi
  {
    id: 'sched-terrou-reception',
    name: 'Accueil Matinal Recep',
    orgId: 'org-terroubi',
    targetType: 'GROUP',
    targetId: 'group-reception',
    tvId: 'ALL',
    slideId: 'slide-terrou-welcome',
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '06:00',
    endTime: '11:59',
    isActive: true,
  },
  {
    id: 'sched-terrou-lunch',
    name: 'Promo Restaurant Gaston',
    orgId: 'org-terroubi',
    targetType: 'GROUP',
    targetId: 'group-hotel-resto',
    tvId: 'ALL',
    slideId: 'slide-terrou-buffet',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    startTime: '12:00',
    endTime: '15:30',
    isActive: true,
  },
  
  // Dakar Food
  {
    id: 'sched-food-lunch',
    name: 'Menu Midi Enseigne',
    orgId: 'org-dakarfood',
    targetType: 'GROUP',
    targetId: 'group-menus',
    tvId: 'ALL',
    slideId: 'slide-food-lunch',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    startTime: '11:30',
    endTime: '16:00',
    isActive: true,
  },
  {
    id: 'sched-food-burger',
    name: 'Soirée Burger VIP',
    orgId: 'org-dakarfood',
    targetType: 'GROUP',
    targetId: 'group-vip',
    tvId: 'ALL',
    slideId: 'slide-food-burger',
    daysOfWeek: [5, 6], // Vendredi et Samedi
    startTime: '18:00',
    endTime: '23:30',
    isActive: true,
  }
];

// Prepopulated TVs map
export const MOCK_TVS: SmartTV[] = [
  // Hôtel Terrou-Bi screens
  {
    id: 'TV-TERROU-LOBBY',
    name: 'Écran Réception',
    code: '123456',
    status: 'ONLINE',
    lastOnline: new Date().toISOString(),
    location: 'Lobby Principal',
    currentPlaylistId: null,
    orgId: 'org-terroubi',
    groupId: 'group-reception'
  },
  {
    id: 'TV-TERROU-SPA',
    name: 'Écran Piscine',
    code: '234567',
    status: 'OFFLINE',
    lastOnline: new Date().toISOString(),
    location: 'Abords Piscine',
    currentPlaylistId: null,
    orgId: 'org-terroubi',
    groupId: 'group-spa-pool'
  },
  {
    id: 'TV-TERROU-RESTO',
    name: 'Écran Buffet Gastro',
    code: '345678',
    status: 'ONLINE',
    lastOnline: new Date().toISOString(),
    location: 'Entrée Restaurant',
    currentPlaylistId: null,
    orgId: 'org-terroubi',
    groupId: 'group-hotel-resto'
  },
  
  // Dakar Food screens
  {
    id: 'TV-FOOD-MENU1',
    name: 'Menu Board 01 (Burgers)',
    code: '111111',
    status: 'ONLINE',
    lastOnline: new Date().toISOString(),
    location: 'Au-dessus de la caisse 1',
    currentPlaylistId: null,
    orgId: 'org-dakarfood',
    groupId: 'group-menus'
  },
  {
    id: 'TV-FOOD-KITCHEN',
    name: 'Cuisine Commandes',
    code: '222222',
    status: 'ONLINE',
    lastOnline: new Date().toISOString(),
    location: 'Mur Préparation',
    currentPlaylistId: null,
    orgId: 'org-dakarfood',
    groupId: 'group-kitchen'
  },
  
  // Pharmaciescreens
  {
    id: 'TV-PHARMA-LOBBY',
    name: 'Vitrine Principale',
    code: '333333',
    status: 'OFFLINE',
    lastOnline: new Date().toISOString(),
    location: 'Devanture',
    currentPlaylistId: null,
    orgId: 'org-pharmaciehlm',
    groupId: null
  }
];

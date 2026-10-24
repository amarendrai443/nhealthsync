export type GridTabSectionType = 'section1' | 'section2';

export interface GridTabItem {
  id: string;
  section: GridTabSectionType;
  title: string;
  imageUrl: string;
  targetLink: string;
  badge?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'nhealth_grid_tabs_v1';

export const DEFAULT_GRID_TABS: GridTabItem[] = [
  // SECTION 1 (Directly below Banner 1) - 5x5 Desktop / 3x3 Mobile
  {
    id: 'gt-s1-1',
    section: 'section1',
    title: 'Doctor Visits',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    targetLink: 'Doctor home visits',
    badge: 'Verified',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gt-s1-2',
    section: 'section1',
    title: 'Lab Diagnostics',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80',
    targetLink: 'Home diagnostics & lab tests',
    badge: 'NABL 45% Off',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gt-s1-3',
    section: 'section1',
    title: 'Vital Lens™',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
    targetLink: 'vital-lens',
    badge: 'AI Camera',
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gt-s1-4',
    section: 'section1',
    title: 'Home Nursing',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
    targetLink: 'Specialized nursing care at home',
    badge: '24/7 Bedside',
    order: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gt-s1-5',
    section: 'section1',
    title: 'Ambulance SOS',
    imageUrl: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=400&q=80',
    targetLink: 'Ambulance & medical transport',
    badge: 'Emergency',
    order: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // SECTION 2 (Directly below Banner 2) - 5x5 Desktop / 3x3 Mobile
  {
    id: 'gt-s2-1',
    section: 'section2',
    title: 'Physiotherapy',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80',
    targetLink: 'Physiotherapy & rehabilitation',
    badge: 'Rehab',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gt-s2-2',
    section: 'section2',
    title: 'Elderly Care',
    imageUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=400&q=80',
    targetLink: 'Elderly geriatric home care',
    badge: 'Geriatric',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gt-s2-3',
    section: 'section2',
    title: 'Medical Devices',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    targetLink: 'Medical equipment rental & sale',
    badge: 'Rental',
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gt-s2-4',
    section: 'section2',
    title: 'My Records Vault',
    imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=400&q=80',
    targetLink: 'records',
    badge: 'Secure',
    order: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gt-s2-5',
    section: 'section2',
    title: 'Quick Booking',
    imageUrl: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=400&q=80',
    targetLink: 'quick-booking',
    badge: 'Instant',
    order: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getStoredGridTabs(): GridTabItem[] {
  if (typeof window === 'undefined') return DEFAULT_GRID_TABS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStoredGridTabs(DEFAULT_GRID_TABS);
      return DEFAULT_GRID_TABS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse grid tabs:', err);
  }
  return DEFAULT_GRID_TABS;
}

export function saveStoredGridTabs(tabs: GridTabItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    window.dispatchEvent(new CustomEvent('nhealth_grid_tabs_updated'));
  } catch (err) {
    console.error('Failed to persist grid tabs:', err);
  }
}

export function addStoredGridTab(item: Omit<GridTabItem, 'id' | 'createdAt' | 'updatedAt'>): GridTabItem {
  const current = getStoredGridTabs();
  const newItem: GridTabItem = {
    ...item,
    id: `gt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [...current, newItem];
  saveStoredGridTabs(updated);
  return newItem;
}

export function updateStoredGridTab(id: string, updates: Partial<GridTabItem>): void {
  const current = getStoredGridTabs();
  const updated = current.map((item) =>
    item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
  );
  saveStoredGridTabs(updated);
}

export function deleteStoredGridTab(id: string): void {
  const current = getStoredGridTabs();
  const updated = current.filter((item) => item.id !== id);
  saveStoredGridTabs(updated);
}

export function resetStoredGridTabs(): void {
  saveStoredGridTabs(DEFAULT_GRID_TABS);
}

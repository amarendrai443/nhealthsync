export type PromotionType = 'offer' | 'referral';

export interface PromotionItem {
  id: string;
  type: PromotionType;
  title: string;
  description: string;
  discount: string; // e.g. "FLAT 45% OFF", "₹250 Instant Credit"
  code: string; // e.g. "NHCARE45", "NH-HEALTH250"
  badge: string; // e.g. "Special Patient Offer", "Refer & Earn ₹250"
  imageUrl?: string;
  price?: string; // e.g. "₹999"
  originalPrice?: string; // e.g. "₹1,800"
  ctaText: string; // e.g. "Claim 45% Off Voucher", "View Care Rewards & Wallet"
  ctaLink: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'nhealth_promotions_offers_v1';

export const DEFAULT_PROMOTIONS: PromotionItem[] = [
  {
    id: 'promo-offer-1',
    type: 'offer',
    title: 'Comprehensive Full Body Checkup Package',
    description: '72 vital bio-markers including CBC, Lipid Profile, Liver & Kidney Function, HbA1c & Thyroid with free home sample collection.',
    discount: 'FLAT 45% OFF',
    code: 'NHCARE45',
    badge: 'Special Patient Offer',
    price: '₹999',
    originalPrice: '₹1,800',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    ctaText: 'Claim 45% Off Voucher',
    ctaLink: 'Comprehensive Full Body Checkup (45% OFF - ₹999)',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'promo-referral-1',
    type: 'referral',
    title: 'Give ₹250, Get ₹250 Care Credits',
    description: 'Invite friends & family. They save ₹250 on their first doorstep service, and you receive ₹250 credited directly to your Nhealth Wallet.',
    discount: 'GIVE ₹250 • EARN ₹250',
    code: 'NH-HEALTH250',
    badge: 'Refer & Earn ₹250',
    price: '₹250',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
    ctaText: 'View Care Rewards & Wallet',
    ctaLink: 'rewards',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const getStoredPromotions = (): PromotionItem[] => {
  if (typeof window === 'undefined') return DEFAULT_PROMOTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROMOTIONS));
      return DEFAULT_PROMOTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PROMOTIONS;
  } catch {
    return DEFAULT_PROMOTIONS;
  }
};

export const saveStoredPromotions = (items: PromotionItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('nhealth_promotions_updated', { detail: items }));
  } catch (e) {
    console.error('Failed to save promotional items:', e);
  }
};

export const addStoredPromotion = (item: Omit<PromotionItem, 'id' | 'order' | 'createdAt' | 'updatedAt'>): PromotionItem => {
  const current = getStoredPromotions();
  const newItem: PromotionItem = {
    ...item,
    id: `promo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    order: current.length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [...current, newItem];
  saveStoredPromotions(updated);
  return newItem;
};

export const updateStoredPromotion = (id: string, updates: Partial<PromotionItem>): PromotionItem[] => {
  const current = getStoredPromotions();
  const updated = current.map((p) =>
    p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
  );
  saveStoredPromotions(updated);
  return updated;
};

export const deleteStoredPromotion = (id: string): PromotionItem[] => {
  const current = getStoredPromotions();
  const updated = current.filter((p) => p.id !== id);
  saveStoredPromotions(updated);
  return updated;
};

export const toggleStoredPromotionActive = (id: string): PromotionItem[] => {
  const current = getStoredPromotions();
  const updated = current.map((p) =>
    p.id === id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p
  );
  saveStoredPromotions(updated);
  return updated;
};

export const resetStoredPromotions = (): PromotionItem[] => {
  saveStoredPromotions(DEFAULT_PROMOTIONS);
  return DEFAULT_PROMOTIONS;
};

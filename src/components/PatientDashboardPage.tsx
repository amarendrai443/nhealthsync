import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Stethoscope,
  TestTube2,
  Car,
  HeartPulse,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  FileText,
  CreditCard,
  Settings,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Bell,
  Search,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Home,
  LogOut,
  MapPin,
  Heart,
  Plus,
  Sun,
  Moon,
  Gift,
  Folder,
  HelpCircle,
  Info,
  FileCheck,
  Lock,
  Copy,
  Share2,
  Upload
} from 'lucide-react';
import { UserAccount, ConfirmedBooking } from '../types/serviceBooking';
import { AdBannerItem, getActiveBanners } from '../utils/advertisingStorage';
import { navHistory } from '../utils/navigationHistory';
import { EXTRACTED_SERVICES } from '../data/servicesData';
import { generateVitalLensPDF } from '../utils/vitalReportGenerator';
import { generateInvoicePDF, InvoiceData } from '../utils/invoicePdfGenerator';
import { getStoredVitalScans, getStoredInvoices, CompactVitalScan } from '../utils/patientStorage';
import { VitalMetricsResult, VitalLensUserData } from '../types/vitalLens';
import { SymptomDoctorFinder } from './SymptomDoctorFinder';

// Realistic vector wallet logo with multi-tone leather gradient, fine perimeter stitching, card slots & metallic snap clasp
export const RealisticWalletLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      {/* Rich multi-tone leather gradient */}
      <linearGradient id="nhRealisticWalletLeather" x1="3" y1="6" x2="29" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9a5b13" />
        <stop offset="30%" stopColor="#783e0c" />
        <stop offset="70%" stopColor="#5a2e0a" />
        <stop offset="100%" stopColor="#3d1d05" />
      </linearGradient>

      {/* Leather Flap Gradient */}
      <linearGradient id="nhRealisticWalletFlap" x1="16" y1="12" x2="30" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a7681b" />
        <stop offset="50%" stopColor="#82430d" />
        <stop offset="100%" stopColor="#4c2206" />
      </linearGradient>

      {/* 3D Gold Metallic Snap Clasp */}
      <radialGradient id="nhRealisticWalletGoldClasp" cx="24.8" cy="15.8" r="2.8" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#facc15" />
        <stop offset="80%" stopColor="#ca8a04" />
        <stop offset="100%" stopColor="#713f12" />
      </radialGradient>

      {/* Inserted Credit Cards Gradients */}
      <linearGradient id="nhWalletCardCyan" x1="7" y1="3" x2="23" y2="9" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="nhWalletCardTeal" x1="5" y1="5.5" x2="21" y2="11" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2dd4bf" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>

      {/* Drop Shadow */}
      <filter id="nhWalletShadow" x="1" y="4" width="30" height="26" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="1.2" stdDeviation="1" floodColor="#000000" floodOpacity="0.4" />
      </filter>
    </defs>

    {/* Rear Credit Card (Sky Blue) */}
    <rect x="8.5" y="4" width="15" height="7" rx="1.6" fill="url(#nhWalletCardCyan)" />
    <line x1="8.5" y1="6.8" x2="23.5" y2="6.8" stroke="#0369a1" strokeWidth="0.8" opacity="0.7" />

    {/* Front Credit Card (Teal with EMV Chip) */}
    <rect x="5.5" y="6.2" width="16" height="7.5" rx="1.6" fill="url(#nhWalletCardTeal)" />
    <rect x="7.2" y="7.8" width="2.6" height="2" rx="0.4" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.3" />

    {/* Main Leather Body */}
    <rect
      x="2.5"
      y="8.5"
      width="27"
      height="18"
      rx="3.5"
      fill="url(#nhRealisticWalletLeather)"
      filter="url(#nhWalletShadow)"
    />

    {/* Top Leather Fold Edge Highlight */}
    <path
      d="M3 11C3 9.62 4.12 8.5 5.5 8.5H26.5C27.88 8.5 29 9.62 29 11V11.8H3V11Z"
      fill="#ca8a04"
      fillOpacity="0.25"
    />

    {/* Perimeter Stitching Line (Realistic fine dashed thread) */}
    <rect
      x="4"
      y="10"
      width="24"
      height="15"
      rx="2.5"
      fill="none"
      stroke="#fef08a"
      strokeWidth="0.55"
      strokeDasharray="1.2 0.9"
      strokeOpacity="0.65"
    />

    {/* Center fold crease line */}
    <path
      d="M3 17.5C10 18 20 17 29 17.5"
      stroke="#1f0f03"
      strokeWidth="0.5"
      strokeOpacity="0.55"
    />

    {/* Flap Closure Tab */}
    <path
      d="M17 13H27.5C28.88 13 30 14.12 30 15.5V16.5C30 17.88 28.88 19 27.5 19H17C16.17 19 15.5 18.33 15.5 17.5V14.5C15.5 13.67 16.17 13 17 13Z"
      fill="url(#nhRealisticWalletFlap)"
      stroke="#361804"
      strokeWidth="0.4"
    />

    {/* Stitching on Flap */}
    <path
      d="M17.5 14.2H27.2C27.9 14.2 28.6 14.8 28.6 15.5V16.5C28.6 17.2 27.9 17.8 27.2 17.8H17.5"
      fill="none"
      stroke="#fef08a"
      strokeWidth="0.5"
      strokeDasharray="0.9 0.8"
      strokeOpacity="0.6"
    />

    {/* 3D Metallic Clasp Button */}
    <circle cx="24.8" cy="16" r="2.2" fill="url(#nhRealisticWalletGoldClasp)" stroke="#78350f" strokeWidth="0.35" />
    <circle cx="24.8" cy="16" r="0.9" fill="#713f12" />
    <circle cx="24.6" cy="15.7" r="0.4" fill="#ffffff" fillOpacity="0.85" />
  </svg>
);

export const ModernWalletIcon = RealisticWalletLogo;

interface PatientDashboardPageProps {
  currentUser?: UserAccount | null;
  bookingHistory?: ConfirmedBooking[];
  onNavigateHome: () => void;
  onOpenBookingModal?: (serviceType: string) => void;
  onOpenVitalLens?: () => void;
  onLogout?: () => void;
}

type DashboardTab =
  | 'overview'
  | 'symptom-finder'
  | 'quick-booking'
  | 'history'
  | 'vital-lens'
  | 'records'
  | 'invoices'
  | 'rewards'
  | 'help'
  | 'about'
  | 'terms'
  | 'privacy'
  | 'profile';

export interface PromoSlideItem {
  id: number;
  tag: string;
  tagColor: string;
  title: string;
  desc: string;
  cta: string;
  badge: string;
  gradient: string;
  serviceTarget: string;
  isCustom?: boolean;
  customImage?: string;
  scale?: number;
  imageFit?: 'cover' | 'contain';
  heightMode?: string;
}

const PROMO_SLIDES: PromoSlideItem[] = [
  {
    id: 1,
    tag: 'EXCLUSIVE OFFER',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'Comprehensive Full Body Checkup at Home',
    desc: '72 vital bio-markers including CBC, Lipid, Thyroid & HbA1c with doorstep sample collection.',
    cta: 'Book for ₹999 (Flat 45% OFF)',
    badge: 'Same-day NABL Certified Reports',
    gradient: 'from-cyan-900/80 via-[#002b49] to-blue-950/90',
    serviceTarget: 'Home diagnostics & lab tests',
  },
  {
    id: 2,
    tag: 'EMERGENCY / RAPID',
    tagColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    title: '24/7 Rapid Ambulance & Emergency Doctor Visit',
    desc: 'Direct dispatch to your doorstep within 15-30 minutes across Hyderabad & Secunderabad.',
    cta: 'Call SOS: 919581582220',
    badge: 'GPS Tracked Advanced Life Support',
    gradient: 'from-rose-950/80 via-[#2d0914] to-slate-950/90',
    serviceTarget: 'Ambulance & medical transport',
  },
  {
    id: 3,
    tag: 'AI VITAL SCAN',
    tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    title: 'Nhealth Vital Lens™ Camera Vitals Checkup',
    desc: 'Measure Heart Rate, HRV, Respiration & Stress Index in 30 seconds using your smartphone camera.',
    cta: 'Scan Vitals Now (Free)',
    badge: 'Zero Equipment Required',
    gradient: 'from-purple-950/80 via-[#1e0a38] to-slate-950/90',
    serviceTarget: 'vital-lens',
  },
  {
    id: 4,
    tag: 'SPECIALIZED CARE',
    tagColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    title: 'Elderly Bedside Attendant & Post-Op Nursing',
    desc: 'Certified compassionate nursing attendants for medication management, vitals & mobility care.',
    cta: 'Request Caregiver Visit',
    badge: '100% Background-Verified Staff',
    gradient: 'from-teal-950/80 via-[#00262b] to-slate-950/90',
    serviceTarget: 'Specialized nursing care at home',
  },
];

export interface ResponsiveBannerCarouselProps {
  sectionKey: 'section1' | 'section2';
  sectionLabel: string;
  banners: AdBannerItem[];
  onServiceClick: (serviceTarget: string) => void;
  accentBadge?: string;
}

export const ResponsiveBannerCarousel: React.FC<ResponsiveBannerCarouselProps> = ({
  sectionKey,
  sectionLabel,
  banners,
  onServiceClick,
  accentBadge,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    setCurrentIdx((prev) => (banners.length > 0 && prev >= banners.length ? 0 : prev));
  }, [banners.length]);

  // Smooth auto-play carousel cycle (3-6s per slide), pauses on hover
  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    const intervalSec = banners[currentIdx]?.autoPlayInterval || 4.5;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % banners.length);
    }, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [banners.length, currentIdx, isHovered]);

  if (banners.length === 0) return null;

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {sectionLabel}
        </span>
        <div className="flex items-center gap-2">
          {accentBadge && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-cyan-200 border border-white/10 hidden sm:inline">
              {accentBadge}
            </span>
          )}
          {banners.length > 1 && (
            <span className="text-[10px] text-slate-400 font-semibold font-mono">
              {currentIdx + 1}/{banners.length}
            </span>
          )}
        </div>
      </div>

      {/* Strict 4:1 Responsive Banner Frame across Desktop, Tablet & Mobile */}
      <section
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX === null) return;
          const diff = touchStartX - e.changedTouches[0].clientX;
          if (diff > 40) {
            setCurrentIdx((prev) => (prev + 1) % banners.length);
          } else if (diff < -40) {
            setCurrentIdx((prev) => (prev - 1 + banners.length) % banners.length);
          }
          setTouchStartX(null);
        }}
        style={{ aspectRatio: '4 / 1', width: '100%' }}
        className="relative w-full aspect-[4/1] overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-cyan-500/30 shadow-xl bg-[#001424] select-none"
      >
        {banners.map((banner, idx) => {
          const isCurrent = idx === currentIdx;
          return (
            <div
              key={banner.id}
              aria-hidden={!isCurrent}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isCurrent ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Banner Image */}
              {banner.imageUrl ? (
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    style={{
                      transform: `scale(${(banner.scale || 100) / 100})`,
                      transformOrigin: 'center center',
                    }}
                    className={`w-full h-full ${
                      banner.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#001424]/95 via-[#001424]/75 to-[#001424]/30 pointer-events-none" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-[#00172d] to-[#002b49]" />
              )}

              {/* Responsive Content Layer scaled to 4:1 across all devices */}
              <div className="relative z-10 h-full p-2.5 sm:p-5 md:p-6 lg:p-7 flex flex-col justify-between max-w-3xl">
                <div className="space-y-0.5 sm:space-y-1.5 md:space-y-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2.5 py-0.2 sm:py-0.5 rounded-full border bg-cyan-500/20 text-cyan-300 border-cyan-500/40 uppercase tracking-wider backdrop-blur-xs">
                      {banner.tag || 'FEATURED'}
                    </span>
                    <span className="text-[9px] sm:text-xs font-semibold text-cyan-200 hidden md:inline">
                      Nhealth Verified Campaign
                    </span>
                  </div>
                  <h2 className="text-xs sm:text-lg md:text-xl lg:text-2xl font-black text-white tracking-tight drop-shadow-md line-clamp-1 sm:line-clamp-2">
                    {banner.title}
                  </h2>
                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-200 drop-shadow line-clamp-1 sm:line-clamp-2 max-w-xl leading-relaxed hidden xs:block">
                    {banner.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onServiceClick(banner.ctaLink)}
                    className="px-2.5 py-1 sm:px-4 sm:py-1.5 md:px-5 md:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-[#001424] font-black text-[10px] sm:text-xs md:text-sm shadow-xl shadow-cyan-950/60 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5"
                  >
                    <span>{banner.ctaText || 'Book Now'}</span>
                    <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Prev / Next Buttons */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIdx((prev) => (prev - 1 + banners.length) % banners.length);
              }}
              aria-label="Previous Slide"
              className="absolute left-1.5 sm:left-2.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs border border-white/20 flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIdx((prev) => (prev + 1) % banners.length);
              }}
              aria-label="Next Slide"
              className="absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs border border-white/20 flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Dot Navigation Indicators */}
            <div className="absolute bottom-1.5 sm:bottom-2.5 right-2 sm:right-4 z-20 flex items-center gap-1 sm:gap-1.5 bg-black/40 backdrop-blur-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/10">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1 sm:h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIdx === idx ? 'w-4 sm:w-6 bg-cyan-400' : 'w-1 sm:w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export const PatientDashboardPage: React.FC<PatientDashboardPageProps> = ({
  currentUser,
  bookingHistory = [],
  onNavigateHome,
  onOpenBookingModal,
  onOpenVitalLens,
  onLogout,
}) => {
  const VALID_TABS: DashboardTab[] = [
    'overview',
    'symptom-finder',
    'quick-booking',
    'history',
    'vital-lens',
    'records',
    'invoices',
    'rewards',
    'help',
    'about',
    'terms',
    'privacy',
    'profile',
  ];

  // Refresh State Persistence: restore active tab from URL hash or sessionStorage
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as DashboardTab;
      if (hash && VALID_TABS.includes(hash)) return hash;
      const saved = sessionStorage.getItem('nhealth_patient_tab') as DashboardTab;
      if (saved && VALID_TABS.includes(saved)) return saved;
    }
    return 'overview';
  });

  const handleSelectTab = (tab: DashboardTab) => {
    if (tab === activeTab) return;
    try {
      sessionStorage.setItem('nhealth_patient_tab', tab);
      window.history.pushState({ isPatientTab: true, tab }, '', `/patient-dashboard#${tab}`);
    } catch {}
    setActiveTab(tab);
  };

  // Step-by-step sub-tab navigation on browser Back button
  useEffect(() => {
    const handleTabPopState = (e: PopStateEvent) => {
      if (navHistory.hasOpenModals()) return;
      const hash = window.location.hash.replace('#', '') as DashboardTab;
      if (e.state?.isPatientTab && e.state.tab && VALID_TABS.includes(e.state.tab)) {
        setActiveTab(e.state.tab);
        sessionStorage.setItem('nhealth_patient_tab', e.state.tab);
      } else if (hash && VALID_TABS.includes(hash)) {
        setActiveTab(hash);
        sessionStorage.setItem('nhealth_patient_tab', hash);
      } else if (activeTab !== 'overview') {
        setActiveTab('overview');
        sessionStorage.setItem('nhealth_patient_tab', 'overview');
      }
    };
    window.addEventListener('popstate', handleTabPopState);
    return () => window.removeEventListener('popstate', handleTabPopState);
  }, [activeTab]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentPromoIdx, setCurrentPromoIdx] = useState(0);

  // Dynamic Active Advertising Banners synchronized with Admin Campaign updates
  const [activeBanners, setActiveBanners] = useState<AdBannerItem[]>(getActiveBanners);

  const section1Banners = useMemo(
    () => activeBanners.filter((b) => b.section === 'section1'),
    [activeBanners]
  );
  const section2Banners = useMemo(
    () => activeBanners.filter((b) => b.section === 'section2'),
    [activeBanners]
  );

  useEffect(() => {
    const handleSync = () => {
      const active = getActiveBanners();
      setActiveBanners(active);
    };
    window.addEventListener('nhealth_banners_updated', handleSync);
    window.addEventListener('nhealth_banner_updated', handleSync);
    return () => {
      window.removeEventListener('nhealth_banners_updated', handleSync);
      window.removeEventListener('nhealth_banner_updated', handleSync);
    };
  }, []);

  // Light / Dark Theme Toggle (Light mode is default with clean white background)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nhealth_dashboard_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light'; // Clean white background by default
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('nhealth_dashboard_theme', next);
      } catch {}
      return next;
    });
  };

  const isDark = theme === 'dark';

  // Ultra-low storage data persistence states (<2 KB per JSON text record)
  const [storedScans, setStoredScans] = useState<CompactVitalScan[]>(getStoredVitalScans);
  const [storedInvoices, setStoredInvoices] = useState<InvoiceData[]>(getStoredInvoices);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Header Quick Actions: Wallet & Notifications
  const [walletOpen, setWalletOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(500);
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    if (walletOpen) {
      return navHistory.pushModal('patient-wallet-modal', 'Health Wallet', () => setWalletOpen(false));
    }
  }, [walletOpen]);

  useEffect(() => {
    if (notificationsOpen) {
      return navHistory.pushModal('patient-notifications-modal', 'Notifications', () => setNotificationsOpen(false));
    }
  }, [notificationsOpen]);

  useEffect(() => {
    if (mobileSidebarOpen) {
      return navHistory.pushModal('patient-mobile-sidebar', 'Menu Drawer', () => setMobileSidebarOpen(false));
    }
  }, [mobileSidebarOpen]);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Doorstep Care Scheduled',
      message: 'Your diagnostics visit has been confirmed. A certified phlebotomist will arrive with sterile equipment.',
      time: '10 mins ago',
      read: false,
      tag: 'Booking',
    },
    {
      id: 2,
      title: 'Vital Lens Report Ready',
      message: 'Your latest optical biometrics face scan has been processed with normal HRV & physiological metrics.',
      time: '1 hour ago',
      read: false,
      tag: 'Vitals',
    },
    {
      id: 3,
      title: 'Welcome Cashback Credited',
      message: '₹250 promo cashback credited to your Nhealth Health Wallet! Use on any home healthcare booking.',
      time: 'Yesterday',
      read: false,
      tag: 'Wallet',
    },
  ]);

  // Auto-sync stored data when scans or bookings are created
  useEffect(() => {
    const handleVitalsUpdate = () => setStoredScans(getStoredVitalScans());
    const handleInvoicesUpdate = () => setStoredInvoices(getStoredInvoices());

    window.addEventListener('nhealth_vital_scans_updated', handleVitalsUpdate);
    window.addEventListener('nhealth_invoices_updated', handleInvoicesUpdate);

    return () => {
      window.removeEventListener('nhealth_vital_scans_updated', handleVitalsUpdate);
      window.removeEventListener('nhealth_invoices_updated', handleInvoicesUpdate);
    };
  }, []);

  // Auto rotate top promo banner every 6.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromoIdx((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const patientName = currentUser?.name || 'Ramesh Kumar';
  const patientPhone = currentUser?.phone || '9876543210';
  const patientEmail = currentUser?.email || 'patient@nhealth.in';

  // Dynamic Client-Side PDF Generation for Vital Lens Report via jsPDF
  const handleDownloadVitalPDF = async (scan: CompactVitalScan) => {
    setDownloadingId(scan.id);
    try {
      const metrics: VitalMetricsResult = {
        heartRate: scan.heartRate,
        respirationRate: scan.respirationRate,
        oxygenSaturation: scan.oxygenSaturation,
        bloodPressureSystolic: scan.bloodPressureSystolic,
        bloodPressureDiastolic: scan.bloodPressureDiastolic,
        sdnn: scan.sdnn,
        rmssd: Math.round(scan.sdnn * 0.72),
        pnn50: 18,
        cardiacOutput: 4.8,
        meanArterialPressure: Math.round((scan.bloodPressureSystolic + 2 * scan.bloodPressureDiastolic) / 3),
        heartUtilized: 68,
        mentalWellbeingScore: scan.mentalWellbeingScore,
        stressLevel: scan.stressLevel as any,
        ansBalanceRatio: 1.2,
        ansStatus: 'Balanced',
        bmi: scan.bmi,
        bmiStatus: 'Normal',
        bloodVolumeLiters: 4.9,
        totalBloodWaterLiters: 2.8,
        bodyWaterPercentage: 58,
        totalBodyFatPercentage: 19,
        bodyWeightKg: 68,
        scanTimestamp: scan.scanTimestamp,
      };

      const userData: VitalLensUserData = {
        fullName: scan.fullName || patientName,
        mobileNumber: scan.mobileNumber || patientPhone,
        pincode: '500033',
        gender: (scan.gender as any) || 'Male',
        age: scan.age || 38,
        heightCm: 172,
        weightKg: 68,
        heightUnit: 'cm',
        weightUnit: 'kg',
      };

      await generateVitalLensPDF(metrics, userData, true);
    } catch (err) {
      console.error('Error generating Vital Lens PDF:', err);
      alert('Unable to generate Vital Lens PDF report. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Dynamic Client-Side PDF Generation for Invoices via jsPDF
  const handleDownloadInvoicePDF = (inv: InvoiceData) => {
    setDownloadingId(inv.id);
    try {
      generateInvoicePDF(inv, true);
    } catch (err) {
      console.error('Error generating Invoice PDF:', err);
      alert('Unable to generate invoice PDF. Please try again.');
    } finally {
      setTimeout(() => setDownloadingId(null), 500);
    }
  };

  // Dynamic Client-Side PDF Generation for Booking Receipt via jsPDF
  const handleDownloadBookingPDF = (booking: ConfirmedBooking) => {
    setDownloadingId(booking.referenceId);
    try {
      const invData: InvoiceData = {
        id: `INV-${booking.referenceId.replace(/[^a-zA-Z0-9]/g, '')}`,
        orderNumber: `ORD-${booking.referenceId.slice(-4)}`,
        serviceName: booking.serviceName,
        date: booking.preferredDate || new Date(booking.bookedAt || Date.now()).toLocaleDateString('en-IN'),
        time: booking.preferredTimeSlot || 'Morning (09:00 AM - 12:00 PM)',
        amount: '₹750',
        numericAmount: 750,
        status: booking.status === 'Confirmed' ? 'Paid' : 'Completed',
        patientName: booking.patientName,
        patientPhone: booking.phone,
        patientAddress: booking.address,
        doctorOrSpecialist: 'Nhealth Certified Healthcare Clinician',
        paymentMethod: 'Online Prepaid (Confirmed)',
      };
      generateInvoicePDF(invData, true);
    } catch (err) {
      console.error('Error generating booking receipt PDF:', err);
      alert('Unable to generate receipt PDF. Please try again.');
    } finally {
      setTimeout(() => setDownloadingId(null), 500);
    }
  };

  const handleServiceClick = (service: string) => {
    if (service === 'vital-lens') {
      if (onOpenVitalLens) onOpenVitalLens();
    } else if (onOpenBookingModal) {
      onOpenBookingModal(service);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity, badge: null },
    { id: 'symptom-finder', label: 'AI Symptom & Doctor Finder', icon: Sparkles, badge: 'AI' },
    { id: 'quick-booking', label: 'Quick Booking', icon: Calendar, badge: '16 Services' },
    { id: 'history', label: 'Service & Booking History', icon: Clock, badge: bookingHistory.length > 0 ? bookingHistory.length.toString() : null },
    { id: 'vital-lens', label: 'Vital Lens Scans', icon: HeartPulse, badge: `${storedScans.length} Scans` },
    { id: 'records', label: 'My Records', icon: Folder, badge: 'Vault' },
    { id: 'invoices', label: 'Invoices & Orders', icon: CreditCard, badge: `${storedInvoices.length} Paid` },
    { id: 'rewards', label: 'Referral & Rewards', icon: Gift, badge: '₹250' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, badge: '24/7' },
    { id: 'about', label: 'About Nhealth', icon: Info, badge: null },
    { id: 'terms', label: 'Terms & Conditions', icon: FileCheck, badge: null },
    { id: 'privacy', label: 'Privacy Policy', icon: Lock, badge: null },
    { id: 'profile', label: 'Profile Settings', icon: Settings, badge: null },
  ];

  return (
    <div className={`h-screen w-full flex flex-col font-sans selection:bg-[#008080] selection:text-white overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#001424] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* 1. FROZEN TOP HEADER: Sticky navigation header fixed in place */}
      <header
        style={{ position: 'sticky', top: 0, zIndex: 1000 }}
        className={`w-full backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-xs shrink-0 transition-colors duration-200 ${
          isDark
            ? 'bg-[#00172d]/98 border-b border-cyan-900/40 text-slate-100'
            : 'bg-white border-b border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {/* Mobile & Tablet Sidebar Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className={`lg:hidden p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar width"
            className={`hidden lg:flex p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Identity: Official Nhealth Logo & Caption (Clicks stay within Patient Dashboard) */}
          <div
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
            title="Nhealth Patient Dashboard (Overview)"
          >
            {/* Official Nhealth Logo from https://ibb.co/SDYB7XbW - Clean without separate icon next to name */}
            <img
              src="https://i.ibb.co/JW6HFRV0/Nhealth-logo-8cm-x-8cm-high-quality-1-1.png"
              alt="Nhealth Official Logo"
              className="h-8 sm:h-9 md:h-10 w-auto object-contain rounded-lg shrink-0 group-hover:scale-105 transition-transform shadow-xs"
              onError={(e) => {
                e.currentTarget.src = 'https://i.ibb.co/wZG4rNV3/Nhealth-logo-8cm-x-8cm-high-quality-1-1.png';
              }}
            />
            <div className="flex flex-col min-w-0">
              <span className={`text-base sm:text-lg font-black tracking-tight leading-tight transition-colors ${
                isDark ? 'text-white group-hover:text-cyan-300' : 'text-[#002b49] group-hover:text-[#008080]'
              }`}>
                Nhealth<span className={isDark ? 'text-cyan-400' : 'text-[#008080]'}>™</span>
              </span>
              <span className={`hidden sm:inline text-[10px] sm:text-xs font-medium tracking-tight truncate ${
                isDark ? 'text-slate-300' : 'text-slate-500'
              }`}>
                Unified &amp; At-Home Healthcare Network
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 1. WALLET ICON (Visible on all screens: small round icon with realistic wallet logo) */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setWalletOpen((prev) => !prev);
                setNotificationsOpen(false);
              }}
              title={`Nhealth Care Wallet (₹${walletBalance})`}
              aria-label="Nhealth Care Wallet"
              className={`relative p-2 rounded-full border transition-all cursor-pointer shrink-0 shadow-xs flex items-center justify-center ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-cyan-800/40 hover:border-amber-400/50'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-amber-400/50'
              }`}
            >
              <RealisticWalletLogo className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
              {walletBalance > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#00172d]" />
              )}
            </button>

            {/* Wallet Dropdown Popover */}
            {walletOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl p-4 shadow-2xl border z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isDark ? 'bg-[#00172d] border-cyan-800/60 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xl'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-xs">
                      <RealisticWalletLogo className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-tight">Nhealth Care Wallet</h4>
                      <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Instant cashback &amp; credits</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWalletOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className={`mt-3 p-3 rounded-xl border text-center ${
                  isDark ? 'bg-cyan-950/40 border-cyan-800/40' : 'bg-emerald-50/80 border-emerald-200'
                }`}>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-cyan-400' : 'text-emerald-700'}`}>Available Balance</span>
                  <div className={`text-2xl font-black font-mono mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                    ₹{walletBalance}.00
                  </div>
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Usable on doctor visits, diagnostics &amp; lab checkups
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  <div className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Recent Transactions</div>
                  <div className={`p-2 rounded-lg flex items-center justify-between text-xs ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div>
                      <div className="font-semibold text-[11px]">Welcome Care Credit</div>
                      <div className="text-[9px] text-slate-400">Promotional bonus</div>
                    </div>
                    <span className="text-emerald-500 font-bold font-mono text-[11px]">+₹250</span>
                  </div>
                  <div className={`p-2 rounded-lg flex items-center justify-between text-xs ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div>
                      <div className="font-semibold text-[11px]">Referral Bonus</div>
                      <div className="text-[9px] text-slate-400">Friend signup reward</div>
                    </div>
                    <span className="text-emerald-500 font-bold font-mono text-[11px]">+₹250</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWalletBalance((prev) => prev + 500);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:brightness-110 shadow-sm cursor-pointer"
                  >
                    + Add ₹500
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletOpen(false);
                      setActiveTab('quick-booking');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      isDark ? 'border-cyan-800 hover:bg-white/5 text-cyan-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Use Credits
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* HEADER QUICK ACTION: NOTIFICATIONS */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                setWalletOpen(false);
              }}
              title="Notifications"
              aria-label="Notifications"
              className={`relative p-2 rounded-full border text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-cyan-800/40'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Popover */}
            {notificationsOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl p-4 shadow-2xl border z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isDark ? 'bg-[#00172d] border-cyan-800/60 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xl'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-tight">Patient Notifications</h4>
                      <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time care updates</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                      className="text-[10px] text-teal-500 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
                      }}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        item.read
                          ? isDark ? 'bg-white/5 border-transparent text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                          : isDark ? 'bg-cyan-950/40 border-cyan-800/50 text-slate-200' : 'bg-teal-50/50 border-teal-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                          {item.tag}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.time}</span>
                      </div>
                      <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h5>
                      <p className="text-[11px] leading-relaxed mt-0.5">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. LIGHT / DARK THEME TOGGLE SWITCH (Always visible across mobile, tablet, and desktop) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Light/Dark Theme"
            className={`inline-flex items-center justify-center p-2 sm:px-2.5 sm:py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs ${
              isDark
                ? 'bg-cyan-950/70 hover:bg-cyan-900/80 text-amber-300 border-amber-400/40'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden xl:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden xl:inline">Dark</span>
              </>
            )}
          </button>

          {/* DESKTOP-ONLY HEADER ACTIONS (Strictly hidden on Mobile & Tablet <= 1024px to guarantee clean fit) */}
          {/* 24/7 Emergency SOS Badge (Desktop Only) */}
          <a
            href="https://wa.me/919581582220?text=EMERGENCY%20MEDICAL%20SUPPORT%3A%20I%20need%20immediate%20emergency%20care%20assistance."
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-500 dark:text-red-300 border border-red-500/40 text-xs font-bold transition-all animate-pulse shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>24/7 SOS</span>
          </a>

          {/* Scan Vitals Button (Desktop Only) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onOpenVitalLens) {
                onOpenVitalLens();
              }
            }}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/25 hover:from-purple-600/50 hover:to-pink-600/40 text-purple-700 dark:text-purple-200 hover:text-purple-900 dark:hover:text-white border border-purple-400/40 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            title="Instant Camera Vitals Scan"
          >
            <HeartPulse className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300 animate-pulse shrink-0" />
            <span>Scan Vitals</span>
          </button>

          {/* User Profile Pill (Desktop Only) */}
          <div className={`hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-full border shrink-0 ${
            isDark ? 'bg-white/5 border-cyan-800/40 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#008080] to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {patientName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left pr-1">
              <span className={`text-xs font-bold leading-tight truncate max-w-[120px] ${
                isDark ? 'text-white' : 'text-[#002b49]'
              }`}>
                {patientName}
              </span>
              <span className={`text-[10px] font-mono ${
                isDark ? 'text-cyan-300' : 'text-teal-700'
              }`}>
                {patientPhone}
              </span>
            </div>
          </div>

          {/* Reliable Logout Button (Desktop Only) */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-white border border-red-500/30 text-xs font-bold transition-colors cursor-pointer shrink-0"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Dashboard Layout Container: Header & Left Panel Frozen in Desktop View */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 3. LEFT VERTICAL SIDEBAR: Collapsible navigation menu */}
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col shrink-0 border-r transition-all duration-300 ${
            isDark ? 'bg-[#00172d] border-cyan-950' : 'bg-white border-slate-200'
          } ${sidebarOpen ? 'w-64' : 'w-20'}`}
        >
          <div className="h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden flex flex-col justify-between p-3 space-y-4">
            <div className="space-y-1">
              <div className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-cyan-400/80' : 'text-slate-400'
              }`}>
                {sidebarOpen ? 'Patient Navigation' : '• • •'}
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id as DashboardTab)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-gradient-to-r from-cyan-600/30 to-teal-600/20 text-white font-bold border border-cyan-500/40 shadow-lg shadow-cyan-950'
                          : 'bg-teal-50 text-[#008080] font-bold border border-teal-200 shadow-xs'
                        : isDark
                        ? 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? isDark ? 'text-cyan-400' : 'text-[#008080]'
                        : isDark ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                    {sidebarOpen && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {sidebarOpen && item.badge && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? isDark ? 'bg-cyan-400 text-[#001424]' : 'bg-[#008080] text-white'
                          : isDark ? 'bg-white/10 text-cyan-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sidebar Bottom Card */}
            {sidebarOpen && (
              <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                isDark
                  ? 'bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border-cyan-800/40 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className={`flex items-center gap-2 font-bold ${isDark ? 'text-cyan-300' : 'text-[#002b49]'}`}>
                  <ShieldCheck className="w-4 h-4 text-teal-500" />
                  <span>24/7 Care Concierge</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Need immediate home nurse or medicine refill? Contact support.
                </p>
                <a
                  href="tel:9393934621"
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold transition-colors ${
                    isDark ? 'text-teal-300 hover:text-white' : 'text-[#008080] hover:text-teal-800'
                  }`}
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>9393934621</span>
                </a>
              </div>
            )}

            {/* Sidebar Logout Action */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-white border border-red-500/30 text-xs font-bold transition-colors cursor-pointer shrink-0"
                title="Sign Out of Patient Dashboard"
              >
                <LogOut className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                {sidebarOpen && <span>Sign Out</span>}
              </button>
            )}
          </div>
        </aside>

        {/* Mobile Slide-over Drawer for Sidebar */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-[1100] flex">
            {/* Backdrop */}
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            />
            {/* Drawer Body */}
            <div className="relative w-72 max-w-[85vw] bg-[#00172d] border-r border-cyan-900/40 h-full overflow-y-auto flex flex-col justify-between p-4 shadow-2xl z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://i.ibb.co/JW6HFRV0/Nhealth-logo-8cm-x-8cm-high-quality-1-1.png"
                      alt="Nhealth Logo"
                      className="h-7 w-auto object-contain rounded"
                      onError={(e) => {
                        e.currentTarget.src = 'https://i.ibb.co/wZG4rNV3/Nhealth-logo-8cm-x-8cm-high-quality-1-1.png';
                      }}
                    />
                    <span className="text-sm font-black text-cyan-300 tracking-wider uppercase">
                      Patient Menu
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          handleSelectTab(item.id as DashboardTab);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-600/30 to-teal-600/20 text-white font-bold border border-cyan-500/40'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Drawer Logout Action (Replaces Back to Home) */}
              <div className="pt-4 border-t border-cyan-900/40">
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-xs font-bold text-red-300 border border-red-500/30 transition-colors cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Logout / Exit Session</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* 2. DUAL INDEPENDENT 4:1 BANNER SECTIONS (SECTION 1 ON TOP, SECTION 2 DIRECTLY BELOW) */}
          {activeTab === 'overview' && (section1Banners.length > 0 || section2Banners.length > 0) && (
            <div className="space-y-4 sm:space-y-5">
              {section1Banners.length > 0 && (
                <ResponsiveBannerCarousel
                  sectionKey="section1"
                  sectionLabel="Banner Section 1"
                  accentBadge="Top Carousel • 4:1 Ratio"
                  banners={section1Banners}
                  onServiceClick={handleServiceClick}
                />
              )}
              {section2Banners.length > 0 && (
                <ResponsiveBannerCarousel
                  sectionKey="section2"
                  sectionLabel="Banner Section 2"
                  accentBadge="Bottom Carousel • 4:1 Ratio"
                  banners={section2Banners}
                  onServiceClick={handleServiceClick}
                />
              )}
            </div>
          )}

          {/* DASHBOARD TAB CONTENT */}
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Metric Quick Stats: Responsive 4x4 grid on mobile/tab view */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs space-y-1 sm:space-y-1.5 transition-all hover:shadow-md ${
                  isDark ? 'bg-[#001c36] border-cyan-900/40 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-cyan-500">
                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Upcoming Visits</span>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500" />
                    </div>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                    {bookingHistory.filter((b) => b.status === 'Confirmed').length || 1}
                  </div>
                  <span className="text-[10px] sm:text-xs text-emerald-500 font-semibold block truncate">Scheduled at Doorstep</span>
                </div>

                <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs space-y-1 sm:space-y-1.5 transition-all hover:shadow-md ${
                  isDark ? 'bg-[#001c36] border-cyan-900/40 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-purple-500">
                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Vital Health Score</span>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                      <HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                    </div>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>94 / 100</div>
                  <span className={`text-[10px] sm:text-xs font-semibold block truncate ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Optimal Cardio &amp; SpO2</span>
                </div>

                <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs space-y-1 sm:space-y-1.5 transition-all hover:shadow-md ${
                  isDark ? 'bg-[#001c36] border-cyan-900/40 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-teal-500">
                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Completed Services</span>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500" />
                    </div>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                    {bookingHistory.length || 3}
                  </div>
                  <span className="text-[10px] sm:text-xs text-teal-600 dark:text-teal-400 font-semibold block truncate">Diagnostics &amp; Care</span>
                </div>

                <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs space-y-1 sm:space-y-1.5 transition-all hover:shadow-md ${
                  isDark ? 'bg-[#001c36] border-cyan-900/40 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-amber-500">
                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Family Members</span>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                    </div>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>3 Covered</div>
                  <span className={`text-[10px] sm:text-xs font-semibold block truncate ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Self, Spouse, Parent</span>
                </div>
              </div>

              {/* Two Column Grid: Upcoming Schedule & Vitals Highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Next Scheduled Appointment */}
                <div className={`lg:col-span-2 p-5 sm:p-6 rounded-2xl border shadow-xs space-y-4 ${
                  isDark ? 'bg-[#00172d] border-cyan-900/40 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                      <Clock className="w-4 h-4 text-cyan-500" />
                      <span>Next Scheduled Doorstep Service</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('history')}
                      className="text-xs text-[#008080] dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  {bookingHistory.length > 0 ? (
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isDark ? 'bg-cyan-950/40 border-cyan-800/40' : 'bg-teal-50/60 border-teal-200'
                    }`}>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          {bookingHistory[0].status}
                        </span>
                        <div className={`text-sm font-bold pt-1 ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                          {bookingHistory[0].serviceName}
                        </div>
                        <div className={`text-xs flex items-center gap-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span>Ref: {bookingHistory[0].referenceId}</span>
                          <span>·</span>
                          <span>{bookingHistory[0].patientName}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectTab('history')}
                        className="px-4 py-2 rounded-lg bg-[#008080] hover:bg-[#006666] text-white font-bold text-xs cursor-pointer shrink-0"
                      >
                        Track Specialist
                      </button>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isDark ? 'bg-cyan-950/40 border-cyan-800/40' : 'bg-teal-50/60 border-teal-200'
                    }`}>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-teal-800 dark:text-cyan-300 border border-cyan-500/30">
                          Scheduled Today, 03:00 PM
                        </span>
                        <div className={`text-sm font-bold pt-1 ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                          Home Diagnostics &amp; Blood Sample Collection
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          Phlebotomist: Anil Verma (Vaccinated, NABL certified)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectTab('quick-booking')}
                        className="px-4 py-2 rounded-lg bg-[#008080] hover:bg-[#006666] text-white font-bold text-xs cursor-pointer shrink-0"
                      >
                        Book Another Service
                      </button>
                    </div>
                  )}

                  {/* Quick Action Category Shortcuts */}
                  <div className="pt-2">
                    <span className={`text-xs font-bold uppercase tracking-wider block mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Instant Healthcare Dispatch
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleServiceClick('Doctor home visits')}
                        className={`p-3 rounded-xl border text-left transition-colors cursor-pointer group ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 border-cyan-900/40'
                            : 'bg-slate-50 hover:bg-teal-50/50 border-slate-200'
                        }`}
                      >
                        <Stethoscope className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform mb-1.5" />
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#002b49]'}`}>Doctor Visit</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>At Home</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleServiceClick('Home diagnostics & lab tests')}
                        className={`p-3 rounded-xl border text-left transition-colors cursor-pointer group ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 border-cyan-900/40'
                            : 'bg-slate-50 hover:bg-teal-50/50 border-slate-200'
                        }`}
                      >
                        <TestTube2 className="w-5 h-5 text-teal-500 group-hover:scale-110 transition-transform mb-1.5" />
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#002b49]'}`}>Lab Tests</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sample Collection</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleServiceClick('Ambulance & medical transport')}
                        className={`p-3 rounded-xl border text-left transition-colors cursor-pointer group ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 border-cyan-900/40'
                            : 'bg-slate-50 hover:bg-teal-50/50 border-slate-200'
                        }`}
                      >
                        <Car className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform mb-1.5" />
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#002b49]'}`}>Ambulance</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Emergency SOS</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleServiceClick('Specialized nursing care at home')}
                        className={`p-3 rounded-xl border text-left transition-colors cursor-pointer group ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 border-cyan-900/40'
                            : 'bg-slate-50 hover:bg-teal-50/50 border-slate-200'
                        }`}
                      >
                        <HeartPulse className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform mb-1.5" />
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#002b49]'}`}>Home Nurse</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bedside Care</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: Vital Lens AI Preview */}
                <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs space-y-4 flex flex-col justify-between ${
                  isDark ? 'bg-[#00172d] border-cyan-900/40 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                        <HeartPulse className="w-4 h-4 text-purple-500 animate-pulse" />
                        <span>Vital Lens™</span>
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        Camera AI
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Instant contactless health scanning for heart rate, oxygen &amp; stress markers via mobile camera.
                    </p>

                    <div className={`p-3 rounded-xl border space-y-2 ${
                      isDark ? 'bg-purple-950/30 border-purple-800/30' : 'bg-purple-50/80 border-purple-200'
                    }`}>
                      <div className="flex justify-between text-xs">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Latest Pulse:</span>
                        <span className={`font-bold ${isDark ? 'text-purple-200' : 'text-purple-900'}`}>72 BPM (Resting)</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Blood Oxygen (SpO2):</span>
                        <span className="font-bold text-teal-600 dark:text-teal-300">98% Normal</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Stress Index:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-300">Low / Relaxed</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenVitalLens}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Launch New Vitals Scan</span>
                  </button>
                </div>
              </div>

              {/* AI Symptom & Doctor Finder Feature Card */}
              <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                isDark
                  ? 'bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-[#001c36] border-purple-500/30 text-white'
                  : 'bg-gradient-to-r from-purple-50 via-teal-50 to-blue-50 border-purple-200 text-slate-800'
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-400/30 shadow-xs">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                        Nhealth AI Symptom &amp; Doctor Finder
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-400/30">
                        AI Powered
                      </span>
                    </div>
                    <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Describe symptoms in natural language. Our clinical engine instantly matches empaneled specialist doctors, home visits, and diagnostics.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('symptom-finder')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-[#008080] hover:brightness-110 text-white text-xs font-bold shadow-md cursor-pointer shrink-0 transition-transform active:scale-95"
                >
                  <span>Launch AI Finder</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: QUICK BOOKING SECTION UI */}
          {activeTab === 'quick-booking' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                    Direct Doorstep Healthcare Booking
                  </h3>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Select any unified service to book certified clinicians directly to your residence.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-300 text-xs font-bold self-start sm:self-auto shrink-0">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <span>16 Unified Offerings</span>
                </div>
              </div>

              {/* Responsive Grid: Desktop 4x4 (lg:grid-cols-4), Mobile & Tablet 3x3 (grid-cols-3 md:grid-cols-3) */}
              <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 xs:gap-2.5 sm:gap-3.5 md:gap-4 lg:gap-5 w-full">
                {EXTRACTED_SERVICES.map((service, idx) => (
                  <div
                    key={service.id}
                    className={`group flex flex-col rounded-xl sm:rounded-2xl border transition-all duration-300 p-2 sm:p-3 md:p-3.5 justify-between hover:shadow-xl ${
                      isDark
                        ? 'bg-[#00172d] border-cyan-900/40 hover:border-cyan-500/60 shadow-lg'
                        : 'bg-white border-slate-200/90 hover:border-[#008080] shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Service Image */}
                      <div className="w-full aspect-[370/236] bg-slate-100 rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-2.5 border border-slate-200/50 flex items-center justify-center shrink-0 relative">
                        <img
                          src={service.cardImage}
                          alt={service.name}
                          loading={idx < 4 ? 'eager' : 'lazy'}
                          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src !== window.location.origin + service.iconImage) {
                              target.src = service.iconImage;
                            }
                          }}
                        />
                        {service.badge && (
                          <span className="hidden sm:inline-block absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-[#001424]/85 text-cyan-300 text-[8.5px] font-bold backdrop-blur-xs border border-cyan-800/50">
                            {service.badge}
                          </span>
                        )}
                      </div>

                      {/* Service Title */}
                      <h4
                        className={`font-black text-[10.5px] xs:text-xs sm:text-sm md:text-base leading-snug line-clamp-2 transition-colors ${
                          isDark ? 'text-white group-hover:text-cyan-300' : 'text-[#002b49] group-hover:text-[#008080]'
                        }`}
                      >
                        {service.name}
                      </h4>

                      {/* Tagline / Category */}
                      <p
                        className={`text-[8.5px] xs:text-[9.5px] sm:text-xs line-clamp-1 mt-0.5 sm:mt-1 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {service.tagline || service.category}
                      </p>
                    </div>

                    {/* Primary Booking Button: Styled to match the exact primary button styling used on the Hero page */}
                    <div className="pt-2 sm:pt-3 mt-auto">
                      <button
                        type="button"
                        onClick={() => handleServiceClick(service.name)}
                        className="w-full py-1.5 sm:py-2.5 px-2 sm:px-2.5 rounded-xl bg-gradient-to-r from-[#008080] to-[#009b9b] hover:from-[#006666] hover:to-[#008080] text-white font-bold text-[10px] sm:text-xs shadow-md shadow-teal-950/20 hover:shadow-teal-900/40 active:scale-[0.98] transition-all cursor-pointer border border-teal-400/30 flex items-center justify-center gap-1 sm:gap-1.5 text-center"
                      >
                        <span className="whitespace-nowrap">Book Service</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-100 shrink-0" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SERVICE & BOOKING HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>Service &amp; Booking History</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>View real-time status of your home visits, test reports and appointments.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('quick-booking')}
                  className="px-4 py-2 rounded-xl bg-[#008080] hover:bg-[#006666] text-white font-bold text-xs cursor-pointer shrink-0 self-start shadow-xs"
                >
                  + New Booking
                </button>
              </div>

              {bookingHistory.length > 0 ? (
                <div className="space-y-3">
                  {bookingHistory.map((item, idx) => (
                    <div
                      key={item.referenceId || idx}
                      className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        isDark ? 'bg-[#00172d] border-cyan-900/40 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-[#008080]'}`}>
                            {item.referenceId}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            {item.status}
                          </span>
                        </div>
                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#002b49]'}`}>{item.serviceName}</h4>
                        <div className={`text-xs flex flex-wrap items-center gap-x-4 gap-y-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span>Patient: {item.patientName}</span>
                          <span>Address: {item.address}</span>
                          <span>Phone: {item.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadBookingPDF(item)}
                          disabled={downloadingId === item.referenceId}
                          className="px-3.5 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-[#008080] dark:text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-teal-500/30 transition-all cursor-pointer shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingId === item.referenceId ? 'Generating...' : 'Download PDF Receipt'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-8 rounded-2xl border text-center space-y-3 ${
                  isDark ? 'bg-[#00172d] border-cyan-900/40 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                }`}>
                  <Clock className="w-8 h-8 text-teal-600 dark:text-cyan-400 mx-auto" />
                  <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#002b49]'}`}>No previous appointments found</div>
                  <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    You haven't scheduled any doorstep visits yet. Book a doctor, lab test or vital scan to get started.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('quick-booking')}
                    className="px-5 py-2.5 rounded-xl bg-[#008080] hover:bg-[#006666] text-white font-bold text-xs cursor-pointer inline-flex items-center gap-2 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Schedule First Visit</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VITAL LENS SCANS (Dynamic Ultra-Light Storage & jsPDF Report Generation) */}
          {activeTab === 'vital-lens' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>Vital Lens™ AI Biomarker Scans</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-teal-800 dark:text-cyan-300 border border-cyan-500/30">
                      Ultra-Light Storage &lt; 2 KB
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Camera-based contactless rPPG biometric records stored as pure JSON text with on-demand client PDF generation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenVitalLens}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs cursor-pointer shrink-0 self-start flex items-center gap-1.5 shadow-md shadow-purple-950/20"
                >
                  <Eye className="w-4 h-4" />
                  <span>Launch New Vital Scan</span>
                </button>
              </div>

              <div className="space-y-3">
                {storedScans.map((scan) => (
                  <div
                    key={scan.id}
                    className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
                      isDark ? 'bg-[#00172d] border-purple-900/40 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-300">{scan.id}</span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {scan.date} · {scan.time}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                          isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          JSON &lt; 1.5 KB
                        </span>
                      </div>
                      <div className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                        <span>Cardiovascular &amp; Respiratory Biomarkers</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
                          Score: {scan.mentalWellbeingScore}/100
                        </span>
                      </div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Patient: {scan.fullName} · {scan.age} yrs · {scan.gender}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className={`px-3 py-1.5 rounded-lg border text-center ${
                          isDark ? 'bg-white/5 border-purple-800/20' : 'bg-slate-50 border-purple-100'
                        }`}>
                          <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Heart Rate</span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-[#002b49]'}`}>{scan.heartRate} BPM</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg border text-center ${
                          isDark ? 'bg-white/5 border-purple-800/20' : 'bg-slate-50 border-purple-100'
                        }`}>
                          <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Oxygen (SpO2)</span>
                          <span className="font-bold text-teal-600 dark:text-teal-300">{scan.oxygenSaturation}%</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg border text-center ${
                          isDark ? 'bg-white/5 border-purple-800/20' : 'bg-slate-50 border-purple-100'
                        }`}>
                          <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Blood Pressure</span>
                          <span className="font-bold text-purple-700 dark:text-purple-200">{scan.bloodPressureSystolic}/{scan.bloodPressureDiastolic}</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg border text-center ${
                          isDark ? 'bg-white/5 border-purple-800/20' : 'bg-slate-50 border-purple-100'
                        }`}>
                          <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Stress Level</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-300 truncate max-w-[80px]">{scan.stressLevel}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadVitalPDF(scan)}
                        disabled={downloadingId === scan.id}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-200 border border-purple-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="Generate Dynamic Client-Side PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadingId === scan.id ? 'Rendering...' : 'Download PDF'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: INVOICES & ORDERS (Dynamic Ultra-Light Storage & jsPDF Generation) */}
          {activeTab === 'invoices' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>Invoices, Prescriptions &amp; Bills</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                      Ultra-Light Storage &lt; 1 KB
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Client-side dynamic PDF receipts generated on-demand with zero server file bloat.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {storedInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      isDark ? 'bg-[#00172d] border-cyan-900/40 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-[#008080]'}`}>{inv.id}</span>
                        {inv.orderNumber && (
                          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({inv.orderNumber})</span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          {inv.status}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                          isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          JSON &lt; 1 KB
                        </span>
                      </div>
                      <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#002b49]'}`}>{inv.serviceName}</div>
                      <div className={`text-xs flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span>Date: {inv.date} {inv.time ? `· ${inv.time}` : ''}</span>
                        <span>·</span>
                        <span>Method: {inv.paymentMethod || 'Prepaid'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className={`text-base font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>{inv.amount}</div>
                        <div className="text-[10px] text-teal-600 dark:text-teal-400">Tax Invoice Included</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoicePDF(inv)}
                        disabled={downloadingId === inv.id}
                        className="px-3.5 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-[#008080] dark:text-cyan-300 border border-teal-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                        title="Download Dynamic Tax Invoice PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadingId === inv.id ? 'Generating...' : 'Download PDF'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
              <div>
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>Patient Profile &amp; Emergency Contacts</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage address, medical notes and verified contact details for doorstep response.</p>
              </div>

              <div className={`p-6 rounded-2xl border shadow-xs space-y-4 ${
                isDark ? 'bg-[#00172d] border-cyan-900/40 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Full Legal Name</label>
                    <input
                      type="text"
                      readOnly
                      value={patientName}
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-medium focus:outline-none ${
                        isDark ? 'bg-white/5 border-cyan-900/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Registered Phone Number</label>
                    <input
                      type="text"
                      readOnly
                      value={patientPhone}
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-medium focus:outline-none ${
                        isDark ? 'bg-white/5 border-cyan-900/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
                    <input
                      type="email"
                      readOnly
                      value={patientEmail}
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-medium focus:outline-none ${
                        isDark ? 'bg-white/5 border-cyan-900/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>City / District</label>
                    <input
                      type="text"
                      readOnly
                      value="Hyderabad & Secunderabad, Telangana"
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-medium focus:outline-none ${
                        isDark ? 'bg-white/5 border-cyan-900/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs pt-2">
                  <label className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Default Doorstep Healthcare Address</label>
                  <textarea
                    rows={2}
                    readOnly
                    value="Plot No. 42, Jubilee Hills Road No. 36, Near Apollo Cradle, Hyderabad, Telangana - 500033"
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-medium focus:outline-none resize-none ${
                      isDark ? 'bg-white/5 border-cyan-900/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  isDark ? 'bg-cyan-950/30 border-cyan-800/30 text-slate-300' : 'bg-teal-50/60 border-teal-200 text-teal-950'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0" />
                    <span>
                      Emergency Support Helpline: <strong className={isDark ? 'text-white' : 'text-[#002b49]'}>9393934621</strong> (support@nhealth.in)
                    </span>
                  </div>
                  <a
                    href="tel:9393934621"
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold shrink-0"
                  >
                    Call
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI SYMPTOM FINDER INTEGRATION */}
          {activeTab === 'symptom-finder' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                      Nhealth AI Symptom &amp; Doctor Finder
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-400/30 text-[10px] font-extrabold uppercase">
                      AI Clinical Engine
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Analyze symptoms, discover empaneled specialist doctors, and book doorstep visits or teleconsultations.
                  </p>
                </div>
              </div>

              <div className={`rounded-2xl border overflow-hidden p-2 sm:p-5 shadow-xs ${
                isDark ? 'bg-[#00172d] border-cyan-900/40 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <SymptomDoctorFinder
                  onSelectService={(service) => {
                    if (onOpenBookingModal) {
                      onOpenBookingModal(service.name);
                    }
                  }}
                  onBookDoctorVisit={(doctor, symptomsText) => {
                    if (onOpenBookingModal) {
                      onOpenBookingModal(`Doctor Home Visit (${doctor.name} - ${doctor.specialization})`);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB: MY RECORDS */}
          {activeTab === 'records' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                    Digital Health Vault &amp; Medical Records
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Secure, tamper-proof repository of your lab reports, prescriptions &amp; clinical summaries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Record Upload: Select any PDF/image report to save securely in your Nhealth Vault.')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold shadow-md cursor-pointer shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Medical Record</span>
                </button>
              </div>

              {/* Records List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Complete Blood Count & Comprehensive Lipid Profile',
                    category: 'Diagnostic Lab Report',
                    date: '18 Oct 2026',
                    provider: 'Apollo Diagnostics (NABL Accredited)',
                    size: '1.4 MB PDF',
                  },
                  {
                    title: 'Cardiology Consultation Summary & ECG Analysis',
                    category: 'Doctor Prescription',
                    date: '12 Oct 2026',
                    provider: 'Dr. Arvind Swaminathan (Senior Cardiologist)',
                    size: '890 KB PDF',
                  },
                  {
                    title: 'Optical Facial Photoplethysmography (vPPG) Report',
                    category: 'Vital Lens Biometrics',
                    date: '10 Oct 2026',
                    provider: 'Nhealth Vital Lens™ Clinical Engine',
                    size: '420 KB PDF',
                  },
                  {
                    title: 'HbA1c & Fasting Blood Sugar Home Sample Report',
                    category: 'Pathology Report',
                    date: '28 Sep 2026',
                    provider: 'Lucid Medical Diagnostics (NABL Certified)',
                    size: '1.1 MB PDF',
                  },
                ].map((rec, i) => (
                  <div
                    key={i}
                    className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-3 ${
                      isDark ? 'bg-[#00172d] border-cyan-900/40 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-500 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                            {rec.category}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm mt-1 line-clamp-1">{rec.title}</h4>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs border-y py-2.5 border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Issued By:</span>
                        <span className="font-semibold text-right">{rec.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Date &amp; Size:</span>
                        <span className="font-mono">{rec.date} • {rec.size}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (storedScans.length > 0) {
                            handleDownloadVitalPDF(storedScans[0]);
                          } else {
                            alert('Downloading verified clinical document from secure Nhealth cloud...');
                          }
                        }}
                        className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => alert(`Opening secure digital viewer for: ${rec.title}`)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                          isDark ? 'border-cyan-800 hover:bg-white/5 text-cyan-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: REFERRAL & REWARDS */}
          {activeTab === 'rewards' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                  Referral &amp; Care Rewards
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Invite friends and family to Nhealth. They receive ₹250 off their first booking, and you earn ₹250 care credits!
                </p>
              </div>

              {/* Referral Code Banner */}
              <div className={`p-6 sm:p-7 rounded-2xl border shadow-sm relative overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-r from-teal-950/70 via-cyan-950/60 to-[#00172d] border-teal-500/40 text-white'
                  : 'bg-gradient-to-r from-teal-50 via-cyan-50 to-emerald-50 border-teal-200 text-slate-900'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-md">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Exclusive Patient Referral Code
                    </span>
                    <h4 className="text-xl font-black">Share the Gift of At-Home Healthcare</h4>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Give ₹250 discount to any friend or neighbor across Hyderabad. Whenever they complete any doorstep lab test or doctor consultation, you receive ₹250 directly into your Nhealth Care Wallet.
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border shadow-inner text-center space-y-3 min-w-[240px] ${
                    isDark ? 'bg-black/40 border-cyan-800/40' : 'bg-white border-teal-200'
                  }`}>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Referral Code</span>
                    <div className="text-2xl font-black font-mono tracking-wider text-teal-600 dark:text-teal-400">
                      NH-HEALTH250
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText('NH-HEALTH250');
                          setReferralCopied(true);
                          setTimeout(() => setReferralCopied(false), 2500);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{referralCopied ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                      <a
                        href="https://wa.me/?text=Use%20my%20Nhealth%20referral%20code%20NH-HEALTH250%20for%20%E2%82%B9250%20OFF%20doorstep%20doctor%20home%20visits%20and%20diagnostic%20lab%20tests%20at%20home%3A%20https%3A%2F%2Fnhealth.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl border shadow-xs text-center space-y-1 ${
                  isDark ? 'bg-[#00172d] border-cyan-900/40 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Friends Invited</span>
                  <div className="text-2xl font-black text-cyan-500">12</div>
                  <span className="text-[10px] text-slate-400">Via WhatsApp &amp; SMS</span>
                </div>
                <div className={`p-4 rounded-2xl border shadow-xs text-center space-y-1 ${
                  isDark ? 'bg-[#00172d] border-cyan-900/40 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Completed Bookings</span>
                  <div className="text-2xl font-black text-emerald-500">5</div>
                  <span className="text-[10px] text-emerald-500 font-semibold">Verified Consultations</span>
                </div>
                <div className={`p-4 rounded-2xl border shadow-xs text-center space-y-1 ${
                  isDark ? 'bg-[#00172d] border-cyan-900/40 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Wallet Credits Earned</span>
                  <div className="text-2xl font-black text-amber-500">₹1,250</div>
                  <span className="text-[10px] text-slate-400">Available to Redeem</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HELP & SUPPORT */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                  Help &amp; Patient Support
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Connect with our 24/7 care concierge team or resolve queries regarding sample collections, reports, and payments.
                </p>
              </div>

              {/* Direct Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  href="tel:9393934621"
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between space-y-2 ${
                    isDark ? 'bg-[#00172d] hover:bg-cyan-950/40 border-cyan-900/40 text-white' : 'bg-white hover:bg-teal-50/50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-500 flex items-center justify-center">
                    <PhoneCall className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">24/7 Care Hotline</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Immediate clinical coordination</p>
                  </div>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">9393934621</span>
                </a>

                <a
                  href="https://wa.me/919581582220?text=Hello%20Nhealth%20Support%2C%20I%20need%20assistance%20with%20my%20patient%20account."
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between space-y-2 ${
                    isDark ? 'bg-[#00172d] hover:bg-cyan-950/40 border-cyan-900/40 text-white' : 'bg-white hover:bg-teal-50/50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">WhatsApp Care Desk</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Instant report delivery &amp; queries</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+91 95815 82220</span>
                </a>

                <a
                  href="mailto:support@nhealth.in"
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between space-y-2 ${
                    isDark ? 'bg-[#00172d] hover:bg-cyan-950/40 border-cyan-900/40 text-white' : 'bg-white hover:bg-teal-50/50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
                    <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Email Support</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Official correspondence &amp; billing</p>
                  </div>
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">support@nhealth.in</span>
                </a>
              </div>

              {/* FAQs Accordion */}
              <div className={`p-6 rounded-2xl border shadow-xs space-y-4 ${
                isDark ? 'bg-[#00172d] border-cyan-900/40 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <h4 className="text-sm font-bold">Frequently Asked Questions</h4>
                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="border-b pb-2.5 dark:border-slate-800">
                    <h5 className="font-bold text-teal-600 dark:text-teal-400">How quickly does a home nurse or phlebotomist arrive?</h5>
                    <p className={`mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Emergency visits arrive within 15–30 minutes across Hyderabad. Routine sample collections and consultations can be scheduled for any preferred 1-hour time window.
                    </p>
                  </div>
                  <div className="border-b pb-2.5 dark:border-slate-800">
                    <h5 className="font-bold text-teal-600 dark:text-teal-400">Are lab reports NABL accredited?</h5>
                    <p className={`mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Yes, 100% of diagnostic samples are processed through certified NABL accredited laboratories with barcoded cold-chain transit tracking.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-teal-600 dark:text-teal-400">How do I redeem my Care Wallet credits?</h5>
                    <p className={`mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Your wallet balance automatically applies at checkout on any doorstep service or doctor consultation booking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ABOUT NHEALTH */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                  About Nhealth™
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Powering the Future of Unified &amp; At-Home Healthcare across Bharat.
                </p>
              </div>

              <div className={`p-6 sm:p-7 rounded-2xl border shadow-xs space-y-4 ${
                isDark ? 'bg-[#00172d] border-cyan-900/40 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center gap-3">
                  <img
                    src="https://i.ibb.co/JW6HFRV0/Nhealth-logo-8cm-x-8cm-high-quality-1-1.png"
                    alt="Nhealth Logo"
                    className="h-10 w-auto object-contain rounded"
                  />
                  <div>
                    <h4 className="font-black text-lg text-teal-600 dark:text-teal-400">
                      Nhealth Unified Healthcare Technologies Private Limited
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Registered &amp; Headquartered in Hyderabad, Telangana, India
                    </p>
                  </div>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Nhealth is India's leading unified at-home healthcare ecosystem, bridging the gap between hospital-grade clinical excellence and patient doorstep convenience. Our technology platform coordinates mobile phlebotomy, certified bedside nursing attendants, empaneled specialist doctor home visits, 24/7 GPS-tracked life support ambulances, and proprietary optical AI vitals analysis.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                  <div className={`p-3.5 rounded-xl border text-center ${isDark ? 'bg-white/5 border-cyan-800/30' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-xl font-black text-teal-600 dark:text-teal-400">100,000+</div>
                    <span className="text-[11px] font-semibold">Patients Served at Home</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border text-center ${isDark ? 'bg-white/5 border-cyan-800/30' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-xl font-black text-cyan-600 dark:text-cyan-400">100% Verified</div>
                    <span className="text-[11px] font-semibold">Clinicians &amp; NABL Partners</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border text-center ${isDark ? 'bg-white/5 border-cyan-800/30' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">&lt;30 Mins</div>
                    <span className="text-[11px] font-semibold">Average Rapid Dispatch</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                  Terms &amp; Conditions
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Official user agreement governing the use of Nhealth services and patient platform.
                </p>
              </div>

              <div className={`p-6 sm:p-7 rounded-2xl border shadow-xs space-y-4 text-xs sm:text-sm leading-relaxed ${
                isDark ? 'bg-[#00172d] border-cyan-900/40 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <div className="space-y-1">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#002b49]'}`}>1. Acceptance of Healthcare Terms</h4>
                  <p>By registering or booking any service through Nhealth, you acknowledge that you are at least 18 years of age and agree to comply with all stated clinical policies.</p>
                </div>
                <div className="space-y-1">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#002b49]'}`}>2. Doorstep Clinical Protocols</h4>
                  <p>All home sample collections and clinician visits adhere strictly to sterile single-use disposable PPE and vacuum collection tube safety standards.</p>
                </div>
                <div className="space-y-1">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#002b49]'}`}>3. Emergency Care Disclaimer</h4>
                  <p>For life-threatening acute emergencies (e.g. cardiac arrest, active stroke, severe trauma), dial regional emergency helpline (108 / 112) immediately.</p>
                </div>
                <div className="space-y-1">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#002b49]'}`}>4. Cancellations &amp; Refund Policy</h4>
                  <p>Bookings may be rescheduled or cancelled with full credit back to your Nhealth Care Wallet up to 2 hours before the scheduled appointment window.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#002b49]'}`}>
                  Privacy &amp; Data Protection Policy
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  How Nhealth protects your personal health information, biometrics, and medical records.
                </p>
              </div>

              <div className={`p-6 sm:p-7 rounded-2xl border shadow-xs space-y-4 text-xs sm:text-sm leading-relaxed ${
                isDark ? 'bg-[#00172d] border-cyan-900/40 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <div className="space-y-1">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#002b49]'}`}>1. Clinical Data Encryption</h4>
                  <p>All patient records, invoices, and diagnostic test results are encrypted with 256-bit AES encryption both in transit and at rest in accordance with ISO 27001 and DPDP guidelines.</p>
                </div>
                <div className="space-y-1">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#002b49]'}`}>2. Real-Time Camera Vitals Privacy Guarantee</h4>
                  <p>During Vital Lens™ optical face scans, video frames are processed transiently in device memory via WebGL / MediaPipe. No facial images or video files are recorded or uploaded to external servers.</p>
                </div>
                <div className="space-y-1">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#002b49]'}`}>3. Patient Data Sovereignty</h4>
                  <p>You have full ownership and right to download, export, or permanently request deletion of your health records and account history at any time.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

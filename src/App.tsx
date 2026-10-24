/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Stethoscope,
  TestTube2,
  HeartHandshake,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  X,
  Building2,
  UserCheck,
  Award,
  ChevronDown,
  Video,
  Car,
  Pill,
  CalendarCheck,
  HeartPulse,
  Layers,
  Sparkles,
  Search,
  User,
  Droplet,
  Menu,
  PhoneCall,
  Briefcase,
  Download,
  Smartphone,
  Heart,
  Compass,
  Target,
  Coins,
  Cpu,
  Mic,
} from 'lucide-react';

import heroImg from './assets/images/nhealth_hero_healthcare_1791632199780.jpg';
import diagnosticsImg from './assets/images/nhealth_home_diagnostics_1791632212521.jpg';
import doctorVisitImg from './assets/images/nhealth_doctor_visit_1791632223584.jpg';
import nursingCareImg from './assets/images/nhealth_nursing_care_1791632235972.jpg';

import { ServiceButtonsGrid } from './components/ServiceButtonsGrid';
import { ServiceBookingModal } from './components/ServiceBookingModal';
import { GuestWarningModal } from './components/GuestWarningModal';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { MyBookingsModal } from './components/MyBookingsModal';
import { VitalLensModal } from './components/VitalLensModal';
import { SymptomDoctorFinder } from './components/SymptomDoctorFinder';
import { HowNhealthWorks } from './components/HowNhealthWorks';
import { UniversalSearchFilter } from './components/UniversalSearchFilter';
import { AuthPage } from './components/AuthPage';
import { PartnerOnboardingPage } from './components/PartnerOnboardingPage';
import { AdminDashboardPage } from './components/AdminDashboardPage';
import { CorporateEnquiriesPage } from './components/CorporateEnquiriesPage';
import { TeamsPage } from './components/TeamsPage';
import { RoleBasedDashboard } from './components/RoleBasedDashboard';
import { PatientDashboardPage } from './components/PatientDashboardPage';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { QuickLookFAB } from './components/QuickLookFAB';
import {
  PartnerApplication,
  PartnerStatus,
  INITIAL_PARTNERS,
  calculateDaysInactive,
  INACTIVITY_THRESHOLD_DAYS
} from './types/partner';
import {
  EnquiryRecord,
  getStoredEnquiries,
  addEnquiry,
  updateEnquiryStatus
} from './types/enquiry';
import { registerLivePartnerDoctor, unregisterPartnerDoctor } from './data/doctorsData';
import { ServiceItem, BookingFormData, UserAccount, ConfirmedBooking } from './types/serviceBooking';
import { EXTRACTED_SERVICES } from './data/servicesData';
import { saveGuestBooking } from './utils/patientStorage';
import { navHistory } from './utils/navigationHistory';

const NHEALTH_LOGO_URL = 'https://i.ibb.co/JW6HFRV0/Nhealth-logo-8cm-x-8cm-high-quality-1-1.png';
const NHEALTH_LOGO_FALLBACK = '/nhealth_logo.png';

const HERO_BANNER_WIDE_URL = 'https://i.ibb.co/2ryZtnM/Healthcare-at-Home-Network-Hub-2.png';
const HERO_BANNER_WIDE_FALLBACK = '/hero_banner_wide.png';

const MOBILE_HERO_IMAGE_URL = 'https://i.ibb.co/HpGhrfxS/MOBILE-HERO-IMAGE-expand.png';
const MOBILE_HERO_IMAGE_FALLBACK = '/mobile_hero_image_expand.png';

// 16 Services for header dropdown menu
const ALL_SERVICES_DROPDOWN: { name: string; category: string; icon: React.ElementType }[] = [
  { name: 'Online doctor consultations', category: 'Tele-Health', icon: Video },
  { name: 'Doctor home visits', category: 'Clinical Visits', icon: Stethoscope },
  { name: 'Home diagnostics & lab tests', category: 'Diagnostics', icon: TestTube2 },
  { name: 'Doorstep pharmacy', category: 'Pharmacy', icon: Pill },
  { name: 'X ray & portable diagnostics at home', category: 'Radiology', icon: Layers },
  { name: 'Specialized nursing care at home', category: 'Nursing', icon: HeartPulse },
  { name: 'Bedside assistance & attendant', category: 'Assistance', icon: HeartHandshake },
  { name: 'Eldercare & senior care at home', category: 'Geriatric Care', icon: UserCheck },
  { name: 'Physiotherapy at home', category: 'Rehabilitation', icon: Activity },
  { name: 'Dental care and oral health', category: 'Dentistry', icon: Sparkles },
  { name: '24/7 smart ambulance and SOS', category: 'Emergency', icon: Car },
  { name: 'Blood bank & support', category: 'Critical Care', icon: Droplet },
  { name: 'Diagnostics & advance imaging', category: 'Imaging', icon: Layers },
  { name: 'Premium OPD & hospital assistance', category: 'Priority Care', icon: Award },
  { name: 'Nhealth care rider', category: 'Transit', icon: Car },
  { name: 'Nhealth care assist', category: 'Daily Support', icon: ShieldCheck },
];

interface LegacyFeaturedServiceItem {
  id: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  highlights: string[];
  turnaround: string;
  image: string;
}

interface MarqueeServiceItem {
  id: string;
  name: string;
  directUrl: string;
  localFile: string;
  pageUrl: string;
  tagline: string;
  category: string;
  icon: React.ElementType;
  gradient: string;
}

const HERO_MARQUEE_SERVICES: MarqueeServiceItem[] = [
  {
    id: 'physiotherapy',
    name: 'Physiotherapy',
    directUrl: 'https://i.ibb.co/MD4rcRxf/physiotherapy.png',
    localFile: '/physiotherapy.png',
    pageUrl: 'https://ibb.co/Z6P5BhpS',
    tagline: 'Home Rehabilitation & Mobility Care',
    category: 'Therapy',
    icon: Activity,
    gradient: 'from-[#002b49] to-[#008080]',
  },
  {
    id: 'care-ride',
    name: 'Nhealth Care Ride',
    directUrl: 'https://i.ibb.co/HLBmNpxW/nhealth-care-ride.png',
    localFile: '/nhealth%20care%20ride.png',
    pageUrl: 'https://ibb.co/TDYzKqbV',
    tagline: 'Assisted Non-Emergency Medical Transit',
    category: 'Transit',
    icon: Car,
    gradient: 'from-[#003e6b] to-[#0d9488]',
  },
  {
    id: 'teleconsult',
    name: 'Online Doctor Consultations',
    directUrl: 'https://i.ibb.co/xKYqBdCf/online-doctor-consultations.png',
    localFile: '/online%20doctor%20consultations.png',
    pageUrl: 'https://ibb.co/8nbgftKd',
    tagline: 'Instant Specialist Video & E-Prescription',
    category: 'Tele-Health',
    icon: Video,
    gradient: 'from-[#002b49] to-[#0284c7]',
  },
  {
    id: 'care-assist',
    name: 'Care Assist',
    directUrl: 'https://i.ibb.co/k2fngTSD/nhealth-care-assist.png',
    localFile: '/nhealth%20care%20assist.png',
    pageUrl: 'https://ibb.co/RTmnpKD6',
    tagline: 'Trained Home Attendants & Daily Support',
    category: 'Personal Care',
    icon: HeartHandshake,
    gradient: 'from-[#0a3d66] to-[#0f766e]',
  },
  {
    id: 'home-xray',
    name: 'Home X-Ray Services',
    directUrl: 'https://i.ibb.co/wNP3sZ5j/home-X-ray-Services.png',
    localFile: '/home%20X-ray%20Services.png',
    pageUrl: 'https://ibb.co/mC218rfg',
    tagline: 'Portable Digital Radiography At Doorstep',
    category: 'Imaging',
    icon: Layers,
    gradient: 'from-[#0f172a] to-[#008080]',
  },
  {
    id: 'bedside',
    name: 'Bedside Assistance',
    directUrl: 'https://i.ibb.co/jZWnsBZY/bedside-assistance.png',
    localFile: '/bedside%20assistance.png',
    pageUrl: 'https://ibb.co/Z1Yq7t1r',
    tagline: 'Compassionate Post-Hospitalization Care',
    category: 'Nursing',
    icon: HeartPulse,
    gradient: 'from-[#002b49] to-[#059669]',
  },
  {
    id: 'premium-opd',
    name: 'Premium OPD Services',
    directUrl: 'https://i.ibb.co/xWCH1bq/premium-opd-services.png',
    localFile: '/premium%20opd%20services.png',
    pageUrl: 'https://ibb.co/H6FdtyT',
    tagline: 'Priority Zero-Wait Specialist Clinic Access',
    category: 'Priority Care',
    icon: Award,
    gradient: 'from-[#1e293b] to-[#0d9488]',
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy Delivery',
    directUrl: 'https://i.ibb.co/N6DZSZ9q/Pharmacy-to-home.png',
    localFile: '/Pharmacy%20to%20home.png',
    pageUrl: 'https://ibb.co/4ZvPdP8L',
    tagline: 'Direct Temperature-Controlled Medicines',
    category: 'Pharmacy',
    icon: Pill,
    gradient: 'from-[#002b49] to-[#10b981]',
  },
  {
    id: 'prebook-opd',
    name: 'Pre-Booking OPD',
    directUrl: 'https://i.ibb.co/BVmgv704/pre-booking-opd-services.png',
    localFile: '/pre%20booking%20opd%20services.png',
    pageUrl: 'https://ibb.co/1f39BpFs',
    tagline: 'Guaranteed Consult Slots & Express Tokens',
    category: 'Scheduling',
    icon: CalendarCheck,
    gradient: 'from-[#00385e] to-[#0284c7]',
  },
];

const SERVICES: LegacyFeaturedServiceItem[] = [
  {
    id: 'diagnostics',
    title: 'Home Diagnostics',
    category: 'Diagnostic Testing',
    tagline: 'Phlebotomy & Sample Collection at Doorstep',
    description:
      'Convenient sample collection from home with accurate digital reports delivered directly in association with verified partner labs.',
    highlights: [
      'NABL & CAP accredited testing labs',
      'Barcode-tracked temperature-controlled transport',
      'Digital reports delivered within 12–24 hours',
      'Fasting & post-prandial scheduled time slots',
    ],
    turnaround: '12–24 Hours Report Delivery',
    image: diagnosticsImg,
  },
  {
    id: 'doctor-visits',
    title: 'Doctor Home Visits',
    category: 'Clinical Consultations',
    tagline: 'Primary & Specialist Care in Comfort',
    description:
      'Professional primary care consultations and expert clinical evaluations carried out safely at your residence.',
    highlights: [
      'Registered, experienced General Physicians & Geriatric specialists',
      'Comprehensive in-person vital examinations and history check',
      'Legitimate digital e-prescriptions on the spot',
      'Dedicated follow-up check-in via secure consultation line',
    ],
    turnaround: 'Same-Day or Next-Day Bookings',
    image: doctorVisitImg,
  },
  {
    id: 'nursing-care',
    title: 'Nursing & Care',
    category: 'Bedside & Post-Op Support',
    tagline: 'Compassionate Assistance for Loved Ones',
    description:
      'Dedicated bedside assistants, post-hospitalization care, and professional nursing support for elderly or recovering family members.',
    highlights: [
      'Certified nurses for wound dressing, injections, and IV lines',
      'Elderly daily mobility and medication administration support',
      'Post-operative care following hospital discharge',
      'Flexible 4-hour, 8-hour, or 24-hour shift plans',
    ],
    turnaround: 'Immediate Dispatch Upon Clinical Assessment',
    image: nursingCareImg,
  },
];

const DIAGNOSTIC_PARTNER_LOGOS = [
  {
    name: 'Thyrocare',
    src: 'https://i.ibb.co/svR7RMht/Thyrocare-Logo.jpg',
    fallback: '/thyrocare_partner_logo.jpg',
  },
  {
    name: 'Lupin Diagnostics',
    src: 'https://i.ibb.co/GfR32V8n/lupin-diagnostics.jpg',
    fallback: '/lupin_partner_logo.jpg',
  },
];

const PARTNERS = [
  {
    name: 'NABL Certified Diagnostic Networks',
    role: 'Accredited Pathology & Biochemistry Partners',
    detail: 'Over 400+ validated tests processed under strict ISO 15189 standards.',
  },
  {
    name: 'Apollo & Regional Hospital Chains',
    role: 'Clinical Referral & Emergency Tie-Ups',
    detail: 'Direct hospital care escalations and specialized consultant access.',
  },
  {
    name: 'Licensed Home Pharmacy Delivery',
    role: 'Prescription Fulfillment Services',
    detail: 'Authentic medications dispatched directly to patients post-consultation.',
  },
  {
    name: 'Corporate Wellness Providers',
    role: 'Enterprise Health Checkup Programs',
    detail: 'Comprehensive annual preventative screenings for employee families.',
  },
];

type RoutePath =
  | 'home'
  | 'auth'
  | 'partner-with-us'
  | 'command-center'
  | 'corporate-enquiries'
  | 'dashboard'
  | 'patient-dashboard'
  | 'teams';

function getRouteFromPath(pathname: string): RoutePath {
  if (typeof window !== 'undefined' && window.location.hash === '#teams') return 'teams';
  if (pathname === '/teams' || pathname.startsWith('/teams')) return 'teams';
  if (pathname === '/auth' || pathname.startsWith('/auth')) return 'auth';
  if (pathname === '/patient-dashboard' || pathname.startsWith('/patient-dashboard')) return 'patient-dashboard';
  if (pathname === '/partner-with-us' || pathname.startsWith('/partner-with-us')) return 'partner-with-us';
  if (pathname === '/corporate-enquiries' || pathname.startsWith('/corporate-enquiries')) return 'corporate-enquiries';
  if (pathname === '/command-center' || pathname.startsWith('/command-center')) return 'command-center';
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard')) return 'dashboard';
  // Unauthorized legacy or misspelled admin paths seamlessly redirect to home
  if (pathname === '/admin' || pathname === '/command-control') {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
  }
  return 'home';
}

export default function App() {
  // User Authentication & History States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nhealth_user') !== null;
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('nhealth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [bookingHistory, setBookingHistory] = useState<ConfirmedBooking[]>(() => {
    try {
      const saved = localStorage.getItem('nhealth_bookings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // SPA Routing State with Full Refresh Persistence (URL path, sessionStorage & localStorage)
  const [currentRoute, setCurrentRoute] = useState<RoutePath>(() => {
    let storedUser: UserAccount | null = null;
    try {
      const saved = localStorage.getItem('nhealth_user');
      if (saved) storedUser = JSON.parse(saved);
    } catch {}

    if (typeof window !== 'undefined') {
      if (window.location.hash === '#teams') return 'teams';
      const pathRoute = getRouteFromPath(window.location.pathname);
      if (pathRoute && pathRoute !== 'home') {
        sessionStorage.setItem('nhealth_active_route', pathRoute);
        return pathRoute;
      }
      // Check session storage for persisted route on refresh
      const savedSession = sessionStorage.getItem('nhealth_active_route') as RoutePath | null;
      if (savedSession && savedSession !== 'home') {
        return savedSession;
      }
      if (storedUser) {
        const root = storedUser.role === 'Patient' || storedUser.accountType === 'Patient' ? 'patient-dashboard' : 'dashboard';
        sessionStorage.setItem('nhealth_active_route', root);
        return root;
      }
      return 'home';
    }
    return storedUser ? 'patient-dashboard' : 'home';
  });

  // Floating Exit Toast prompt for root page gradual exit
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  useEffect(() => navHistory.onExitPrompt(setShowExitPrompt), []);

  const navigateTo = (route: RoutePath, urlPath?: string) => {
    let path = urlPath;
    if (!path) {
      if (route === 'home') path = '/';
      else if (route === 'teams') path = '/teams';
      else path = `/${route}`;
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nhealth_active_route', route);
      window.history.pushState({ route }, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setCurrentRoute(route);
  };

  // Browser History & Popstate Navigation Handler (Step-by-step back and gradual exit flow)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // 1. If any modal/popup was open, navHistory closed it and handled the back event
      if (navHistory.hasOpenModals()) {
        return;
      }

      // 2. If this was an internal sub-tab change, let the component handle its tab history
      if (e.state?.isPatientTab || e.state?.isAdminTab) {
        return;
      }

      // 3. Resolve destination route from history state or URL
      let destRoute: RoutePath = 'home';
      if (e.state?.route) {
        destRoute = e.state.route;
      } else if (window.location.hash === '#teams') {
        destRoute = 'teams';
      } else {
        destRoute = getRouteFromPath(window.location.pathname);
      }

      const rootRoute: RoutePath = isLoggedIn
        ? (currentUser?.role === 'Patient' || currentUser?.accountType === 'Patient' ? 'patient-dashboard' : 'dashboard')
        : 'home';

      // 4. Gradual Exit: If already at the root page and user presses Back again
      if (currentRoute === rootRoute) {
        const allowExit = navHistory.handleRootBackPress();
        if (!allowExit) {
          // Re-push root route so the user stays inside the app until double-back confirmation
          const rootPath = rootRoute === 'home' ? '/' : `/${rootRoute}`;
          window.history.pushState({ route: rootRoute }, '', rootPath);
        }
        return;
      }

      // 5. Navigate 1 step back to previously visited internal page
      setCurrentRoute(destRoute);
      sessionStorage.setItem('nhealth_active_route', destRoute);
    };

    const handleHashChange = () => {
      if (window.location.hash === '#teams') {
        setCurrentRoute('teams');
        sessionStorage.setItem('nhealth_active_route', 'teams');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [currentRoute, isLoggedIn, currentUser]);

  // Keep URL & sessionStorage in sync on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nhealth_active_route', currentRoute);
      const expectedPath = currentRoute === 'home' ? '/' : currentRoute === 'teams' ? '/teams' : `/${currentRoute}`;
      if (window.location.pathname !== expectedPath && !window.location.pathname.startsWith(expectedPath)) {
        window.history.replaceState({ route: currentRoute }, '', expectedPath);
      }
    }
  }, [currentRoute]);

  // Partner Directory & Admin Approval State
  const [partners, setPartners] = useState<PartnerApplication[]>(() => {
    try {
      const saved = localStorage.getItem('nhealth_partners');
      let baseList = INITIAL_PARTNERS;
      if (saved) {
        const parsed: PartnerApplication[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((p) => p.id));
        const merged = [...parsed];
        INITIAL_PARTNERS.forEach((p) => {
          if (!existingIds.has(p.id)) {
            merged.push(p);
          }
        });
        baseList = merged;
      }
      // Phase 3: Enforce Automatic Suspension Rule:
      // If a partner account remains inactive without login or operational activity for >3 months (90 days),
      // automatically flag the account as "Suspended due to Inactivity".
      return baseList.map((p) => {
        if (p.status === 'Live' && calculateDaysInactive(p) > INACTIVITY_THRESHOLD_DAYS) {
          return {
            ...p,
            status: 'Suspended' as PartnerStatus,
            isSuspendedDueToInactivity: true,
            suspensionReason:
              p.suspensionReason ||
              'Suspended due to Inactivity (>90 days without operational activity or login)',
            suspensionDate: p.suspensionDate || new Date().toISOString(),
          };
        }
        return p;
      });
    } catch {
      return INITIAL_PARTNERS;
    }
  });

  // Centralized Corporate & General Enquiries Store
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>(getStoredEnquiries);

  useEffect(() => {
    const handleEnquiriesUpdated = () => {
      setEnquiries(getStoredEnquiries());
    };
    window.addEventListener('nhealth_enquiries_updated', handleEnquiriesUpdated);
    return () => window.removeEventListener('nhealth_enquiries_updated', handleEnquiriesUpdated);
  }, []);

  // Keep empaneled live doctors in sync with live partners on mount
  useEffect(() => {
    partners.forEach((p) => {
      if (p.status === 'Live' && !p.isSuspendedDueToInactivity && !p.isRestrictedByAdmin && p.category === 'Doctor') {
        registerLivePartnerDoctor(p);
      }
    });
  }, []);

  const handleAddPartner = (newPartner: PartnerApplication) => {
    setPartners((prev) => {
      const updated = [newPartner, ...prev];
      try {
        localStorage.setItem('nhealth_partners', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUpdatePartner = (partnerId: string, updates: Partial<PartnerApplication>) => {
    setPartners((prev) => {
      const updated = prev.map((p) => {
        if (p.id === partnerId) {
          const merged = { ...p, ...updates };
          if (p.category === 'Doctor') {
            const isLive = merged.status === 'Live' && !merged.isSuspendedDueToInactivity && !merged.isRestrictedByAdmin;
            if (isLive) {
              registerLivePartnerDoctor(merged);
            } else {
              unregisterPartnerDoctor(p.id);
            }
          }
          return merged;
        }
        return p;
      });
      try {
        localStorage.setItem('nhealth_partners', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleTogglePartnerStatus = (partnerId: string, newStatus: PartnerStatus) => {
    setPartners((prev) => {
      const updated = prev.map((p) => {
        if (p.id === partnerId) {
          const isNowLive = newStatus === 'Live';
          if (p.category === 'Doctor') {
            if (isNowLive) {
              registerLivePartnerDoctor(p);
            } else {
              unregisterPartnerDoctor(p.id);
            }
          }
          return {
            ...p,
            status: newStatus,
            isSuspendedDueToInactivity: newStatus === 'Suspended' ? true : false,
            verifiedAt: isNowLive ? new Date().toISOString() : p.verifiedAt,
            lastActiveAt: isNowLive ? new Date().toISOString() : p.lastActiveAt,
          };
        }
        return p;
      });
      try {
        localStorage.setItem('nhealth_partners', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAuthSuccess = (user: UserAccount) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    try {
      localStorage.setItem('nhealth_user', JSON.stringify(user));
    } catch {}
    if (user.role === 'Patient' || user.accountType === 'Patient') {
      navigateTo('patient-dashboard', '/patient-dashboard');
    } else {
      navigateTo('dashboard', '/dashboard');
    }
  };

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingServiceType, setBookingServiceType] = useState('Home Diagnostics');



  const [loginName, setLoginName] = useState('');
  const [loginRedirectFromBooking, setLoginRedirectFromBooking] = useState(false);

  // Dynamic Service Booking & Guest Warning States
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<ServiceItem | null>(null);
  const [isServiceBookingOpen, setIsServiceBookingOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [pendingDraftBooking, setPendingDraftBooking] = useState<BookingFormData | null>(null);
  const [confirmedBookingData, setConfirmedBookingData] = useState<ConfirmedBooking | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [myBookingsModalOpen, setMyBookingsModalOpen] = useState(false);
  const [vitalLensOpen, setVitalLensOpen] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [customPrefillSymptoms, setCustomPrefillSymptoms] = useState('');

  // Search, Navigation & Auth States
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginSubmitted, setLoginSubmitted] = useState(false);

  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);
  const [partnerRefId, setPartnerRefId] = useState('');
  const [enquiryThankYouModalOpen, setEnquiryThankYouModalOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    orgName: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'Diagnostic Lab',
    city: '',
    message: '',
  });

  const [servicesDropdownHover, setServicesDropdownHover] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [familyCounter, setFamilyCounter] = useState(10482);

  // Splash Screen State: starts blank white, shows centered logo & welcome tagline, then smoothly fades out
  const [splashStep, setSplashStep] = useState<'blank' | 'content' | 'fading' | 'hidden'>('blank');

  // PWA Install Prompt State & Consent Dialog
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPwaInstallModal, setShowPwaInstallModal] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // 2. POPUP / MODAL BACK-BUTTON BEHAVIOR:
  // When any modal/popup/overlay is open, pressing the browser/device Back button closes ONLY the open popup/modal
  useEffect(() => {
    if (vitalLensOpen) return navHistory.pushModal('vitalLens', 'Vital Lens Scan', () => setVitalLensOpen(false));
  }, [vitalLensOpen]);

  useEffect(() => {
    if (isServiceBookingOpen) return navHistory.pushModal('serviceBooking', 'Service Booking', () => setIsServiceBookingOpen(false));
  }, [isServiceBookingOpen]);

  useEffect(() => {
    if (isWarningModalOpen) return navHistory.pushModal('warningModal', 'Guest Booking Warning', () => setIsWarningModalOpen(false));
  }, [isWarningModalOpen]);

  useEffect(() => {
    if (isConfirmationModalOpen) return navHistory.pushModal('confirmationModal', 'Booking Confirmed', () => setIsConfirmationModalOpen(false));
  }, [isConfirmationModalOpen]);

  useEffect(() => {
    if (myBookingsModalOpen) return navHistory.pushModal('myBookings', 'My Bookings', () => setMyBookingsModalOpen(false));
  }, [myBookingsModalOpen]);

  useEffect(() => {
    if (voiceAssistantOpen) return navHistory.pushModal('voiceAssistant', 'Voice Assistant', () => setVoiceAssistantOpen(false));
  }, [voiceAssistantOpen]);

  useEffect(() => {
    if (searchModalOpen) return navHistory.pushModal('searchModal', 'Global Search', () => setSearchModalOpen(false));
  }, [searchModalOpen]);

  useEffect(() => {
    if (loginModalOpen) return navHistory.pushModal('loginModal', 'Login Modal', () => setLoginModalOpen(false));
  }, [loginModalOpen]);

  useEffect(() => {
    if (partnerModalOpen) return navHistory.pushModal('partnerModal', 'Partner Modal', () => setPartnerModalOpen(false));
  }, [partnerModalOpen]);

  useEffect(() => {
    if (enquiryThankYouModalOpen) return navHistory.pushModal('enquiryThankYou', 'Enquiry Confirmation', () => setEnquiryThankYouModalOpen(false));
  }, [enquiryThankYouModalOpen]);

  useEffect(() => {
    if (showPwaInstallModal) return navHistory.pushModal('pwaInstall', 'PWA Install Prompt', () => setShowPwaInstallModal(false));
  }, [showPwaInstallModal]);

  useEffect(() => {
    if (mobileMenuOpen) return navHistory.pushModal('mobileMenu', 'Mobile Menu', () => setMobileMenuOpen(false));
  }, [mobileMenuOpen]);

  // Continuous horizontal auto-scroll & interactive drag controls for services section (Desktop & Mobile)
  const servicesMarqueeRef = useRef<HTMLDivElement | null>(null);
  const isMarqueeDragging = useRef(false);
  const marqueeStartX = useRef(0);
  const marqueeStartScrollLeft = useRef(0);
  const marqueeHasDragged = useRef(false);
  const isMarqueeHovered = useRef(false);
  const isMarqueeTouched = useRef(false);
  const [isMarqueeGrabbing, setIsMarqueeGrabbing] = useState(false);

  useEffect(() => {
    const el = servicesMarqueeRef.current;
    if (!el) return;

    let animId: number;
    let resumeTouchTimeout: any = null;

    // Center initial position to middle set for seamless 2-way infinite scroll
    const initScroll = () => {
      const setWidth = el.scrollWidth / 3;
      if (setWidth > 0 && el.scrollLeft === 0) {
        el.scrollLeft = setWidth;
      }
    };
    initScroll();
    const initTimer = setTimeout(initScroll, 350);

    const onMouseEnter = () => {
      isMarqueeHovered.current = true;
    };

    const onMouseLeave = () => {
      isMarqueeHovered.current = false;
    };

    const onTouchStart = () => {
      isMarqueeTouched.current = true;
      if (resumeTouchTimeout) clearTimeout(resumeTouchTimeout);
    };

    const onTouchEnd = () => {
      resumeTouchTimeout = setTimeout(() => {
        isMarqueeTouched.current = false;
      }, 1000);
    };

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    // Smooth continuous horizontal auto-scroll loop
    const scrollLoop = () => {
      if (el && !isMarqueeHovered.current && !isMarqueeDragging.current && !isMarqueeTouched.current) {
        el.scrollLeft += 0.85; // Smooth continuous horizontal scroll

        const setW = el.scrollWidth / 3;
        if (setW > 0) {
          if (el.scrollLeft >= setW * 2) {
            el.scrollLeft -= setW;
          } else if (el.scrollLeft < setW) {
            el.scrollLeft += setW;
          }
        }
      }
      animId = requestAnimationFrame(scrollLoop);
    };

    animId = requestAnimationFrame(scrollLoop);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(initTimer);
      if (resumeTouchTimeout) clearTimeout(resumeTouchTimeout);
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Global mousemove & mouseup listeners for seamless drag physics across viewport
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isMarqueeDragging.current) return;
      const el = servicesMarqueeRef.current;
      if (!el) return;

      const delta = e.clientX - marqueeStartX.current;
      if (Math.abs(delta) > 5) {
        marqueeHasDragged.current = true;
      }
      el.scrollLeft = marqueeStartScrollLeft.current - delta;

      // Wrap check while dragging
      const setW = el.scrollWidth / 3;
      if (setW > 0) {
        if (el.scrollLeft >= setW * 2) {
          el.scrollLeft -= setW;
          marqueeStartScrollLeft.current -= setW;
        } else if (el.scrollLeft < setW) {
          el.scrollLeft += setW;
          marqueeStartScrollLeft.current += setW;
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (isMarqueeDragging.current) {
        isMarqueeDragging.current = false;
        setIsMarqueeGrabbing(false);
        setTimeout(() => {
          marqueeHasDragged.current = false;
        }, 80);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleMarqueeMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary mouse button
    const el = servicesMarqueeRef.current;
    if (!el) return;

    isMarqueeDragging.current = true;
    marqueeHasDragged.current = false;
    marqueeStartX.current = e.clientX;
    marqueeStartScrollLeft.current = el.scrollLeft;
    setIsMarqueeGrabbing(true);
  };

  // Splash Screen Lifecycle on every page load/reload (extended by 2 seconds)
  useEffect(() => {
    // 1. Solid blank white screen for 350ms
    const t1 = setTimeout(() => {
      setSplashStep('content');
    }, 350);

    // 2. Keep centered logo and warm tagline visible, then begin fade out after 4.6s (2s longer)
    const t2 = setTimeout(() => {
      setSplashStep('fading');
    }, 4600);

    // 3. Fully remove from DOM after smooth 900ms fade transition at 5.5s
    const t3 = setTimeout(() => {
      setSplashStep('hidden');
    }, 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // PWA beforeinstallprompt & standalone detection
  useEffect(() => {
    // Check if already running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setIsAppInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setShowPwaInstallModal(false);
      setDeferredPrompt(null);
    });

    // Clean user-friendly consent popup trigger after splash screen finishes (adjusted for extended splash)
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('nhealth_pwa_dismissed');
      if (!dismissed && !isStandalone) {
        setShowPwaInstallModal(true);
      }
    }, 6000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsAppInstalled(true);
          setShowPwaInstallModal(false);
        }
      } catch {
        // Fallback or ignore
      }
      setDeferredPrompt(null);
    } else {
      // If browser doesn't support programmatic beforeinstallprompt (e.g. iOS Safari / Firefox)
      // Provide simple visual guidance or close gracefully
      alert("To install Nhealth on your device:\n• On iPhone/iPad: Tap the Share button and select 'Add to Home Screen'.\n• On Android/Chrome: Tap the three dots menu (⋮) and select 'Install app' or 'Add to Home screen'.");
      setShowPwaInstallModal(false);
      sessionStorage.setItem('nhealth_pwa_dismissed', 'true');
    }
  };

  const handleDismissPwa = () => {
    setShowPwaInstallModal(false);
    sessionStorage.setItem('nhealth_pwa_dismissed', 'true');
  };

  // Periodically increment trusted families counter to reflect network activity
  useEffect(() => {
    const timer = setInterval(() => {
      setFamilyCounter((prev) => prev + 1);
    }, 28000);
    return () => clearInterval(timer);
  }, []);

  // Filtered services for Search modal
  const filteredServices = ALL_SERVICES_DROPDOWN.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lead inquiry form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    serviceInterest: 'Home Diagnostics',
    addressOrCity: '',
    message: '',
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInquirySubmission = ({
    type,
    name,
    phone,
    email,
    categoryOrService,
    location,
    message,
    refId,
  }: {
    type: 'Healthcare Service Inquiry' | 'Corporate & Institutional Collaboration';
    name: string;
    phone: string;
    email?: string;
    categoryOrService?: string;
    location?: string;
    message?: string;
    refId: string;
  }) => {
    // Intercept form submission and store structured data payload into the central database store
    const newEnquiry = addEnquiry({
      id: refId,
      type,
      name,
      phone,
      email: email || '',
      categoryOrService: categoryOrService || 'Healthcare Service',
      location: location || '',
      requirements: message || 'Inquiry regarding healthcare services.',
      submittedAt: new Date().toISOString(),
      status: 'Pending',
      rawPayload: {
        type,
        name,
        phone,
        email,
        categoryOrService,
        location,
        message,
        source: 'MainPortalInquiry',
      },
    });

    setEnquiries((prev) => [newEnquiry, ...prev]);

    // Completely removed direct email (mailto) and WhatsApp window.open actions as requested.

    // Trigger modal pop-up with confirmation
    setEnquiryThankYouModalOpen(true);
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedRef = 'NH-' + Math.floor(100000 + Math.random() * 900000);
    setReferenceId(generatedRef);
    setIsSubmitting(false);
    setFormSubmitted(true);
    setFamilyCounter((prev) => prev + 1);

    handleInquirySubmission({
      type: 'Healthcare Service Inquiry',
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      categoryOrService: formData.serviceInterest,
      location: formData.addressOrCity,
      message: formData.message,
      refId: generatedRef,
    });
  };

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = 'NH-PARTNER-' + Math.floor(1000 + Math.random() * 9000);
    setPartnerRefId(ref);
    setPartnerSubmitted(true);
    setPartnerModalOpen(false);

    handleInquirySubmission({
      type: 'Corporate & Institutional Collaboration',
      name: `${partnerForm.contactPerson} (${partnerForm.orgName})`,
      phone: partnerForm.phone,
      email: partnerForm.email,
      categoryOrService: partnerForm.category,
      location: partnerForm.city,
      message: partnerForm.message,
      refId: ref,
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem('nhealth_user');
      sessionStorage.removeItem('nhealth_user');
    } catch {}
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setCurrentRoute('home');
  };

  const finalizeBooking = (
    data: BookingFormData | null,
    isGuest: boolean,
    userId?: string
  ) => {
    if (!data) return;
    const generatedRef = 'NH-' + Math.floor(100000 + Math.random() * 900000);
    const confirmed: ConfirmedBooking = {
      referenceId: generatedRef,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      patientName: data.patientName,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      whatsapp: data.whatsapp,
      state: data.state,
      city: data.city,
      symptoms: data.symptoms,
      address: data.address,
      preferredDate: data.preferredDate,
      preferredTimeSlot: data.preferredTimeSlot,
      bookedAt: new Date().toISOString(),
      isGuest,
      userId: isGuest ? undefined : (userId || currentUser?.id),
      status: 'Confirmed',
    };

    if (!isGuest) {
      setBookingHistory((prev) => {
        const updated = [confirmed, ...prev];
        try {
          localStorage.setItem('nhealth_bookings', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } else {
      saveGuestBooking(confirmed);
    }

    setConfirmedBookingData(confirmed);
    setIsConfirmationModalOpen(true);
    setFamilyCounter((prev) => prev + 1);
    setPendingDraftBooking(null);
  };

  const handleBookingFormSubmit = (formData: BookingFormData) => {
    if (!isLoggedIn) {
      // Intercept submission if guest and open strictly defined Warning Modal!
      setPendingDraftBooking(formData);
      setIsServiceBookingOpen(false);
      setIsWarningModalOpen(true);
    } else {
      // Logged-in user: skip warning modal entirely and submit directly
      setIsServiceBookingOpen(false);
      finalizeBooking(formData, false, currentUser?.id);
    }
  };

  const openBookingFor = (serviceName: string) => {
    setBookingServiceType(serviceName);
    const sNameLower = serviceName.toLowerCase();
    const matched = EXTRACTED_SERVICES.find(
      (s) =>
        s.name.toLowerCase() === sNameLower ||
        s.id.toLowerCase() === sNameLower ||
        sNameLower.includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(sNameLower)
    );

    if (matched) {
      setSelectedServiceForBooking(matched);
    } else {
      setSelectedServiceForBooking(EXTRACTED_SERVICES[0]);
    }
    setIsServiceBookingOpen(true);
  };

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToServicesGrid = () => {
    const element = document.getElementById('services-grid') || document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.hash = '#services-grid';
    }
  };

  // Duplicate items array for seamless infinite marquee loop
  // Dedicated Page Routing Views (/auth, /partner-with-us, /command-center)
  if (currentRoute === 'auth') {
    return (
      <AuthPage
        onSuccess={handleAuthSuccess}
        onNavigateHome={() => navigateTo('home', '/')}
        onNavigatePartnerOnboarding={() => navigateTo('partner-with-us', '/partner-with-us')}
        onNavigateAdmin={() => navigateTo('command-center', '/command-center')}
        partners={partners}
        onUpdatePartner={handleUpdatePartner}
      />
    );
  }

  if (currentRoute === 'partner-with-us') {
    return (
      <PartnerOnboardingPage
        onAddPartner={handleAddPartner}
        onNavigateHome={() => navigateTo('home', '/')}
      />
    );
  }

  if (currentRoute === 'command-center') {
    return (
      <AdminDashboardPage
        partners={partners}
        onTogglePartnerStatus={handleTogglePartnerStatus}
        onUpdatePartner={handleUpdatePartner}
        enquiries={enquiries}
        onUpdateEnquiryStatus={(id, status, notes) => {
          const updated = updateEnquiryStatus(id, status, notes);
          setEnquiries(updated);
        }}
        onNavigateHome={() => navigateTo('home', '/')}
        onNavigateOnboarding={() => navigateTo('partner-with-us', '/partner-with-us')}
      />
    );
  }

  if (currentRoute === 'corporate-enquiries') {
    return (
      <CorporateEnquiriesPage
        onNavigateHome={() => navigateTo('home', '/')}
        onNavigatePartner={() => navigateTo('partner-with-us', '/partner-with-us')}
        onEnquirySubmitted={(newEnq) => setEnquiries((prev) => [newEnq, ...prev])}
      />
    );
  }

  if (currentRoute === 'teams') {
    return (
      <TeamsPage
        onNavigateHome={() => navigateTo('home', '/')}
        onNavigatePartner={() => navigateTo('partner-with-us', '/partner-with-us')}
        onNavigateCorporate={() => navigateTo('corporate-enquiries', '/corporate-enquiries')}
      />
    );
  }

  if (currentRoute === 'dashboard') {
    const fallbackUser: UserAccount = {
      id: 'USR-88210',
      name: 'Ramesh Kumar',
      phone: '9876543210',
      email: 'ramesh.kumar@gmail.com',
      accountType: 'Patient',
      role: 'Patient',
      roles: ['Patient'],
    };
    return (
      <RoleBasedDashboard
        currentUser={currentUser || fallbackUser}
        allPartners={partners}
        onLogout={handleLogout}
        onNavigateHome={() => navigateTo('home', '/')}
        onNavigateBooking={(serviceName) => {
          navigateTo('home', '/');
          setTimeout(() => {
            const el = document.getElementById('services-grid');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onSwitchRole={(newRole) => {
          if (currentUser) {
            const updated: UserAccount = {
              ...currentUser,
              role: newRole,
              accountType: newRole,
              roles: Array.from(new Set([...(currentUser.roles || []), newRole])),
            };
            setCurrentUser(updated);
            try {
              localStorage.setItem('nhealth_user', JSON.stringify(updated));
            } catch {}
          }
        }}
      />
    );
  }

  if (currentRoute === 'patient-dashboard' || (isLoggedIn && (currentUser?.role === 'Patient' || currentUser?.accountType === 'Patient'))) {
    return (
      <>
        <PatientDashboardPage
          currentUser={currentUser}
          bookingHistory={bookingHistory}
          onNavigateHome={() => {
            // Stay within Patient Dashboard - do not redirect to Hero page
            setCurrentRoute('patient-dashboard');
          }}
          onOpenBookingModal={(serviceType) => openBookingFor(serviceType)}
          onOpenVitalLens={() => setVitalLensOpen(true)}
          onLogout={handleLogout}
        />
        {/* Nhealth Vital Lens: AI Camera Biometrics Scan Modal */}
        <VitalLensModal
          isOpen={vitalLensOpen}
          onClose={() => setVitalLensOpen(false)}
          onBookDoctor={(serviceName) => {
            setVitalLensOpen(false);
            openBookingFor(serviceName || 'Online doctor consultations');
          }}
          defaultUserData={{
            name: currentUser?.name,
            phone: currentUser?.phone,
          }}
        />
        {/* Nhealth Service Booking Modal */}
        <ServiceBookingModal
          service={selectedServiceForBooking}
          isOpen={isServiceBookingOpen}
          onClose={() => {
            setIsServiceBookingOpen(false);
            setSelectedServiceForBooking(null);
            setCustomPrefillSymptoms('');
          }}
          onSubmitBooking={handleBookingFormSubmit}
          initialPhone={currentUser?.phone || ''}
          initialName={currentUser?.name || ''}
          initialSymptoms={customPrefillSymptoms}
        />
        {/* Booking Confirmation Modal */}
        <BookingConfirmationModal
          booking={confirmedBookingData}
          isOpen={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          isLoggedIn={isLoggedIn}
          onViewHistory={() => {}}
        />
      </>
    );
  }

  // Triplicate items array for bidirectional seamless infinite marquee loop & drag wrapping
  const marqueeItems = [...HERO_MARQUEE_SERVICES, ...HERO_MARQUEE_SERVICES, ...HERO_MARQUEE_SERVICES];

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-[#008080]/15 selection:text-[#002b49] w-full max-w-full overflow-x-hidden">
      {/* Top Bar Header (Frozen / Fixed in place) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/98 border-b border-slate-200/80 shadow-xs backdrop-blur-md w-full">
        <div className="w-full lg:max-w-none px-2.5 sm:px-5 lg:px-6 xl:px-8 2xl:px-12 h-20 flex items-center justify-between min-w-0">
          {/* Zone 1: Brand Wordmark & Official Logo */}
          <a
            href="#home"
            onClick={(e) => {
              if (currentRoute !== 'home') {
                e.preventDefault();
                navigateTo('home', '/');
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2 group transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 pr-1 sm:pr-2 xl:pr-4"
          >
            <img
              src={NHEALTH_LOGO_URL}
              alt="Nhealth Logo"
              className="h-7 sm:h-9 lg:h-11 w-auto object-contain shrink-0"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== window.location.origin + NHEALTH_LOGO_FALLBACK) {
                  target.src = NHEALTH_LOGO_FALLBACK;
                }
              }}
            />
            <span
              style={{ fontFamily: "'Poppins', 'Montserrat', sans-serif", fontWeight: 600 }}
              className="text-base sm:text-2xl lg:text-3xl tracking-tight text-[#002b49]"
            >
              Nhealth™
            </span>
          </a>

          {/* Zone 2: Navigation Links with Services Hover Dropdown - Centered & Flexible across Complete Desktop */}
          <nav className="hidden lg:flex items-center flex-1 justify-center gap-1 xl:gap-2 2xl:gap-4 text-[12px] xl:text-[13px] 2xl:text-sm font-semibold text-slate-700 whitespace-nowrap min-w-0 px-1">
            <a
              href="#home"
              onClick={(e) => {
                if (currentRoute !== 'home') {
                  e.preventDefault();
                  navigateTo('home', '/');
                }
              }}
              className="hover:text-[#008080] transition-colors py-1.5 px-1.5 xl:px-2 rounded-lg whitespace-nowrap shrink-0"
            >
              Home
            </a>

            {/* Services with Hover Dropdown (All 16 visible simultaneously with zero vertical scrollbar) */}
            <div
              className="relative py-2 group shrink-0"
              onMouseEnter={() => setServicesDropdownHover(true)}
              onMouseLeave={() => setServicesDropdownHover(false)}
            >
              <a
                href="#services-grid"
                onClick={(e) => {
                  if (currentRoute !== 'home') {
                    e.preventDefault();
                    navigateTo('home', '/');
                    setTimeout(scrollToServicesGrid, 150);
                  }
                }}
                className="inline-flex items-center gap-1 hover:text-[#008080] transition-colors py-1.5 px-1.5 xl:px-2 rounded-lg whitespace-nowrap shrink-0"
              >
                <span>Services</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesDropdownHover ? 'rotate-180 text-[#008080]' : ''}`} />
              </a>

              {/* Complete 16-Service Dropdown without vertical scrollbar */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 z-50 ${
                  servicesDropdownHover ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible pointer-events-none -translate-y-2'
                }`}
              >
                <div className="w-[660px] xl:w-[720px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 overflow-visible">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#008080] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                      <span>All Unified Healthcare &amp; At-Home Services (16)</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Instant Doorstep Booking</span>
                  </div>

                  {/* 2-Column Grid (8 per column) - Zero Scrollbar, All Items Visible at Once */}
                  <div className="grid grid-cols-2 gap-x-5 gap-y-1">
                    {ALL_SERVICES_DROPDOWN.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setServicesDropdownHover(false);
                            if (currentRoute !== 'home') {
                              navigateTo('home', '/');
                              setTimeout(() => openBookingFor(item.name), 150);
                            } else {
                              openBookingFor(item.name);
                            }
                          }}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs font-medium text-slate-700 hover:text-[#008080] hover:bg-[#e6f4f4]/60 transition-colors cursor-pointer group/item"
                        >
                          <div className="w-6 h-6 rounded-md bg-slate-100 group-hover/item:bg-[#008080] text-slate-500 group-hover/item:text-white flex items-center justify-center shrink-0 transition-colors">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate group-hover/item:font-semibold">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <a
              href="#how-it-works"
              onClick={(e) => {
                if (currentRoute !== 'home') {
                  e.preventDefault();
                  navigateTo('home', '/');
                  setTimeout(() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }
              }}
              className="hover:text-[#008080] transition-colors py-1.5 px-1.5 xl:px-2 rounded-lg whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#about-us"
              onClick={(e) => {
                if (currentRoute !== 'home') {
                  e.preventDefault();
                  navigateTo('home', '/');
                  setTimeout(() => {
                    document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }
              }}
              className="hover:text-[#008080] transition-colors py-1.5 px-1.5 xl:px-2 rounded-lg whitespace-nowrap shrink-0"
            >
              About Us
            </a>
            <a
              href="#teams"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('teams', '#teams');
              }}
              className="hover:text-[#008080] transition-colors py-1.5 px-1.5 xl:px-2 rounded-lg whitespace-nowrap shrink-0"
            >
              Teams
            </a>
            <a
              href="/corporate-enquiries"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('corporate-enquiries', '/corporate-enquiries');
              }}
              className="hover:text-[#008080] transition-colors py-1.5 px-1.5 xl:px-2 rounded-lg whitespace-nowrap shrink-0"
            >
              Corporate Enquiries
            </a>
            <a
              href="#partners"
              onClick={(e) => {
                if (currentRoute !== 'home') {
                  e.preventDefault();
                  navigateTo('home', '/');
                  setTimeout(() => {
                    document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }
              }}
              className="hover:text-[#008080] transition-colors py-1.5 px-1.5 xl:px-2 rounded-lg whitespace-nowrap shrink-0"
            >
              Partners
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                if (currentRoute !== 'home') {
                  e.preventDefault();
                  navigateTo('home', '/');
                  setTimeout(scrollToContact, 150);
                }
              }}
              className="hover:text-[#008080] transition-colors py-1.5 px-2 xl:px-2.5 rounded-lg whitespace-nowrap shrink-0"
            >
              Contact Us
            </a>
          </nav>

          {/* Dedicated Visual Separator - Guarantees Contact Us & Search Icon Never Overlap */}
          <div className="hidden lg:block h-6 w-px bg-slate-200/90 shrink-0 mx-2 xl:mx-3" />

          {/* Zone 3: Search Icon, Partner Button, Login Button - Strictly Isolated with Zero Overlap */}
          <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-3 shrink-0 ml-auto lg:ml-0">
            {/* Search Icon */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-[#008080] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 border border-slate-200/80"
              title="Search Services"
              aria-label="Search Services"
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>


            {/* Partner With Us Dedicated Button */}
            <button
              type="button"
              onClick={() => navigateTo('partner-with-us', '/partner-with-us')}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 xl:px-3 py-1.5 sm:py-2 rounded-xl border border-[#002b49]/30 text-[#002b49] hover:bg-teal-50/50 hover:border-[#008080] transition-colors whitespace-nowrap cursor-pointer shrink-0"
            >
              <Building2 className="w-3.5 h-3.5 text-[#008080]" />
              <span>Partner With Us</span>
            </button>

            {/* Login / Auth State Button */}
            {isLoggedIn && currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard', '/dashboard')}
                  className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#008080] border border-teal-200 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                  title="Open Your Role-Based Healthcare Dashboard"
                >
                  <Activity className="w-3.5 h-3.5 text-[#008080]" />
                  <span className="max-w-[70px] sm:max-w-[85px] xl:max-w-[130px] truncate">{currentUser.name || 'Dashboard'}</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-teal-200/60 text-teal-900 hidden lg:inline">
                    {currentUser.role || currentUser.accountType || 'Portal'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[11px] font-bold text-slate-400 hover:text-red-600 px-1 py-1 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigateTo('auth', '/auth')}
                className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#002b49] hover:bg-[#003d66] text-white transition-colors whitespace-nowrap cursor-pointer shrink-0 shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-white" />
                <span>Login/Signup</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button - 100% visible, fully touchable */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-700 hover:text-[#008080] hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors cursor-pointer shrink-0 border border-slate-200/80 sm:border-transparent z-10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-5 shadow-xl animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
            <div className="flex flex-col space-y-3 pb-4 border-b border-slate-100">
              <a
                href="#home"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-800 hover:text-[#008080] py-1.5"
              >
                Home
              </a>
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-800 hover:text-[#008080] py-1.5 flex items-center justify-between"
              >
                <span>Services (16 Unified Offerings)</span>
                <span className="text-[10px] font-bold text-[#008080] bg-teal-50 px-2 py-0.5 rounded-full">All Available</span>
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-800 hover:text-[#008080] py-1.5"
              >
                How It Works
              </a>
              <a
                href="#about-us"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-800 hover:text-[#008080] py-1.5"
              >
                About Us
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('teams', '#teams');
                }}
                className="w-full text-left text-sm font-semibold text-slate-800 hover:text-[#008080] py-1.5 cursor-pointer"
              >
                Teams
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('corporate-enquiries', '/corporate-enquiries');
                }}
                className="w-full text-left text-sm font-semibold text-slate-800 hover:text-[#008080] py-1.5 cursor-pointer"
              >
                Corporate Enquiries
              </button>
              <a
                href="#partners"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-800 hover:text-[#008080] py-1.5"
              >
                Partners &amp; Labs
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-800 hover:text-[#008080] py-1.5"
              >
                Contact Us
              </a>
            </div>

            <div className="pt-4 flex flex-col gap-2.5">
              {/* Mobile Drawer AI Face Vitals Scan */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setVitalLensOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-purple-700 via-fuchsia-700 to-indigo-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <Activity className="w-4 h-4 text-purple-200 animate-pulse" />
                <span>AI Face Vitals Scan (Nhealth Vital Lens)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('partner-with-us', '/partner-with-us');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#002b49]/30 text-[#002b49] text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#008080]" />
                <span>Partner With Us Portal (/partner-with-us)</span>
              </button>

              {isLoggedIn && currentUser ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('dashboard', '/dashboard');
                    }}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#008080] border border-teal-200 text-xs font-bold cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#008080]" />
                      <span>My Dashboard ({currentUser.role || currentUser.accountType || 'Portal'})</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-200 text-teal-900 font-bold">
                      Open Console →
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setMyBookingsModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    <span>My Bookings &amp; Reports</span>
                    {bookingHistory.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#008080] text-white text-[10px] font-bold">
                        {bookingHistory.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Logout Account
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo('auth', '/auth');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#002b49] hover:bg-[#001f35] text-white text-xs font-semibold cursor-pointer"
                >
                  <User className="w-4 h-4 text-white" />
                  <span>Patient Login &amp; Registration (/auth)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('patient-dashboard', '/patient-dashboard');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#00172d] hover:bg-[#00223f] text-cyan-300 border border-cyan-800/40 text-xs font-semibold cursor-pointer"
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Patient Dashboard (/patient-dashboard)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openBookingFor('General Consultation');
                }}
                className="w-full py-2.5 rounded-lg bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold text-center shadow-xs cursor-pointer"
              >
                Book Doorstep Healthcare Visit
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20 w-full shrink-0" aria-hidden="true" />

      {/* Main Content */}
      <main className="flex-1">
        {/* Desktop Hero Section: Completely untouched and preserved, visible ONLY when screen width >= 768px */}
        <section
          id="home"
          className="hero-desktop-only relative overflow-hidden bg-[#00172b] border-b border-slate-200/80 min-h-[580px] lg:min-h-[640px] xl:min-h-[700px] items-center"
          style={{
            backgroundImage: `url(${HERO_BANNER_WIDE_URL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Resilient image layer for offline and fast loading */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={HERO_BANNER_WIDE_URL}
              alt="Nhealth Healthcare at Home Network Hub"
              loading="eager"
              className="w-full h-full object-cover object-right lg:object-center"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== window.location.origin + HERO_BANNER_WIDE_FALLBACK) {
                  target.src = HERO_BANNER_WIDE_FALLBACK;
                  const parent = target.closest('section');
                  if (parent) {
                    parent.style.backgroundImage = `url(${HERO_BANNER_WIDE_FALLBACK})`;
                  }
                }
              }}
            />
          </div>

          {/* Protective Subtle Dark Gradient Overlay across the left empty area to guarantee high-contrast legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#001424]/95 via-[#00172b]/85 to-transparent pointer-events-none z-1 lg:w-3/5 xl:w-[58%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#001424]/80 via-transparent to-transparent pointer-events-none z-1 md:hidden" />

          {/* Overlapping Content Container on the Vast Left Dark Blue Area */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full py-10 lg:py-14 min-h-[580px] lg:min-h-[640px] xl:min-h-[700px] flex flex-col justify-between">
            <div className="max-w-md lg:max-w-lg flex flex-col justify-between flex-1 py-1">
              {/* Upper Headline & Mission Statement */}
              <div className="space-y-4 pt-1">
                <h1
                  style={{ fontSize: '27px' }}
                  className="font-extrabold text-white leading-tight tracking-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] max-w-sm sm:max-w-md lg:max-w-2xl"
                >
                  {/* Line 1: BHARAT BIGGEST NETWORK in clean gold color without sparkling/shimmer effect */}
                  <span className="text-[#f59e0b] sm:text-[#fbbf24] uppercase font-black tracking-wide inline-block">
                    BHARAT BIGGEST NETWORK
                  </span>
                  <br />
                  {/* Next lines in 2 lines - 3 times bigger than previous base/18px/20px (~54px to 60px) */}
                  <span
                    style={{ fontSize: '54px', lineHeight: '1.08' }}
                    className="text-white font-extrabold tracking-tight uppercase block mt-3"
                  >
                    POWERING THE FUTURE OF<br />
                    UNIFIED &amp; AT HOME - HEALTHCARE
                  </span>
                </h1>

                {/* Requirement 2: Descriptive care guarantee below the headline - moved downwards to create required space */}
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-sm sm:max-w-xl drop-shadow-sm pt-4 font-medium">
                  Access reliable diagnostic sample collection, expert doctor home visits, and professional care coordination right from the comfort of your home.
                </p>

                {/* Book a Service button & Live Trusted by Families counter side-by-side */}
                <div className="pt-2 flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    onClick={scrollToServicesGrid}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#008080] to-[#009b9b] hover:from-[#006666] hover:to-[#008080] text-white text-sm sm:text-base font-bold shadow-lg shadow-teal-900/40 hover:shadow-xl hover:shadow-teal-900/60 active:scale-[0.98] transition-all cursor-pointer border border-teal-400/30 group shrink-0"
                  >
                    <span>Book a Service</span>
                    <ArrowRight className="w-4 h-4 text-teal-200 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Moved here next to book a service button: Compact Trusted by 10000+ happy families tab with LIVE badge and glowing pulse */}
                  <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-teal-500/20 border border-amber-400/40 text-amber-200 text-xs sm:text-[13px] font-semibold backdrop-blur-md shadow-sm shrink-0">
                    {/* Live indicator badge */}
                    <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-[10px] font-black uppercase tracking-wider text-red-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      LIVE
                    </span>
                    <span>Trusted by <span className="font-extrabold text-white tabular-nums tracking-wide">{familyCounter.toLocaleString()}</span>+ happy families</span>
                  </div>
                </div>
              </div>

              {/* Badges brought down to the lower end of the section */}
              <div className="mt-auto pt-6 border-t border-white/20 space-y-3 max-w-sm sm:max-w-md pb-14">
                {/* 3 Badges moved closer to each other with Fastest digital report delivery in middle */}
                <div className="grid grid-cols-3 gap-2 text-left">
                  <div className="bg-[#00172b]/85 border border-white/10 rounded-lg p-2.5 backdrop-blur-xs">
                    <div className="text-base sm:text-lg font-extrabold text-[#38bdf8] tabular-nums leading-tight">100%</div>
                    <div className="text-[10px] text-slate-200 font-medium leading-tight mt-0.5">Sanitized Home Protocols</div>
                  </div>
                  <div className="bg-[#00172b]/85 border border-white/10 rounded-lg p-2.5 backdrop-blur-xs">
                    <div className="text-xs sm:text-sm font-extrabold text-[#38bdf8] leading-tight pt-0.5">Fastest</div>
                    <div className="text-[10px] text-slate-200 font-medium leading-tight mt-0.5">Digital Report Delivery</div>
                  </div>
                  <div className="bg-[#00172b]/85 border border-white/10 rounded-lg p-2.5 backdrop-blur-xs">
                    <div className="text-base sm:text-lg font-extrabold text-[#facc15] tabular-nums leading-tight">NABL</div>
                    <div className="text-[10px] text-slate-200 font-medium leading-tight mt-0.5">Accredited Partners</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Animated Vehicle Track: Positioned at the very bottom end of the desktop hero section, resting right on the hero bottom edge line */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden h-[180px] pointer-events-none z-20">
            {/* Convoy Container: Scooty in front + Auto following + Car following Auto */}
            <div className="animate-convoy-desktop w-max flex items-end absolute bottom-0 left-0 select-none transition-transform gap-7 pointer-events-auto">
              {/* VEHICLE 3: Healthcare Car following the auto (proportionate desktop size ~240px, transparent background, tire aligned on line) */}
              <div
                onClick={() => openBookingFor('CareRide / At-Home Healthcare')}
                title="Click & Book CareRide"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openBookingFor('CareRide / At-Home Healthcare');
                  }
                }}
                className="relative flex flex-col items-center cursor-pointer group shrink-0"
              >
                {/* Transparent Healthcare Car Asset (following auto, proportionate desktop size ~240px width, tires touching bottom line) */}
                <img
                  src="/healthcare-van.png"
                  alt="Nhealth Healthcare Fleet Car"
                  className="w-[240px] h-auto object-contain select-none pointer-events-auto group-hover:scale-[1.03] transition-transform drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
                  style={{
                    marginBottom: '-1px' // Ensures tires touch the top edge of the end of hero section line
                  }}
                  loading="eager"
                />
              </div>

              {/* VEHICLE 2: Auto following the existing scooty (proportionate desktop size ~180px, transparent background, tire aligned on line) */}
              <div
                onClick={() => openBookingFor('CareRide / At-Home Healthcare')}
                title="Click & Book CareRide"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openBookingFor('CareRide / At-Home Healthcare');
                  }
                }}
                className="relative flex flex-col items-center cursor-pointer group shrink-0"
              >
                {/* Transparent Auto Asset (following scooty, proportionate desktop size ~180px width, tires touching bottom line) */}
                <img
                  src="/auto-care-ride.png"
                  alt="Nhealth CareRide Auto Service"
                  className="w-[180px] h-auto object-contain select-none pointer-events-auto group-hover:scale-[1.03] transition-transform drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
                  style={{
                    marginBottom: '-1px' // Ensures tires touch the top edge of the end of hero section line
                  }}
                  loading="eager"
                />
              </div>

              {/* VEHICLE 1: Scooty in front with rider */}
              <div
                onClick={() => openBookingFor('CareRide / At-Home Healthcare')}
                title="Click & Book CareRide"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openBookingFor('CareRide / At-Home Healthcare');
                  }
                }}
                className="relative flex flex-col items-center cursor-pointer group shrink-0"
              >
                {/* Traveling Button on the rider helmet: clearly visible (Click & Book CareRide) */}
                <div className="absolute -top-[38px] left-[44%] -translate-x-1/2 flex flex-col items-center z-30 pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openBookingFor('CareRide / At-Home Healthcare');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 group-hover:from-emerald-400 group-hover:via-teal-400 group-hover:to-cyan-400 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-teal-950/80 border-2 border-white/95 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    title="Click & Book CareRide"
                    aria-label="Click and book CareRide"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping shrink-0" />
                    <span>Click &amp; Book CareRide</span>
                  </button>
                  {/* Pointer notch pointing down to rider helmet */}
                  <div className="w-2.5 h-2.5 bg-teal-500 rotate-45 -mt-1 border-r border-b border-white/95 shrink-0 group-hover:bg-teal-400 transition-colors" />
                </div>

                {/* Transparent Scooty Rider Asset (desktop size ~175px width) - Tires touching the top edge of the end of hero section line */}
                <img
                  src="/scooty-rider.png"
                  alt="Nhealth CareRide Professional on Scooty"
                  className="w-[175px] h-auto object-contain select-none pointer-events-auto group-hover:scale-[1.03] transition-transform drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
                  style={{
                    marginBottom: '-1px' // Ensures tires touch the top edge of the end of hero section line
                  }}
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Dedicated Separate Mobile & Tablet Hero Section: Visible ONLY when screen width < 1024px */}
        <section
          id="home-mobile"
          className="hero-mobile-only relative bg-[#00172b] text-white overflow-hidden border-b border-slate-200/80"
        >
          {/* Edge-to-Edge Hero Image Container: 100% full screen width, zero side padding/margins, fluid scaling */}
          <div className="w-full max-w-none p-0 m-0 block">
            <img
              src={MOBILE_HERO_IMAGE_URL}
              alt="Nhealth Healthcare at Home Network Hub"
              loading="eager"
              className="w-full max-w-none h-auto block"
              style={{
                width: '100%',
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                margin: 0,
                padding: 0
              }}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== window.location.origin + MOBILE_HERO_IMAGE_FALLBACK) {
                  target.src = MOBILE_HERO_IMAGE_FALLBACK;
                }
              }}
            />
          </div>

          {/* Interactive controls, CTA, live counter & accreditation badges */}
          <div className="max-w-xl mx-auto px-4 sm:px-6 pt-4 pb-7 flex flex-col items-center">
            {/* CTA & Live Counter Row: Book a Service Button on left with Live Trusted Counter on the right side */}
            <div className="w-full max-w-md mx-auto mb-3.5 flex flex-row items-center justify-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={scrollToServicesGrid}
                className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-xl bg-gradient-to-r from-[#008080] to-[#009b9b] hover:from-[#006666] hover:to-[#008080] text-white font-bold shadow-lg shadow-teal-950/60 active:scale-[0.98] transition-all cursor-pointer border border-teal-400/40 text-center min-h-[42px]"
              >
                <div className="flex flex-col items-center justify-center leading-tight">
                  <span className="text-xs sm:text-sm font-bold whitespace-nowrap leading-tight">Book a</span>
                  <span className="text-xs sm:text-sm font-bold whitespace-nowrap leading-tight">Service</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-200 shrink-0" />
              </button>

              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-[#00172b]/90 border border-amber-400/50 text-amber-200 text-[10px] sm:text-xs font-semibold backdrop-blur-md shadow-md shrink-0 min-h-[42px]">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider text-red-400 shrink-0">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  LIVE
                </span>
                <span className="whitespace-nowrap">
                  Trusted by <span className="font-extrabold text-white tabular-nums">{familyCounter.toLocaleString()}</span>+ happy families
                </span>
              </div>
            </div>

            {/* Overlapped 100% Sanitized Protocols & Accredited Labs Badges Grid */}
            <div className="w-full max-w-md mx-auto pt-2.5 border-t border-white/20">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                <div className="bg-[#00172b]/90 border border-white/20 rounded-lg sm:rounded-xl py-1.5 px-1 sm:py-2 sm:px-2 backdrop-blur-md shadow-sm flex flex-col items-center justify-center">
                  <div className="text-xs sm:text-sm font-black text-[#38bdf8] tabular-nums leading-none">100%</div>
                  <div className="text-[8px] xs:text-[9px] sm:text-[9.5px] text-slate-100 font-semibold leading-tight mt-0.5 text-center">Sanitized Protocols</div>
                </div>
                <div className="bg-[#00172b]/90 border border-white/20 rounded-lg sm:rounded-xl py-1.5 px-1 sm:py-2 sm:px-2 backdrop-blur-md shadow-sm flex flex-col items-center justify-center">
                  <div className="text-xs sm:text-sm font-black text-[#38bdf8] leading-none">Fastest</div>
                  <div className="text-[8px] xs:text-[9px] sm:text-[9.5px] text-slate-100 font-semibold leading-tight mt-0.5 text-center">Digital Delivery</div>
                </div>
                <div className="bg-[#00172b]/90 border border-white/20 rounded-lg sm:rounded-xl py-1.5 px-1 sm:py-2 sm:px-2 backdrop-blur-md shadow-sm flex flex-col items-center justify-center">
                  <div className="text-xs sm:text-sm font-black text-[#facc15] tabular-nums leading-none">NABL</div>
                  <div className="text-[8px] xs:text-[9px] sm:text-[9.5px] text-slate-100 font-semibold leading-tight mt-0.5 text-center">Accredited Labs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Full-Width Animated Vehicle Track: Positioned between 100% Sanitized div and end of hero section line, resting right on the end of hero section line */}
          <div className="w-full relative overflow-hidden h-[154px] mt-1 border-b border-white/20">
            {/* Convoy Container: Scooty in front + Auto following + Car following Auto */}
            <div
              className="animate-convoy-ride hover:[animation-play-state:paused] active:[animation-play-state:paused] focus-within:[animation-play-state:paused] w-max flex items-end absolute bottom-0 left-0 select-none transition-transform gap-4 sm:gap-6"
            >
              {/* VEHICLE 3: Healthcare Car following the auto on mobile (proportionate mobile size ~185px, transparent background, tire aligned on line) */}
              <div
                onClick={() => openBookingFor('CareRide / At-Home Healthcare')}
                title="Click & Book CareRide"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openBookingFor('CareRide / At-Home Healthcare');
                  }
                }}
                className="relative flex flex-col items-center cursor-pointer group shrink-0"
              >
                {/* Transparent Healthcare Car Asset (following auto, proportionate mobile size ~185px width, tires touching line) */}
                <img
                  src="/healthcare-van.png"
                  alt="Nhealth Healthcare Fleet Car"
                  className="w-[185px] h-auto object-contain select-none pointer-events-auto group-hover:scale-[1.03] transition-transform drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                  style={{
                    marginBottom: '-1px' // Ensures tires touch the top edge of the end of hero section line
                  }}
                  loading="eager"
                />
              </div>

              {/* VEHICLE 2: Auto following the existing scooty (similar size ~145px, transparent background, tire aligned on line) */}
              <div
                onClick={() => openBookingFor('CareRide / At-Home Healthcare')}
                title="Click & Book CareRide"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openBookingFor('CareRide / At-Home Healthcare');
                  }
                }}
                className="relative flex flex-col items-center cursor-pointer group shrink-0"
              >
                {/* Transparent Auto Asset (following scooty, proportionate size ~145px width, tires touching line) */}
                <img
                  src="/auto-care-ride.png"
                  alt="Nhealth CareRide Auto Service"
                  className="w-[145px] h-auto object-contain select-none pointer-events-auto group-hover:scale-[1.03] transition-transform drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                  style={{
                    marginBottom: '-1px' // Ensures tires touch the top edge of the end of hero section line
                  }}
                  loading="eager"
                />
              </div>

              {/* VEHICLE 1: Scooty in front with woman rider */}
              <div
                onClick={() => openBookingFor('CareRide / At-Home Healthcare')}
                title="Click & Book CareRide"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openBookingFor('CareRide / At-Home Healthcare');
                  }
                }}
                className="relative flex flex-col items-center cursor-pointer group shrink-0"
              >
                {/* Traveling Button on the rider helmet: clearly visible (Click & Book CareRide) */}
                <div className="absolute -top-[36px] left-[44%] -translate-x-1/2 flex flex-col items-center z-30 pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openBookingFor('CareRide / At-Home Healthcare');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 group-hover:from-emerald-400 group-hover:via-teal-400 group-hover:to-cyan-400 hover:brightness-110 text-white font-black text-[11px] shadow-lg shadow-teal-950/80 border-2 border-white/95 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    title="Click & Book CareRide"
                    aria-label="Click and book CareRide"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping shrink-0" />
                    <span>Click &amp; Book CareRide</span>
                  </button>
                  {/* Pointer notch pointing down to rider helmet */}
                  <div className="w-2 h-2 bg-teal-500 rotate-45 -mt-1 border-r border-b border-white/95 shrink-0 group-hover:bg-teal-400 transition-colors" />
                </div>

                {/* 3x Scooty Rider Asset (138px width) - Tires touching the top edge of the end of hero section line */}
                <img
                  src="/scooty-rider.png"
                  alt="Nhealth CareRide Professional on Scooty"
                  className="w-[138px] h-auto object-contain select-none pointer-events-auto group-hover:scale-[1.03] transition-transform drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                  style={{
                    marginBottom: '-1px' // Ensures tires touch the top edge of the end of hero section line
                  }}
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Seamless Auto-Scrolling Service Banner / Marquee Section */}
        <section className="bg-gradient-to-b from-[#00172b] to-[#f8fafc] pt-6 pb-12 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">

            <div className="py-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#008080]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Comprehensive On-Demand Healthcare Services</span>
                </div>
                <div className="text-xs font-medium text-slate-500">
                  Hover to pause · Drag to explore · Click to schedule
                </div>
              </div>

              {/* Marquee Wrapper with soft edge gradient masks - Auto-scrolls on Desktop & Mobile with Pause-on-hover & Click-Drag */}
              <div
                ref={servicesMarqueeRef}
                onMouseDown={handleMarqueeMouseDown}
                className={`relative w-full py-2 group overflow-x-auto scrollbar-none select-none [-webkit-overflow-scrolling:touch] ${
                  isMarqueeGrabbing ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {/* Left Gradient Fade */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-20 bg-gradient-to-r from-[#f0f4f8] to-transparent z-10" />

                {/* Right Gradient Fade */}
                <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-20 bg-gradient-to-l from-[#e2e8f0] to-transparent z-10" />

                {/* Unified Continuous Moving Track on Desktop & Mobile */}
                <div className="w-max flex gap-5">
                  {marqueeItems.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        onClick={() => {
                          if (!marqueeHasDragged.current) {
                            openBookingFor(item.name);
                          }
                        }}
                        className="w-64 sm:w-72 shrink-0 bg-white hover:bg-slate-50/70 rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col p-3.5 text-left group/card select-none"
                      >
                        {/* Service Image Slot with Fallback Container */}
                        <div className="relative w-full h-36 sm:h-40 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200/90 mb-3 flex items-center justify-center select-none pointer-events-none">
                          <img
                            src={item.directUrl}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105 select-none pointer-events-none"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // If ImgBB direct URL encounters network or CORS issues, fall back to local saved file
                              const target = e.currentTarget;
                              if (target.src !== window.location.origin + item.localFile) {
                                target.src = item.localFile;
                              } else {
                                target.style.display = 'none';
                                const fallbackEl = target.nextElementSibling as HTMLElement;
                                if (fallbackEl) fallbackEl.style.display = 'flex';
                              }
                            }}
                          />
                          {/* Rich Stylized Visual Fallback Container */}
                          <div
                            className={`absolute inset-0 hidden flex-col items-center justify-center bg-gradient-to-br ${item.gradient} p-4 text-center`}
                          >
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white mb-2 shadow-sm">
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-white tracking-wide">
                              {item.name}
                            </span>
                          </div>

                          {/* Category Tag */}
                          <div className="absolute top-2 left-2 bg-[#002b49]/85 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                            <IconComponent className="w-3 h-3 text-teal-300" />
                            <span>{item.category}</span>
                          </div>
                        </div>

                        {/* Service Info Underneath */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-[#002b49] group-hover/card:text-[#008080] transition-colors leading-snug">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-tight mt-1 line-clamp-2">
                              {item.tagline}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#008080]">
                            <span>Book Visit</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/card:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-12 sm:py-20 lg:py-28 bg-white scroll-mt-24">
          <div className="max-w-7xl mx-auto px-2 xs:px-3.5 sm:px-6 lg:px-12">
            {/* AI-Powered Symptom & Doctor Finder Search Bar placed directly ABOVE Clinical Excellence At Doorstep */}
            <div id="symptom-doctor-finder" className="scroll-mt-24">
              <SymptomDoctorFinder
                onSelectService={(service, prefill) => {
                  setSelectedServiceForBooking(service);
                  if (prefill?.symptoms) {
                    setCustomPrefillSymptoms(prefill.symptoms);
                  }
                  setIsServiceBookingOpen(true);
                }}
                onBookDoctorVisit={(doctor, symptomsText) => {
                  const docService =
                    EXTRACTED_SERVICES.find((s) => s.id === 'doctor-home-visits') || EXTRACTED_SERVICES[1];
                  setSelectedServiceForBooking(docService);
                  setCustomPrefillSymptoms(
                    `Consultation with empaneled specialist ${doctor.name} (${doctor.specialization}, ${doctor.degrees}). Symptoms: ${symptomsText || 'Specialist Consultation'}`
                  );
                  setIsServiceBookingOpen(true);
                }}
              />
            </div>

            <div id="services-grid" className="text-center max-w-4xl mx-auto mb-8 sm:mb-12 lg:mb-16 px-2 scroll-mt-24">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#008080] mb-2">
                Clinical Excellence At Doorstep
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-[#002b49] tracking-tight">
                Our Unified Healthcare Services
              </h2>
              <p className="mt-4 text-base lg:text-lg text-slate-600 leading-relaxed font-normal">
                Hospital-grade precision brought directly to your doorstep with certified clinicians, safe sampling kits, and seamless digital health records, Everything You Need For Your Family's Health •  unlimited, integrated healthcare services delivered seamlessly at home and in-clinic across Bharat.
              </p>

              {/* High-visibility Corporate Highlights */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50/80 border border-teal-300 text-teal-950 text-xs sm:text-sm font-extrabold shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>1. 100% Certified Healthcare Professionals</span>
                </div>

                <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/80 border border-amber-300 text-amber-950 text-xs sm:text-sm font-extrabold shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span>2. &lt;30 Mins Rapid Response Protocol</span>
                </div>
              </div>
            </div>

            {/* Interactive 16-Service Buttons Grid: Exact Images & Names from https://ibb.co/4wQnyzJB */}
            <ServiceButtonsGrid
              onSelectService={(service) => {
                setSelectedServiceForBooking(service);
                setIsServiceBookingOpen(true);
              }}
            />

            {/* Live Verified Partner Providers Network in Service Grid */}
            {partners.filter((p) => p.status === 'Live').length > 0 && (
              <div className="mt-10 p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-teal-50/80 via-slate-50 to-teal-50/50 border-2 border-teal-500/30 shadow-sm text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-teal-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#008080] text-white flex items-center justify-center font-bold shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-[#002b49]">
                          Live Empaneled Network Partners ({partners.filter((p) => p.status === 'Live').length} Active)
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live on Nhealth
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Verified healthcare institutions &amp; certified clinical practitioners currently servicing patients
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('partner-with-us', '/partner-with-us')}
                      className="text-xs font-bold text-[#008080] hover:text-[#005e5e] hover:underline cursor-pointer whitespace-nowrap"
                    >
                      Join Network as Partner &rarr;
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {partners
                    .filter((p) => p.status === 'Live')
                    .map((partner) => (
                      <div
                        key={partner.id}
                        className="bg-white rounded-2xl border border-slate-200 hover:border-[#008080] p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-[#008080] border border-teal-200">
                              {partner.category}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {partner.city}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#002b49] group-hover:text-[#008080] transition-colors leading-snug line-clamp-1">
                            {partner.entityName}
                          </h4>
                          <p className="text-[11px] text-teal-700 font-semibold mt-0.5 line-clamp-1">
                            {partner.specialty}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {partner.bioOrExperience || 'Nhealth accredited partner'}
                          </p>
                          <div className="mt-2 text-[10px] text-slate-400 font-mono">
                            Reg: {partner.registrationNumber}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (partner.category === 'Doctor') {
                              openBookingFor('Doctor Home Visits');
                            } else if (partner.category === 'Diagnostics') {
                              openBookingFor('Home Diagnostics');
                            } else if (partner.category === 'Ambulance') {
                              openBookingFor('24/7 Smart Ambulance & SOS');
                            } else if (partner.category === 'Pharmacy') {
                              openBookingFor('Online Doctor Consultations');
                            } else {
                              openBookingFor('Nhealth Careassist');
                            }
                          }}
                          className="mt-3 w-full py-1.5 px-2 rounded-xl bg-teal-50 hover:bg-[#008080] text-[#008080] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Connect &amp; Book</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Preserved Featured Clinical Specialties & Pillars */}
            <div className="mt-20 pt-16 border-t border-slate-200/90">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-10 text-left">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#008080] mb-1">
                    Specialty Healthcare Packages
                  </div>
                  <h3 className="text-2xl font-black text-[#002b49]">
                    Featured Clinical Programs
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Continuous at-home monitoring &amp; care coordination
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {SERVICES.map((service, index) => {
                const IconComponent =
                  index === 0 ? TestTube2 : index === 1 ? Stethoscope : HeartHandshake;

                return (
                  <div
                    key={service.id}
                    className="bg-[#f8fafc] rounded-xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                  >
                    <div className="relative h-52 bg-slate-200 overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4 bg-[#002b49]/90 backdrop-blur-xs text-white p-2 rounded-lg shadow-sm">
                        <IconComponent className="w-5 h-5 text-teal-300" />
                      </div>
                    </div>

                    <div className="p-6 lg:p-7 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#008080] mb-1">
                          {service.category}
                        </div>
                        <h3 className="text-xl font-bold text-[#002b49] mb-3">
                          {service.title}
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-5">
                          {service.description}
                        </p>

                        <div className="space-y-2 mb-6">
                          {service.highlights.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                              <CheckCircle2 className="w-4 h-4 text-[#008080] shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-500">
                          {service.turnaround}
                        </span>
                        <button
                          onClick={() => openBookingFor(service.title)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008080] hover:text-[#006666] transition-colors py-1.5 px-3 rounded-md hover:bg-teal-50 cursor-pointer"
                        >
                          <span>Book Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </section>

        {/* How Nhealth Works 4-Step Care Flow Section */}
        <HowNhealthWorks />

        {/* Universal Healthcare Network Search Filter */}
        <UniversalSearchFilter
          onSelectService={(service, prefill) => {
            setSelectedServiceForBooking(service);
            if (prefill?.symptoms) {
              setCustomPrefillSymptoms(prefill.symptoms);
            }
            setIsServiceBookingOpen(true);
          }}
          onBookDoctorVisit={(doctor, symptomsText) => {
            const docService =
              EXTRACTED_SERVICES.find((s) => s.id === 'doctor-home-visits') || EXTRACTED_SERVICES[1];
            setSelectedServiceForBooking(docService);
            setCustomPrefillSymptoms(
              `Consultation with empaneled specialist ${doctor.name} (${doctor.specialization}, ${doctor.degrees}). Symptoms: ${symptomsText || 'Specialist Consultation'}`
            );
            setIsServiceBookingOpen(true);
          }}
        />

        {/* Partners Section */}
        <section id="partners" className="py-20 lg:py-24 bg-[#f8fafc] border-y border-slate-200 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#008080] mb-2">
                Trusted Network
              </div>
              <h2 className="text-3xl font-extrabold text-[#002b49] tracking-tight">
                Our Healthcare &amp; Diagnostic Partners
              </h2>
              <p className="mt-3 text-slate-600 text-sm lg:text-base">
                Nhealth™ collaborates with premier laboratories, verified medical institutions, and certified pharmaceutical networks to guarantee clinical integrity.
              </p>
            </div>

            {/* Smooth Continuous Horizontal Scrolling Ticker / Slider (Left to Right) */}
            <div className="relative w-full overflow-hidden py-4 sm:py-6">
              {/* Soft Gradient Mask for seamless infinite flow */}
              <div className="absolute left-0 inset-y-0 w-16 sm:w-28 bg-gradient-to-r from-[#f8fafc] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 inset-y-0 w-16 sm:w-28 bg-gradient-to-l from-[#f8fafc] to-transparent z-10 pointer-events-none" />

              <div className="animate-ticker-ltr flex items-center">
                {[...Array(10)].flatMap(() => DIAGNOSTIC_PARTNER_LOGOS).map((logo, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center h-28 sm:h-36 md:h-40 px-8 sm:px-12 py-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm mx-4 sm:mx-6 shrink-0"
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="h-16 sm:h-22 md:h-26 w-auto object-contain max-w-[200px] sm:max-w-[260px]"
                      onError={(e) => {
                        e.currentTarget.src = logo.fallback;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about-us" className="py-20 lg:py-28 bg-white border-b border-slate-200 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            {/* Top Grid: Left Side (Logo + Slogan + Heading + Actions + Statement) | Right Side (Vision & Mission) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16 sm:mb-20">
              {/* LEFT SIDE: Logo, Slogan, About Details, Action Buttons, and Statement */}
              <div className="lg:col-span-6 space-y-6">
                {/* Nhealth Logo & Slogan */}
                <div className="flex flex-col items-center sm:items-start">
                  <div className="w-28 h-28 xs:w-32 xs:h-32 sm:w-40 sm:h-40 rounded-3xl bg-white border-2 border-teal-500/30 p-2 shadow-xl flex items-center justify-center overflow-hidden">
                    <img
                      src="https://i.ibb.co/6JR2bwmJ/whatsapp-profile-pic.jpg"
                      alt="Nhealth Logo"
                      className="w-full h-full object-contain rounded-2xl"
                      onError={(e) => {
                        e.currentTarget.src = '/nhealth_about_logo.jpg';
                      }}
                    />
                  </div>
                  {/* Directly below the logo: auto-scaled on mobile/tablet */}
                  <div className="mt-2.5 sm:mt-3 text-[10.5px] xs:text-[12px] sm:text-[14px] md:text-base lg:text-lg font-black text-[#008080] tracking-tight sm:tracking-wide text-center sm:text-left leading-snug">
                    ✨ One Platform ✨ Connected Care ✨ Closer to Home
                  </div>
                </div>

                <div className="text-xs font-semibold uppercase tracking-wider text-[#008080] flex items-center gap-2 pt-1">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>About Nhealth™ Unified Healthcare</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#002b49] tracking-tight leading-tight">
                  Empowering Families with Hospital-Grade Healthcare at Home
                </h2>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Nhealth™ unifies at-home patient care, verified doctor home visits, accredited lab sample collections, and emergency medical transit across India. By connecting verified clinical specialists with modern home medical protocols, we ensure high quality care without the burden of long hospital queues.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => openBookingFor('Doctor Home Visits')}
                    className="bg-[#002b49] hover:bg-[#001d31] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Schedule Home Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('corporate-enquiries', '/corporate-enquiries')}
                    className="border border-[#002b49]/30 text-[#002b49] hover:bg-slate-50 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    Corporate &amp; Institutional Enquiries
                  </button>
                </div>

                {/* Below the "Schedule Home Visit" button: Exact Statement */}
                <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-teal-50/80 via-slate-50 to-emerald-50/60 border border-teal-200/90 shadow-2xs">
                  <div className="text-xs sm:text-sm font-black text-[#008080] tracking-wider uppercase mb-2">
                    [Accessible, Connected, Convenient &amp; Closer to Home]
                  </div>
                  <p className="text-xs sm:text-[13.5px] text-slate-700 leading-relaxed font-medium">
                    At Nhealth, we believe healthcare should be accessible, connected, convenient, and closer to home. Nhealth is an integrated Healthcare &amp; at-Home platform designed to connect patients with the healthcare services they need through one convenient digital ecosystem. From consulting a doctor online to arranging healthcare services at home, we aim to simplify the entire healthcare journey for patients and their families. Whether you need a medical consultation, diagnostic test, medicines, physiotherapy, dental care, eldercare, an ambulance, or assistance with hospital procedures, Nhealth is designed to help you access the right healthcare service through a single platform.
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE: Vision & Mission Cards */}
              <div className="lg:col-span-6 space-y-6">
                {/* Vision Card */}
                <div className="bg-gradient-to-br from-[#002b49] via-[#00223a] to-[#00172b] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-teal-500/25 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all pointer-events-none" />
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-400/30 shadow-xs">
                      <Compass className="w-6 h-6 text-teal-300" />
                    </div>
                    <div>
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-teal-400">Future Direction</span>
                      <h3 className="text-xl sm:text-2xl font-black text-white">Our Vision</h3>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-normal">
                    "To become India's most trusted, technology-driven integrated healthcare platform, making quality healthcare accessible, affordable, and seamless for everyone, everywhere."
                  </p>
                </div>

                {/* Mission Card */}
                <div className="bg-gradient-to-br from-[#003838] via-[#004747] to-[#002b2b] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-teal-400/30 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-all pointer-events-none" />
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30 shadow-xs">
                      <Target className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-300">Action &amp; Impact</span>
                      <h3 className="text-xl sm:text-2xl font-black text-white">Our Mission</h3>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-normal">
                    "To simplify healthcare by connecting patients with trusted healthcare providers and delivering coordinated medical services at home and beyond. Through technology, preventive care, transparent service coordination, and strategic partnerships with hospitals and insurance companies, we strive to improve patient outcomes, reduce unnecessary healthcare expenses, and make healthcare more accessible and affordable."
                  </p>
                </div>

                {/* Key stats row */}
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200 shadow-2xs">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#002b49]">100% Verified</div>
                    <div className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1">Licensed doctors, certified ICU nurses &amp; vetted phlebotomists</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200 shadow-2xs">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#008080]">Cold-Chain</div>
                    <div className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1">Barcode-monitored specimen logistics for NABL lab testing</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Commitments Section */}
            <div className="pt-12 sm:pt-16 border-t border-slate-200/90">
              <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/90 text-[#008080] text-xs font-black uppercase tracking-wider mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#008080]" />
                  <span>OUR CORE COMMITMENTS</span>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#002b49] tracking-tight">
                  Guided by Clinical Rigor, Built for Families
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Our core pillars ensure that every diagnostic test, doctor home consultation, and continuous treatment delivers patient peace of mind.
                </p>
              </div>

              {/* 4 Core Commitments Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
                {/* 1. Patient First */}
                <div className="bg-[#f8fafc] hover:bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 hover:border-[#008080] shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-teal-50 group-hover:bg-[#008080] text-[#008080] group-hover:text-white flex items-center justify-center mb-3.5 transition-colors">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-[#002b49] mb-1.5">Patient First</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Every process, scheduling protocol, and clinical partnership is designed around patient comfort, dignity, and recovery. We prioritize prompt, empathetic care that respects your time and well-being.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-[#008080]">
                    Zero Compromise on Care
                  </div>
                </div>

                {/* 2. Affordable Healthcare */}
                <div className="bg-[#f8fafc] hover:bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 hover:border-amber-500 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-amber-50 group-hover:bg-amber-600 text-amber-600 group-hover:text-white flex items-center justify-center mb-3.5 transition-colors">
                      <Coins className="w-5 h-5" />
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-[#002b49] mb-1.5">Affordable Healthcare</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      By shifting non-critical procedures and diagnostics to home, we cut hospital overhead expenses, eliminate hidden fees, and ensure transparent, upfront pricing for every family.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-amber-700">
                    Transparent Upfront Pricing
                  </div>
                </div>

                {/* 3. Technology-Driven Care */}
                <div className="bg-[#f8fafc] hover:bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 hover:border-cyan-600 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-cyan-50 group-hover:bg-cyan-600 text-cyan-600 group-hover:text-white flex items-center justify-center mb-3.5 transition-colors">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-[#002b49] mb-1.5">Technology-Driven Care</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Intelligent algorithmic doctor matching, contactless AI vitals scanning, IoT portable diagnostics, and seamless encrypted digital record delivery built for speed and precision.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-cyan-700">
                    Advanced Digital Ecosystem
                  </div>
                </div>

                {/* 4. Integrated Services */}
                <div className="bg-[#f8fafc] hover:bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 hover:border-emerald-600 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center mb-3.5 transition-colors">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-[#002b49] mb-1.5">Integrated Services</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      From doctor consultations and diagnostics to medicine delivery, physiotherapy, and hospital coordination—16 unified healthcare services brought under one cohesive umbrella.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-emerald-700">
                    Unified End-to-End Care
                  </div>
                </div>
              </div>

              {/* Two Prominent Editorial Panels: 'Built Around People' & 'One Platform. Multiple Healthcare Needs.' */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {/* Built Around People */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#00172b] to-[#002b49] text-white shadow-lg border border-teal-500/30 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold mb-3 border border-teal-400/30">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Human-Centered Care</span>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-white mb-2.5">
                      Built Around People
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      Healthcare is deeply personal. Nhealth is engineered around human empathy, dignity, and personalized attention. Our verified doctors, empathetic caregivers, and skilled clinicians treat every home with utmost reverence, ensuring your loved ones receive compassionate care in familiar, stress-free surroundings.
                    </p>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center gap-2 text-xs text-teal-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Dignified, Patient-Centered Clinical Experience</span>
                  </div>
                </div>

                {/* One Platform. Multiple Healthcare Needs. */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-900/90 to-[#004d40] text-white shadow-lg border border-teal-400/40 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold mb-3 border border-amber-300/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Comprehensive Ecosystem</span>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-white mb-2.5">
                      One Platform. Multiple Healthcare Needs.
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      No more navigating fragmented clinics, searching for separate labs, or calling multiple pharmacies. Nhealth consolidates over 16 unified healthcare services into a single digital touchpoint—connecting families with verified medical professionals, diagnostic hubs, and home medical supplies with 1-click ease.
                    </p>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center gap-2 text-xs text-amber-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>16 Unified Services Under A Single Digital Touchpoint</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Collaboration Section */}
        <section id="contact" className="py-20 lg:py-28 bg-[#f8fafc] scroll-mt-24">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-8 sm:p-12">
              <div className="text-center max-w-xl mx-auto mb-10">
                <div className="text-xs font-bold uppercase tracking-wider text-[#008080] mb-2">
                  Get In Touch
                </div>
                <h2 className="text-3xl font-extrabold text-[#002b49] tracking-tight">
                  Let's Collaborate
                </h2>
                <p className="text-slate-600 text-sm mt-2">
                  Submit your requirement, book a certified home medical service, or reach out for partnership queries.
                </p>
              </div>

              {formSubmitted ? (
                <div className="bg-[#e6f4f4] border border-[#008080]/30 rounded-xl p-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-[#008080] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#002b49]">
                    Inquiry Received Successfully!
                  </h3>
                  <p className="text-slate-700 text-sm max-w-md mx-auto">
                    Thank you, <strong className="text-[#002b49]">{formData.name}</strong>. Our care coordinator will contact you at{' '}
                    <strong className="text-[#002b49]">{formData.phone}</strong> shortly to confirm your service details.
                  </p>
                  <div className="bg-white rounded-lg p-3 inline-block border border-slate-200 text-xs font-mono text-slate-600">
                    Reference ID: <span className="font-bold text-[#008080]">{referenceId}</span>
                  </div>
                  <div className="pt-3">
                    <button
                      onClick={() => {
                        setFormSubmitted(false);
                        setFormData({
                          name: '',
                          phone: '',
                          email: '',
                          serviceInterest: 'Home Diagnostics',
                          addressOrCity: '',
                          message: '',
                        });
                      }}
                      className="text-xs font-bold text-[#008080] hover:underline cursor-pointer"
                    >
                      Submit Another Request
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-transparent transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your mobile number"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Email Address <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="name@example.com"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-transparent transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Service of Interest
                      </label>
                      <div className="relative">
                        <select
                          name="serviceInterest"
                          value={formData.serviceInterest}
                          onChange={handleInputChange}
                          className="w-full appearance-none px-4 py-3 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-transparent transition-all text-sm pr-10 cursor-pointer"
                        >
                          <option value="Home Diagnostics">Home Diagnostics (Sample Collection)</option>
                          <option value="Doctor Home Visits">Doctor Home Visits</option>
                          <option value="Nursing & Care">Nursing & Bedside Care</option>
                          <option value="Physiotherapy">Physiotherapy (Rehab & Mobility)</option>
                          <option value="Nhealth Care Ride">Nhealth Care Ride (Assisted Transit)</option>
                          <option value="Online Doctor Consultations">Online Doctor Consultations</option>
                          <option value="Care Assist">Care Assist (Daily Attendants)</option>
                          <option value="Home X-Ray Services">Home X-Ray Services</option>
                          <option value="Bedside Assistance">Bedside Assistance</option>
                          <option value="Premium OPD Services">Premium OPD Services</option>
                          <option value="Pharmacy Delivery">Pharmacy Delivery to Home</option>
                          <option value="Pre-Booking OPD">Pre-Booking OPD</option>
                          <option value="Partnership / Lab Network">Partnership & Lab Collaboration</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Residential Locality or City
                    </label>
                    <input
                      type="text"
                      name="addressOrCity"
                      value={formData.addressOrCity}
                      onChange={handleInputChange}
                      placeholder="e.g. Jubilee Hills, Banjara Hills, Hitec City or your full address"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-transparent transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Message / Requirements <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Describe your requirement, patient symptoms, preferred visit schedule, or partnership query..."
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-transparent transition-all text-sm resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#002b49] hover:bg-[#001d31] disabled:bg-slate-400 text-white font-bold py-3.5 px-6 rounded-lg text-base shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Dispatching Inquiry...</span>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-400">
                    Your medical health information is kept strictly private under patient confidentiality standards.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Dynamic Service Booking Modal for Specific Service */}
      <ServiceBookingModal
        service={selectedServiceForBooking}
        isOpen={isServiceBookingOpen}
        onClose={() => {
          setIsServiceBookingOpen(false);
          setCustomPrefillSymptoms('');
        }}
        onSubmitBooking={handleBookingFormSubmit}
        initialPhone={currentUser?.phone || ''}
        initialName={currentUser?.name || ''}
        initialSymptoms={customPrefillSymptoms}
      />

      {/* Strictly Defined Guest Checkout Warning Modal */}
      <GuestWarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        serviceName={pendingDraftBooking?.serviceName}
        onLoginRedirect={() => {
          setIsWarningModalOpen(false);
          setLoginRedirectFromBooking(true);
          setLoginModalOpen(true);
        }}
        onProceedGuest={() => {
          setIsWarningModalOpen(false);
          finalizeBooking(pendingDraftBooking, true);
        }}
      />

      {/* Booking Confirmation Modal with Reference ID & History Verification Status */}
      <BookingConfirmationModal
        booking={confirmedBookingData}
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        isLoggedIn={isLoggedIn}
        onViewHistory={() => setMyBookingsModalOpen(true)}
      />

      {/* My Bookings History Modal for Logged-In Users */}
      <MyBookingsModal
        isOpen={myBookingsModalOpen}
        onClose={() => setMyBookingsModalOpen(false)}
        bookings={bookingHistory}
        userName={currentUser?.name || 'Valued Patient'}
        onBookNew={() => {
          setMyBookingsModalOpen(false);
          const el = document.getElementById('services');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Nhealth Vital Lens: AI Face Vitals Scan Modal (vPPG / Camera Biometrics) */}
      <VitalLensModal
        isOpen={vitalLensOpen}
        onClose={() => setVitalLensOpen(false)}
        onBookDoctor={(serviceName) => {
          setVitalLensOpen(false);
          openBookingFor(serviceName || 'Online doctor consultations');
        }}
        defaultUserData={{
          name: currentUser?.name,
          phone: currentUser?.phone,
        }}
      />

      {/* Nhealth AI Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={voiceAssistantOpen}
        onClose={() => setVoiceAssistantOpen(false)}
        onNavigateToSection={(sectionId) => {
          if (currentRoute !== 'home') {
            navigateTo('home', '/');
            setTimeout(() => {
              const el = document.getElementById(sectionId);
              el?.scrollIntoView({ behavior: 'smooth' });
            }, 150);
          } else {
            const el = document.getElementById(sectionId);
            el?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onNavigateToRoute={(route, urlPath) => {
          navigateTo(route as any, urlPath);
        }}
        onOpenServiceBooking={(serviceName) => {
          openBookingFor(serviceName || 'Online doctor consultations');
        }}
        onOpenVitalLens={() => {
          setVitalLensOpen(true);
        }}
      />

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setBookingModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#008080] mb-1">
                Direct Appointment Booking
              </div>
              <h3 className="text-xl font-bold text-[#002b49]">
                Schedule {bookingServiceType}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your contact info and our clinical desk will immediately confirm your scheduled personnel.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setBookingModalOpen(false);
                setFormSubmitted(true);
                setReferenceId('NH-' + Math.floor(100000 + Math.random() * 900000));
                scrollToContact();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selected Service
                </label>
                <div className="relative">
                  <select
                    value={bookingServiceType}
                    onChange={(e) => setBookingServiceType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white font-semibold text-[#002b49]"
                  >
                    {HERO_MARQUEE_SERVICES.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="Home Diagnostics">Home Diagnostics</option>
                    <option value="Doctor Home Visits">Doctor Home Visits</option>
                    <option value="Nursing & Care">Nursing & Care</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Patient or Caretaker Name"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                  defaultValue={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Mobile number"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    defaultValue={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Time Slot
                  </label>
                  <select className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white">
                    <option>Morning (07:00 AM – 11:00 AM)</option>
                    <option>Afternoon (11:00 AM – 03:00 PM)</option>
                    <option>Evening (03:00 PM – 07:00 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery / Residential Address
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Street, Apartment / House No., Landmark"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080] resize-none"
                  defaultValue={formData.addressOrCity}
                  onChange={(e) => setFormData((p) => ({ ...p, addressOrCity: e.target.value }))}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-[#008080] hover:bg-[#006666] text-white font-bold py-3 rounded-lg text-sm shadow-md transition-all active:scale-[0.99] mt-2 cursor-pointer"
              >
                Confirm Booking Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {searchModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-20 pb-10 px-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setSearchModalOpen(false);
                setSearchQuery('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 pr-8">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-[#008080]" />
                <h3 className="text-base sm:text-lg font-bold text-[#002b49]">Search All 16 Unified Services</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchModalOpen(false);
                  setTimeout(() => {
                    const el = document.getElementById('symptom-doctor-finder');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      window.location.hash = '#symptom-doctor-finder';
                    }
                  }, 100);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer border border-amber-300"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>Click to Smart Search</span>
              </button>
            </div>

            <div className="relative mb-5">
              <input
                type="text"
                autoFocus
                placeholder="Search by service name or medical category (e.g., physio, doctor, x-ray, blood)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080] placeholder-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Matching Services ({filteredServices.length})</span>
              <span className="text-[11px] font-normal normal-case text-slate-500">Click to book immediately</span>
            </div>

            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
              {filteredServices.length > 0 ? (
                filteredServices.map((service, idx) => {
                  const Icon = service.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSearchModalOpen(false);
                        setSearchQuery('');
                        openBookingFor(service.name);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-teal-50 group-hover:bg-[#008080] text-[#008080] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#002b49] group-hover:text-[#008080] transition-colors">
                            {service.name}
                          </div>
                          <div className="text-[11px] text-slate-500">{service.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#008080] opacity-80 group-hover:opacity-100">
                        <span>Book Visit</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-slate-500">
                  <p className="text-sm font-medium">No services matching "{searchQuery}"</p>
                  <p className="text-xs text-slate-400 mt-1">Try searching "doctor", "blood", "bedside", or "pharmacy".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login & Signup Modal */}
      {loginModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setLoginModalOpen(false);
                setLoginSubmitted(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Close login dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#008080] text-white flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#002b49]">
                  {loginMode === 'login' ? 'Nhealth™ Patient & Partner Portal' : 'Create Your Nhealth™ Account'}
                </h3>
                <p className="text-[11px] text-slate-500">Secure access to digital reports &amp; bookings</p>
              </div>
            </div>

            {/* Login / Signup Switcher */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('login');
                  setLoginSubmitted(false);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  loginMode === 'login' ? 'bg-white text-[#002b49] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('signup');
                  setLoginSubmitted(false);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  loginMode === 'signup' ? 'bg-white text-[#002b49] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>

            {loginRedirectFromBooking && pendingDraftBooking && (
              <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008080] shrink-0 mt-0.5" />
                <span>
                  Log in now to save your booking for <strong>{pendingDraftBooking.serviceName}</strong> to your health records history for future verification.
                </span>
              </div>
            )}

            {loginSubmitted ? (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#008080] mx-auto" />
                <h4 className="text-base font-bold text-[#002b49]">
                  {loginMode === 'login' ? 'Signed In Successfully!' : 'Account Created Successfully!'}
                </h4>
                <p className="text-xs text-slate-600">
                  Welcome <strong>{currentUser?.name || loginName || 'Patient'}</strong>. Your account is now active with mobile number <strong>{loginPhone || '+91 93939 34621'}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoginModalOpen(false);
                    setLoginSubmitted(false);
                  }}
                  className="w-full bg-[#008080] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-[#006666] transition-colors cursor-pointer mt-2"
                >
                  Continue to Health Dashboard
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const phoneVal = loginPhone.trim() || '98765 43210';
                  const nameVal = loginName.trim() || (loginMode === 'signup' ? 'Valued Patient' : 'Registered Patient');
                  const userObj: UserAccount = {
                    id: 'USER-' + Date.now(),
                    name: nameVal,
                    phone: phoneVal,
                    accountType: 'Patient & Family Caretaker',
                  };

                  setIsLoggedIn(true);
                  setCurrentUser(userObj);
                  try {
                    localStorage.setItem('nhealth_user', JSON.stringify(userObj));
                  } catch {}

                  if (loginRedirectFromBooking && pendingDraftBooking) {
                    finalizeBooking(pendingDraftBooking, false, userObj.id);
                    setLoginRedirectFromBooking(false);
                    setLoginModalOpen(false);
                    setLoginSubmitted(false);
                  } else {
                    setLoginSubmitted(true);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (for instant OTP verification) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-semibold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="98765 43210"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name {loginMode === 'signup' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={loginMode === 'signup'}
                    placeholder="Patient or Caretaker Name"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Category
                  </label>
                  <select className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white font-medium text-slate-800">
                    <option>Patient &amp; Family Caretaker</option>
                    <option>Doctor / Certified Clinician</option>
                    <option>Diagnostic Laboratory Partner</option>
                    <option>Hospital OPD Coordinator</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#002b49] hover:bg-[#001d31] text-white font-bold py-3 rounded-lg text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer mt-2"
                >
                  {loginRedirectFromBooking
                    ? 'Login & Confirm Booking'
                    : loginMode === 'login'
                    ? 'Sign In to Health Portal'
                    : 'Complete Registration'}
                </button>

                <p className="text-center text-[11px] text-slate-400 pt-1">
                  By continuing you agree to Nhealth's Patient Care Terms &amp; Medical Privacy Policy.
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Partner With Us & Corporate Enquiries Modal */}
      {partnerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 my-6">
            <button
              onClick={() => {
                setPartnerModalOpen(false);
                setPartnerSubmitted(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Close partner dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#008080] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-[#002b49]">
                Partner With Nhealth™
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Connect your hospital, diagnostic lab, corporate wellness desk, or clinical service to Bharat's largest home healthcare network.
            </p>

            {partnerSubmitted ? (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#008080] mx-auto" />
                <h4 className="text-base font-bold text-[#002b49]">
                  Partnership Inquiry Submitted!
                </h4>
                <p className="text-xs text-slate-600">
                  Thank you, <strong>{partnerForm.orgName || 'Partner'}</strong>. Our Institutional Alliances head will contact <strong>{partnerForm.phone}</strong> within 24 hours.
                </p>
                <div className="bg-white rounded-lg p-2.5 inline-block border border-slate-200 text-xs font-mono text-slate-600">
                  Partnership Ref: <span className="font-bold text-[#008080]">{partnerRefId}</span>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPartnerModalOpen(false);
                      setPartnerSubmitted(false);
                    }}
                    className="w-full bg-[#008080] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-[#006666] transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handlePartnerSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Organization / Hospital Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apollo Diagnostics"
                      value={partnerForm.orgName}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, orgName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Partnership Category
                    </label>
                    <select
                      value={partnerForm.category}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white font-medium"
                    >
                      <option>Diagnostic Pathology Lab</option>
                      <option>Hospital Chain / OPD Network</option>
                      <option>Corporate Wellness / HR</option>
                      <option>Doctor / Specialty Clinic</option>
                      <option>Ambulance &amp; Transit Fleet</option>
                      <option>Pharmaceutical Distributor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Person &amp; Designation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Ramesh (Director)"
                      value={partnerForm.contactPerson}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, contactPerson: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Mobile or Desk Number"
                      value={partnerForm.phone}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="partnerships@company.com"
                      value={partnerForm.email}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Operating City / Region
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad, Bengaluru"
                      value={partnerForm.city}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, city: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Collaboration Scope / Message
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your interest (sample processing tie-up, corporate employee packages, OPD token integration)..."
                    value={partnerForm.message}
                    onChange={(e) => setPartnerForm((p) => ({ ...p, message: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080] resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#002b49] hover:bg-[#001d31] text-white font-bold py-3 rounded-lg text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer mt-2"
                >
                  Submit Institutional Collaboration Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Thank You for Your Enquiry Modal Pop-up */}
      {enquiryThankYouModalOpen && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setEnquiryThankYouModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-teal-500/30 relative overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative gradient strip */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#008080] via-teal-500 to-[#002b49]" />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setEnquiryThankYouModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close thank you modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon & Title */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-teal-50 text-[#008080] border-2 border-teal-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#002b49]">
                Thank You for Your Enquiry
              </h3>
            </div>

            {/* Exact Required Message Content */}
            <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed text-left">
              <p className="font-semibold text-slate-900">
                Thank you for your interest in Nhealth.
              </p>
              <p>
                We sincerely appreciate you reaching out to us. Your enquiry has been received successfully, and our team will review your request and get in touch with you shortly.
              </p>
              <p>
                At Nhealth, we are committed to delivering integrated, technology-driven healthcare solutions that make quality healthcare more accessible, convenient, and affordable.
              </p>
              <p>
                We look forward to connecting with you and building a valuable association.
              </p>

              <div className="pt-3 border-t border-slate-100 space-y-0.5">
                <p className="font-bold text-[#002b49]">Warm Regards,</p>
                <p className="font-bold text-[#008080]">Team Nhealth</p>
                <p className="text-[11px] sm:text-xs text-slate-500 italic">
                  Powering the Future of Unified &amp; At-Home Healthcare.
                </p>
              </div>
            </div>

            {/* Action button */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setEnquiryThankYouModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#008080] to-[#006666] hover:from-[#006666] hover:to-[#004d4d] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Close &amp; Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#002b49] text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={NHEALTH_LOGO_URL}
                  alt="Nhealth Logo"
                  className="h-9 w-auto object-contain bg-white/10 rounded-lg p-1"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + NHEALTH_LOGO_FALLBACK) {
                      target.src = NHEALTH_LOGO_FALLBACK;
                    }
                  }}
                />
                <span className="text-2xl font-bold tracking-tight text-white">
                  Nhealth™
                </span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                Powering the future of healthcare at home through certified phlebotomy diagnostics, experienced doctor visits, and dedicated nursing care. Nhealth Technologies is an healthcare aggregator providing integrated healthcare services and at home through a single digital platform, connecting patients, doctors, pharmacies, diagnostics and emergency ambulance providers, eldercare, health packages, health riders, bedside assistants and at home, physiotherapy services and at home, blood availability checks, vaccination services nationwide, and also a digital telemedicine infrastructure pioneer.
              </p>
              <div className="pt-2 text-xs text-slate-400">
                Official Entity: Nhealth Unified Healthcare Technologies Private Limited
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-3">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                <li>
                  <a href="#home" className="hover:text-white transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#services-grid" className="hover:text-white transition-colors">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#about-us" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#teams"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo('teams', '#teams');
                    }}
                    className="hover:text-white transition-colors text-left cursor-pointer inline-block"
                  >
                    Teams
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateTo('corporate-enquiries', '/corporate-enquiries')}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Corporate Enquiries
                  </button>
                </li>
                <li>
                  <a href="#partners" className="hover:text-white transition-colors">
                    Partners
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => navigateTo('command-center', '/command-center')}
                    className="text-slate-400 hover:text-teal-300 transition-colors text-left cursor-pointer flex items-center gap-1.5 text-xs group"
                    title="Temporary Admin Access for Testing (/command-center)"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400/80 group-hover:text-teal-300 transition-colors" />
                    <span>Admin Portal</span>
                    <span className="text-[9.5px] px-1.5 py-0.5 bg-white/5 group-hover:bg-teal-500/20 text-slate-400 group-hover:text-teal-300 rounded font-mono border border-white/10">
                      Testing
                    </span>
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-3">
                Emergency &amp; Support
              </h4>
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  Direct Care Line:{' '}
                  <a
                    href="tel:9393934621"
                    className="font-semibold text-white hover:text-teal-300 transition-colors underline-offset-2 hover:underline"
                  >
                    9393934621
                  </a>
                </p>
                <p>
                  Support Mail:{' '}
                  <a
                    href="mailto:support@nhealth.in"
                    className="font-semibold text-white hover:text-teal-300 transition-colors underline-offset-2 hover:underline"
                  >
                    support@nhealth.in
                  </a>
                </p>
                <p className="pt-2 text-slate-400 text-[11px] leading-normal border-t border-white/10">
                  Note: For acute emergency conditions, dial your regional emergency helpline (108 / 112 / 911) immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
            <div className="text-center md:text-left space-y-1.5">
              <p className="text-slate-300">
                &copy; 2026 Nhealth Unified Healthcare Technologies Private Limited. All rights reserved.
              </p>
              <p className="text-teal-400 font-semibold tracking-wide text-[11px]">
                Designed &amp; Developed and Owned by Nhealth Unified Healthcare Technologies Private Limited
              </p>
              <div className="pt-1 flex items-center justify-center md:justify-start">
                <button
                  type="button"
                  onClick={() => navigateTo('command-center', '/command-center')}
                  className="text-[11px] text-slate-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer"
                  title="Temporary Admin Access for Testing"
                >
                  <ShieldCheck className="w-3 h-3 text-teal-400" />
                  <span>Admin Login</span>
                  <span className="text-[9px] text-teal-300 font-mono">(Testing)</span>
                </button>
              </div>
            </div>

            {/* Social Media Links (Bottom Right Corner - Requirement 1) */}
            <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300/80">
                Official Channels
              </span>
              <div className="flex items-center gap-2.5">
                {/* Facebook */}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Facebook"
                  title="Nhealth on Facebook"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#1877F2] text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-transparent hover:scale-110 shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Instagram"
                  title="Nhealth on Instagram"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-transparent hover:scale-110 shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                {/* X / Twitter */}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-label="X (formerly Twitter)"
                  title="Nhealth on X (Twitter)"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-black text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-transparent hover:scale-110 shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-label="LinkedIn"
                  title="Nhealth on LinkedIn"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#0A66C2] text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-transparent hover:scale-110 shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>


      {/* Nhealth Vital Lens: AI Camera Biometrics Scan Modal (Universal & Guest Mode) */}
      <VitalLensModal
        isOpen={vitalLensOpen}
        onClose={() => setVitalLensOpen(false)}
        onBookDoctor={(serviceName) => {
          setVitalLensOpen(false);
          openBookingFor(serviceName || 'Online doctor consultations');
        }}
        defaultUserData={{
          name: currentUser?.name,
          phone: currentUser?.phone,
        }}
      />

      {/* Modern Responsive Floating Action Button (FAB) Menu - "Quick Look" (Bottom-Right Corner) */}
      <QuickLookFAB
        onOpenVitalLens={() => setVitalLensOpen(true)}
        onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)}
      />

      {/* 1. STARTUP SPLASH SCREEN: Solid Blank White Screen -> Centered Logo + Warm Tagline -> Smooth Fade Out */}
      {splashStep !== 'hidden' && (
        <div
          aria-hidden={splashStep === 'fading'}
          className={`fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-white transition-opacity duration-900 ease-in-out select-none ${
            splashStep === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
          }`}
        >
          {splashStep !== 'blank' && (
            <div className="animate-splash-in flex flex-col items-center text-center px-2 sm:px-6 w-full max-w-2xl mx-auto">
              {/* Round Glowing PWA Logo Asset */}
              <div className="relative mb-6 flex items-center justify-center">
                {/* Continuous Glowing Ripple Ring around Logo */}
                <div className="absolute inset-0 rounded-full animate-pwa-ring bg-teal-400/20 scale-125 pointer-events-none" />
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-2xl p-1.5 flex items-center justify-center border-2 border-teal-500/30 animate-pwa-ripple relative z-10 overflow-hidden">
                  <img
                    src="/splash-logo.png"
                    alt="Nhealth - Healthcare at Home"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              </div>

              {/* Entrance Headline: Welcome to Bharat's Biggest Healthcare Network (Strictly Single Line) */}
              <h2 className="text-[12px] xs:text-[14px] sm:text-lg md:text-xl lg:text-2xl font-black text-[#00172b] tracking-tight leading-none whitespace-nowrap overflow-visible">
                Welcome to Bharat's Biggest Healthcare Network
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 font-semibold max-w-sm sm:max-w-md leading-relaxed">
                Your Trusted Healthcare Partner, Simplified.
              </p>

              {/* Subtle Loading Pulse Indicator */}
              <div className="mt-6 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#008080] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. ADD TO HOME SCREEN PWA CONSENT POPUP DIALOG */}
      {showPwaInstallModal && !isAppInstalled && (
        <div className="fixed inset-0 z-[99990] flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 max-w-md w-full relative overflow-hidden transform transition-all duration-300 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2">
            {/* Soft Ambient Header Background Glow */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            <div className="flex items-start gap-3.5">
              {/* Round Icon with Continuous Glowing Ripple Animation */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full animate-pwa-ring bg-teal-400/25 scale-125" />
                <div className="w-13 h-13 rounded-full bg-white shadow-md border-2 border-teal-500/40 p-1 flex items-center justify-center animate-pwa-ripple relative z-10 overflow-hidden">
                  <img
                    src="/pwa-round-192x192.png"
                    alt="Nhealth Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              </div>

              <div className="flex-1 pr-6">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-teal-700">
                  <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                  <span>Instant Home Screen Access</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
                  Add Nhealth to Home Screen
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                  Install the Nhealth Web App for 1-tap booking, instant reports delivery, and offline-ready care support.
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleDismissPwa}
                aria-label="Close add to home screen banner"
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons: Install / Add to Home Screen vs Dismiss */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleDismissPwa}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleInstallPwa}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-teal-900/20 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Install / Add to Home Screen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gradual Exit Toast Prompt (Visible when Back is pressed at root page) */}
      {showExitPrompt && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-full bg-[#00172d]/95 text-white text-xs font-bold border border-cyan-400/50 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Press Back again to exit</span>
        </div>
      )}
    </div>
  );
}

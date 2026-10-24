import React, { useState } from 'react';
import { navHistory } from '../utils/navigationHistory';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  ArrowLeft,
  FileCheck2,
  AlertCircle,
  AlertTriangle,
  Ban,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Lock,
  KeyRound,
  ShieldAlert,
  LogOut,
  Eye,
  EyeOff,
  Phone,
  Layers,
  Info,
  Mail,
  Building2,
  Activity,
  CheckCheck,
  FileText,
  Inbox,
  User,
  Calendar,
  MapPin,
  ExternalLink,
  PhoneCall,
  CheckCircle,
  HelpCircle,
  Filter,
  HeartPulse,
  Users,
  ClipboardList,
  Download,
  Megaphone,
  Upload,
  Trash2,
  Image as ImageIcon,
  Sliders,
  Plus,
  Edit3 as Edit,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  PartnerApplication,
  PartnerCategory,
  PartnerStatus,
  calculateDaysInactive,
  isPartnerSuspended,
  checkIsHighRiskMultiRegistration,
  INACTIVITY_THRESHOLD_DAYS
} from '../types/partner';
import {
  EnquiryRecord,
  EnquiryStatus,
  getStoredEnquiries,
  updateEnquiryStatus
} from '../types/enquiry';
import {
  getStoredVitalScans,
  CompactVitalScan,
  getStoredGuestBookings,
  updateGuestBookingStatus
} from '../utils/patientStorage';
import { ConfirmedBooking } from '../types/serviceBooking';
import {
  AdBannerItem,
  BannerSectionType,
  getStoredBanners,
  saveStoredBanners,
  addStoredBanner,
  updateStoredBanner,
  deleteStoredBanner,
  reorderStoredBanners,
  resetStoredBanners,
  DEFAULT_BANNERS
} from '../utils/advertisingStorage';
import {
  GridTabItem,
  GridTabSectionType,
  getStoredGridTabs,
  saveStoredGridTabs,
  addStoredGridTab,
  updateStoredGridTab,
  deleteStoredGridTab,
  resetStoredGridTabs,
  DEFAULT_GRID_TABS
} from '../utils/gridTabsStorage';

interface AdminDashboardPageProps {
  partners: PartnerApplication[];
  onTogglePartnerStatus: (partnerId: string, newStatus: PartnerStatus) => void;
  onUpdatePartner?: (partnerId: string, updates: Partial<PartnerApplication>) => void;
  enquiries?: EnquiryRecord[];
  onUpdateEnquiryStatus?: (id: string, newStatus: EnquiryStatus, notes?: string) => void;
  onNavigateHome: () => void;
  onNavigateOnboarding: () => void;
}

type AlignmentTab = 'All' | 'Pending' | 'Live' | 'Suspended' | 'HighRisk' | 'Enquiries' | 'VitalScans' | 'GuestBookings' | 'Advertising';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  partners,
  onTogglePartnerStatus,
  onUpdatePartner,
  enquiries,
  onUpdateEnquiryStatus,
  onNavigateHome,
  onNavigateOnboarding,
}) => {
  // Session Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('nhealth_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [adminEmail, setAdminEmail] = useState('admin@nhealth.in');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard Filters & UI State (Phase 3 Alignment: 4 Primary Buckets)
  const [searchQuery, setSearchQuery] = useState('');
  const VALID_ADMIN_TABS: AlignmentTab[] = ['All', 'Pending', 'Live', 'Suspended', 'HighRisk', 'Enquiries', 'VitalScans', 'GuestBookings', 'Advertising'];
  const [rawAlignmentTab, setRawAlignmentTab] = useState<AlignmentTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as AlignmentTab;
      if (hash && VALID_ADMIN_TABS.includes(hash)) return hash;
      const saved = sessionStorage.getItem('nhealth_admin_tab') as AlignmentTab;
      if (saved && VALID_ADMIN_TABS.includes(saved)) return saved;
    }
    return 'All';
  });

  const alignmentTab = rawAlignmentTab;
  const setAlignmentTab = (tab: AlignmentTab) => {
    if (tab === rawAlignmentTab) return;
    try {
      sessionStorage.setItem('nhealth_admin_tab', tab);
      window.history.pushState({ isAdminTab: true, tab }, '', `/admin#${tab}`);
    } catch {}
    setRawAlignmentTab(tab);
  };

  // Step-by-step sub-tab history navigation on browser Back
  React.useEffect(() => {
    const handleAdminPopState = (e: PopStateEvent) => {
      if (navHistory.hasOpenModals()) return;
      const hash = window.location.hash.replace('#', '') as AlignmentTab;
      if (e.state?.isAdminTab && e.state.tab && VALID_ADMIN_TABS.includes(e.state.tab)) {
        setRawAlignmentTab(e.state.tab);
        sessionStorage.setItem('nhealth_admin_tab', e.state.tab);
      } else if (hash && VALID_ADMIN_TABS.includes(hash)) {
        setRawAlignmentTab(hash);
        sessionStorage.setItem('nhealth_admin_tab', hash);
      } else if (rawAlignmentTab !== 'All') {
        setRawAlignmentTab('All');
        sessionStorage.setItem('nhealth_admin_tab', 'All');
      }
    };
    window.addEventListener('popstate', handleAdminPopState);
    return () => window.removeEventListener('popstate', handleAdminPopState);
  }, [rawAlignmentTab]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewDoc, setPreviewDoc] = useState<PartnerApplication | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-Registration Inspection Modal State
  const [inspectingPhone, setInspectingPhone] = useState<string | null>(null);

  // Revocation Request Review Modal State
  const [reviewingRevocationPartner, setReviewingRevocationPartner] = useState<PartnerApplication | null>(null);

  // Enquiries Centralized State & Synchronizer
  const [localEnquiries, setLocalEnquiries] = useState<EnquiryRecord[]>(() => {
    return enquiries && enquiries.length > 0 ? enquiries : getStoredEnquiries();
  });
  const [enquirySearchQuery, setEnquirySearchQuery] = useState('');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<'All' | EnquiryStatus>('All');
  const [enquiryTypeFilter, setEnquiryTypeFilter] = useState<string>('All');
  const [inspectingEnquiry, setInspectingEnquiry] = useState<EnquiryRecord | null>(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState('');

  // Keep synced with parent props
  React.useEffect(() => {
    if (enquiries) {
      setLocalEnquiries(enquiries);
    }
  }, [enquiries]);

  // Real-time synchronization across browser tabs and dispatch events
  React.useEffect(() => {
    const handleSync = () => {
      setLocalEnquiries(getStoredEnquiries());
    };
    window.addEventListener('nhealth_enquiries_updated', handleSync);
    return () => window.removeEventListener('nhealth_enquiries_updated', handleSync);
  }, []);

  // 1. Vital Scans Tracking State & Admin Filters
  const [vitalScans, setVitalScans] = useState<CompactVitalScan[]>(getStoredVitalScans);
  const [vitalDateFilter, setVitalDateFilter] = useState<'All' | 'Today' | '7days'>('All');
  const [vitalModeFilter, setVitalModeFilter] = useState<'All' | 'Logged-in' | 'Guest'>('All');
  const [vitalSearchQuery, setVitalSearchQuery] = useState('');

  // 2. Guest Bookings State & Admin Filters
  const [guestBookings, setGuestBookings] = useState<ConfirmedBooking[]>(getStoredGuestBookings);
  const [guestDateFilter, setGuestDateFilter] = useState<'All' | 'Today' | '7days'>('All');
  const [guestServiceFilter, setGuestServiceFilter] = useState<string>('All');
  const [guestStatusFilter, setGuestStatusFilter] = useState<string>('All');
  const [guestSearchQuery, setGuestSearchQuery] = useState('');

  // Sync vital scans & guest bookings with custom window events
  React.useEffect(() => {
    const handleVitalsSync = () => setVitalScans(getStoredVitalScans());
    const handleGuestSync = () => setGuestBookings(getStoredGuestBookings());

    window.addEventListener('nhealth_vital_scans_updated', handleVitalsSync);
    window.addEventListener('nhealth_guest_bookings_updated', handleGuestSync);

    return () => {
      window.removeEventListener('nhealth_vital_scans_updated', handleVitalsSync);
      window.removeEventListener('nhealth_guest_bookings_updated', handleGuestSync);
    };
  }, []);

  const handleUpdateGuestStatus = (refId: string, status: ConfirmedBooking['status']) => {
    const updated = updateGuestBookingStatus(refId, status);
    setGuestBookings(updated);
    showToast(`✓ Guest Order ${refId} status updated to "${status}".`);
  };

  // 3. Multi-Banner Advertising Management State & CRUD Handlers (Dual Independent Sections)
  const [adminBannerSection, setAdminBannerSection] = useState<BannerSectionType>('section1');
  const [banners, setBanners] = useState<AdBannerItem[]>(getStoredBanners);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<Partial<AdBannerItem>>({});
  const [adUploadError, setAdUploadError] = useState<string | null>(null);
  const [adFormImagePreview, setAdFormImagePreview] = useState<string>('');
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [deletingBanner, setDeletingBanner] = useState<AdBannerItem | null>(null);
  const bannerFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Modal Back Button integration with navHistory
  React.useEffect(() => {
    if (isBannerModalOpen) {
      return navHistory.pushModal('admin-banner-modal', 'Banner Editor', () => setIsBannerModalOpen(false));
    }
  }, [isBannerModalOpen]);

  React.useEffect(() => {
    if (deletingBanner) {
      return navHistory.pushModal('admin-delete-banner-modal', 'Delete Banner', () => setDeletingBanner(null));
    }
  }, [deletingBanner]);

  React.useEffect(() => {
    if (inspectingEnquiry) {
      return navHistory.pushModal('admin-inspect-enquiry-modal', 'Enquiry Details', () => setInspectingEnquiry(null));
    }
  }, [inspectingEnquiry]);

  React.useEffect(() => {
    if (previewDoc) {
      return navHistory.pushModal('admin-preview-doc-modal', 'Document Preview', () => setPreviewDoc(null));
    }
  }, [previewDoc]);

  React.useEffect(() => {
    if (inspectingPhone) {
      return navHistory.pushModal('admin-inspect-phone-modal', 'Registrations Inspection', () => setInspectingPhone(null));
    }
  }, [inspectingPhone]);

  React.useEffect(() => {
    if (reviewingRevocationPartner) {
      return navHistory.pushModal('admin-revocation-modal', 'Revocation Review', () => setReviewingRevocationPartner(null));
    }
  }, [reviewingRevocationPartner]);

  // 4. Interactive Grid Tab Management State & CRUD Handlers (Dual Sections 1 & 2)
  const [adminGridTabSection, setAdminGridTabSection] = useState<GridTabSectionType>('section1');
  const [gridTabs, setGridTabs] = useState<GridTabItem[]>(getStoredGridTabs);
  const [isGridTabModalOpen, setIsGridTabModalOpen] = useState(false);
  const [editingGridTabId, setEditingGridTabId] = useState<string | null>(null);
  const [gridTabForm, setGridTabForm] = useState<Partial<GridTabItem>>({});
  const [gridTabUploadError, setGridTabUploadError] = useState<string | null>(null);
  const [gridTabImagePreview, setGridTabImagePreview] = useState<string>('');
  const [deletingGridTab, setDeletingGridTab] = useState<GridTabItem | null>(null);
  const gridTabFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync grid tabs across browser tabs & events
  React.useEffect(() => {
    const handleTabsSync = () => setGridTabs(getStoredGridTabs());
    window.addEventListener('nhealth_grid_tabs_updated', handleTabsSync);
    return () => window.removeEventListener('nhealth_grid_tabs_updated', handleTabsSync);
  }, []);

  React.useEffect(() => {
    if (isGridTabModalOpen) {
      return navHistory.pushModal('admin-grid-tab-modal', 'Grid Tab Editor', () => setIsGridTabModalOpen(false));
    }
  }, [isGridTabModalOpen]);

  React.useEffect(() => {
    if (deletingGridTab) {
      return navHistory.pushModal('admin-delete-grid-tab-modal', 'Delete Grid Tab', () => setDeletingGridTab(null));
    }
  }, [deletingGridTab]);

  const handleGridTabFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGridTabUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setGridTabUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setGridTabUploadError('Image exceeds 4MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setGridTabImagePreview(result);
      setGridTabForm((prev) => ({ ...prev, imageUrl: result }));
      showToast('✓ Custom Tab banner image loaded.');
    };
    reader.onerror = () => setGridTabUploadError('Failed to read image file.');
    reader.readAsDataURL(file);
  };

  const handleOpenAddGridTab = (targetSec?: GridTabSectionType) => {
    const sec = targetSec || adminGridTabSection;
    setEditingGridTabId(null);
    setGridTabForm({
      section: sec,
      title: '',
      imageUrl: '',
      targetLink: 'Doctor home visits',
      badge: '',
      isActive: true,
      order: gridTabs.filter((t) => t.section === sec).length + 1,
    });
    setGridTabImagePreview('');
    setGridTabUploadError(null);
    setIsGridTabModalOpen(true);
  };

  const handleOpenEditGridTab = (tab: GridTabItem) => {
    setEditingGridTabId(tab.id);
    setGridTabForm({ ...tab });
    setGridTabImagePreview(tab.imageUrl || '');
    setGridTabUploadError(null);
    setIsGridTabModalOpen(true);
  };

  const handleSaveGridTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gridTabForm.title?.trim()) {
      setGridTabUploadError('Please provide a tab title.');
      return;
    }
    const sec = gridTabForm.section || adminGridTabSection;
    if (editingGridTabId) {
      updateStoredGridTab(editingGridTabId, {
        title: gridTabForm.title.trim(),
        section: sec,
        targetLink: gridTabForm.targetLink?.trim() || 'overview',
        badge: gridTabForm.badge?.trim() || undefined,
        imageUrl: gridTabForm.imageUrl || '',
        isActive: gridTabForm.isActive ?? true,
      });
      showToast('✓ Grid Tab updated successfully.');
    } else {
      addStoredGridTab({
        title: gridTabForm.title.trim(),
        section: sec,
        targetLink: gridTabForm.targetLink?.trim() || 'overview',
        badge: gridTabForm.badge?.trim() || undefined,
        imageUrl: gridTabForm.imageUrl || '',
        isActive: gridTabForm.isActive ?? true,
        order: gridTabForm.order || (gridTabs.filter((t) => t.section === sec).length + 1),
      });
      showToast('✓ New Grid Tab added successfully.');
    }
    setGridTabs(getStoredGridTabs());
    setIsGridTabModalOpen(false);
  };

  const handleToggleGridTabActive = (tab: GridTabItem) => {
    updateStoredGridTab(tab.id, { isActive: !tab.isActive });
    setGridTabs(getStoredGridTabs());
    showToast(`✓ Tab "${tab.title}" is now ${!tab.isActive ? 'Active' : 'Inactive'}.`);
  };

  const handleDeleteGridTabConfirm = () => {
    if (!deletingGridTab) return;
    deleteStoredGridTab(deletingGridTab.id);
    setGridTabs(getStoredGridTabs());
    showToast(`✓ Grid Tab "${deletingGridTab.title}" deleted.`);
    setDeletingGridTab(null);
  };

  const handleResetGridTabs = () => {
    if (window.confirm('Reset all Grid Tabs to default configuration?')) {
      resetStoredGridTabs();
      setGridTabs(getStoredGridTabs());
      showToast('✓ Grid Tabs reset to defaults.');
    }
  };

  // Sync banners across browser tabs & events
  React.useEffect(() => {
    const handleBannersSync = () => {
      setBanners(getStoredBanners());
    };
    window.addEventListener('nhealth_banners_updated', handleBannersSync);
    window.addEventListener('nhealth_banner_updated', handleBannersSync);
    return () => {
      window.removeEventListener('nhealth_banners_updated', handleBannersSync);
      window.removeEventListener('nhealth_banner_updated', handleBannersSync);
    };
  }, []);

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAdUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setAdUploadError('Image size exceeds 4MB limit. Please compress or select a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAdFormImagePreview(result);
      setBannerForm((prev) => ({ ...prev, imageUrl: result }));
      showToast('✓ Image loaded successfully into banner form.');
    };
    reader.onerror = () => {
      setAdUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddBanner = (targetSec?: BannerSectionType) => {
    setEditingBannerId(null);
    const sec = targetSec || adminBannerSection;
    const secBanners = banners.filter((b) => b.section === sec);
    const newOrder = secBanners.length + 1;
    setBannerForm({
      section: sec,
      title: '',
      subtitle: '',
      tag: sec === 'section1' ? 'BANNER SECTION 1' : 'BANNER SECTION 2',
      ctaText: 'Book Now',
      ctaLink: 'Home diagnostics & lab tests',
      imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: '4:1',
      heightMode: 'medium',
      imageFit: 'cover',
      scale: 100,
      isActive: true,
      order: newOrder,
      autoPlayInterval: 5,
    });
    setAdFormImagePreview('https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80');
    setAdUploadError(null);
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: AdBannerItem) => {
    setEditingBannerId(b.id);
    setBannerForm({ ...b });
    setAdFormImagePreview(b.imageUrl);
    setAdUploadError(null);
    setIsBannerModalOpen(true);
  };

  const handleCloseBannerModal = () => {
    setIsBannerModalOpen(false);
    setEditingBannerId(null);
    setBannerForm({});
    setAdUploadError(null);
  };

  const handleSaveBannerModal = () => {
    if (!bannerForm.title?.trim()) {
      setAdUploadError('Please enter a banner title.');
      return;
    }
    if (!bannerForm.imageUrl?.trim()) {
      setAdUploadError('Please provide an image URL or upload a file.');
      return;
    }

    const sec = bannerForm.section || adminBannerSection;

    if (editingBannerId) {
      updateStoredBanner(editingBannerId, { ...bannerForm, section: sec, aspectRatio: '4:1' });
      setBanners(getStoredBanners());
      showToast(`✓ Banner "${bannerForm.title}" updated in ${sec === 'section1' ? 'Section 1' : 'Section 2'}!`);
    } else {
      const secBanners = banners.filter((b) => b.section === sec);
      const created = addStoredBanner({
        section: sec,
        imageUrl: bannerForm.imageUrl || '',
        title: bannerForm.title || '',
        subtitle: bannerForm.subtitle || '',
        tag: bannerForm.tag || (sec === 'section1' ? 'BANNER SECTION 1' : 'BANNER SECTION 2'),
        ctaText: bannerForm.ctaText || 'Learn More',
        ctaLink: bannerForm.ctaLink || 'Home diagnostics & lab tests',
        aspectRatio: '4:1',
        heightMode: bannerForm.heightMode || 'medium',
        imageFit: bannerForm.imageFit || 'cover',
        scale: bannerForm.scale || 100,
        isActive: bannerForm.isActive !== undefined ? bannerForm.isActive : true,
        order: bannerForm.order || secBanners.length + 1,
        autoPlayInterval: bannerForm.autoPlayInterval || 5,
      });
      setBanners(getStoredBanners());
      showToast(`✓ New banner "${created.title}" added to ${sec === 'section1' ? 'Section 1' : 'Section 2'}!`);
    }
    handleCloseBannerModal();
  };

  const handleToggleBannerActive = (banner: AdBannerItem) => {
    updateStoredBanner(banner.id, { isActive: !banner.isActive });
    setBanners(getStoredBanners());
    const secLabel = banner.section === 'section1' ? 'Section 1' : 'Section 2';
    showToast(`Banner "${banner.title}" in ${secLabel} is now ${!banner.isActive ? 'Active (Live)' : 'Inactive (Hidden)'}.`);
  };

  const handleMoveBannerOrder = (bannerId: string, direction: 'up' | 'down') => {
    const target = banners.find((b) => b.id === bannerId);
    if (!target) return;
    const sec = target.section;
    const sorted = banners.filter((b) => b.section === sec).sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((b) => b.id === bannerId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const newIds = sorted.map((b) => b.id);
    const temp = newIds[idx];
    newIds[idx] = newIds[targetIdx];
    newIds[targetIdx] = temp;
    reorderStoredBanners(newIds, sec);
    setBanners(getStoredBanners());
    showToast(`Display order updated for ${sec === 'section1' ? 'Section 1' : 'Section 2'}.`);
  };

  const handleConfirmDeleteBanner = () => {
    if (!deletingBanner) return;
    deleteStoredBanner(deletingBanner.id);
    setBanners(getStoredBanners());
    showToast(`✓ Banner "${deletingBanner.title}" permanently deleted.`);
    setDeletingBanner(null);
  };

  const handleResetBanners = () => {
    const def = resetStoredBanners();
    setBanners(def);
    showToast('Banners reset to system defaults for Section 1 and Section 2.');
  };


  const handleSetEnquiryStatus = (id: string, newStatus: EnquiryStatus, notes?: string) => {
    if (onUpdateEnquiryStatus) {
      onUpdateEnquiryStatus(id, newStatus, notes);
    } else {
      const updated = updateEnquiryStatus(id, newStatus, notes);
      setLocalEnquiries(updated);
    }
    if (inspectingEnquiry && inspectingEnquiry.id === id) {
      setInspectingEnquiry((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              adminNotes: notes !== undefined ? notes : prev.adminNotes,
            }
          : null
      );
    }
    showToast(`Enquiry ${id} status updated to "${newStatus}".`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const emailClean = adminEmail.trim().toLowerCase();
    const passwordClean = adminPassword.trim();

    if (
      emailClean === 'admin@nhealth.in' &&
      (passwordClean === 'admin123' ||
        passwordClean === 'Admin@2026' ||
        passwordClean === 'admin2026' ||
        passwordClean === 'admin')
    ) {
      try {
        sessionStorage.setItem('nhealth_admin_authenticated', 'true');
      } catch {}
      setIsAuthenticated(true);
    } else {
      setAuthError('Authentication failed: Invalid administrator email or password.');
    }
  };

  const handleAdminLogout = () => {
    try {
      sessionStorage.removeItem('nhealth_admin_authenticated');
    } catch {}
    setIsAuthenticated(false);
    onNavigateHome();
  };

  // Helper updater
  const updatePartnerField = (partnerId: string, updates: Partial<PartnerApplication>) => {
    if (onUpdatePartner) {
      onUpdatePartner(partnerId, updates);
    } else {
      // Fallback
      if (updates.status) {
        onTogglePartnerStatus(partnerId, updates.status);
      }
    }
  };

  // If not authenticated, render Secure Administrative Sign-in screen with direct link protection
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#00172b] flex flex-col justify-between selection:bg-[#008080]/20 selection:text-white px-4 py-8 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-radial from-teal-500/10 via-transparent to-transparent pointer-events-none blur-3xl" />

        {/* Top return bar */}
        <div className="max-w-md w-full mx-auto flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Site</span>
          </button>
          <span className="font-mono text-[11px] text-teal-400/80">ROUTE: /command-center</span>
        </div>

        {/* Central Sign-in Card */}
        <div className="max-w-md w-full mx-auto my-auto relative z-10">
          <div className="bg-[#00223f] border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Header Icon & Brand */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center mb-3 shadow-lg">
                <ShieldCheck className="w-8 h-8 text-teal-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Nhealth Command Center
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xs">
                Administrative Verification, Security Rules, Inactivity Suspension &amp; Anti-Fraud Desk
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/60 border border-teal-400/30 text-[11px] text-teal-300 font-mono">
                <Lock className="w-3 h-3 text-teal-400" />
                <span>Restricted Administrative Portal</span>
              </div>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Administrator Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-teal-400 text-white text-xs sm:text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono"
                    placeholder="admin@nhealth.in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Command Center Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-teal-400 text-white text-xs sm:text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono"
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Demo Hint Banner */}
              <div className="bg-teal-950/60 border border-teal-500/20 rounded-xl p-2.5 text-[11px] text-teal-300 font-mono flex items-center justify-between">
                <span>Credentials: admin@nhealth.in</span>
                <span className="font-bold text-emerald-400">PW: admin123</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-[#008080] hover:from-teal-400 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Authenticate &amp; Enter Command Center</span>
              </button>
            </form>

            {/* Seamless Redirect to Homepage */}
            <div className="mt-5 pt-4 border-t border-slate-700/60 text-center">
              <button
                type="button"
                onClick={onNavigateHome}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Not an admin? <strong className="text-teal-400 underline underline-offset-2">Redirect to Patient Homepage ('/')</strong>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="max-w-md w-full mx-auto text-center text-[11px] text-slate-500">
          &copy; 2026 Nhealth Unified Healthcare Technologies Private Limited.
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 3 METRICS & CALCULATIONS
  // -------------------------------------------------------------
  // 1. Pending Approvals
  const pendingPartners = partners.filter((p) => p.status === 'Pending');
  const pendingCount = pendingPartners.length;

  // 2. Active Live Accounts (Live and not suspended)
  const activeLivePartners = partners.filter((p) => p.status === 'Live' && !isPartnerSuspended(p));
  const liveCount = activeLivePartners.length;

  // 3. Inactive / Suspended Accounts (either status==='Suspended' or inactive >90 days or restricted)
  const suspendedPartners = partners.filter((p) => isPartnerSuspended(p));
  const suspendedCount = suspendedPartners.length;
  const revokeRequestsCount = suspendedPartners.filter((p) => p.revocationRequested).length;

  // 4. High-Risk Multi-Registered Accounts (Flagged 4+ Services)
  const highRiskPartners = partners.filter((p) => {
    const risk = checkIsHighRiskMultiRegistration(p.phone, partners);
    return risk.isHighRisk;
  });
  const highRiskCount = highRiskPartners.length;

  // 5. Centralized Enquiries Metrics
  const pendingEnquiriesCount = localEnquiries.filter((e) => e.status === 'Pending').length;
  const reviewedEnquiriesCount = localEnquiries.filter((e) => e.status === 'Reviewed').length;
  const contactedEnquiriesCount = localEnquiries.filter((e) => e.status === 'Contacted').length;
  const resolvedEnquiriesCount = localEnquiries.filter((e) => e.status === 'Resolved').length;

  // Filtered enquiries based on search, status filter, and type filter
  const filteredEnquiries = localEnquiries.filter((e) => {
    if (enquiryStatusFilter !== 'All' && e.status !== enquiryStatusFilter) return false;
    if (enquiryTypeFilter !== 'All' && e.type !== enquiryTypeFilter) return false;
    const q = enquirySearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      e.id.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      (e.companyName && e.companyName.toLowerCase().includes(q)) ||
      (e.designation && e.designation.toLowerCase().includes(q)) ||
      e.email.toLowerCase().includes(q) ||
      e.phone.includes(q) ||
      (e.location && e.location.toLowerCase().includes(q)) ||
      (e.requirements && e.requirements.toLowerCase().includes(q)) ||
      (e.categoryOrService && e.categoryOrService.toLowerCase().includes(q)) ||
      (e.selectedOfferings && e.selectedOfferings.some((o) => o.toLowerCase().includes(q)))
    );
  });

  // 6. Filtered Vital Scans based on Mode, Date, and Search
  const filteredVitalScans = vitalScans.filter((scan) => {
    if (vitalModeFilter !== 'All' && scan.mode !== vitalModeFilter) return false;
    if (vitalDateFilter === 'Today') {
      const today = new Date().toISOString().substring(0, 10);
      const isToday = scan.date === 'Today' || (scan.scanTimestamp && scan.scanTimestamp.startsWith(today));
      if (!isToday) return false;
    } else if (vitalDateFilter === '7days') {
      const scanTime = new Date(scan.scanTimestamp || 0).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (scanTime < sevenDaysAgo) return false;
    }
    const q = vitalSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      scan.id.toLowerCase().includes(q) ||
      scan.userId.toLowerCase().includes(q) ||
      scan.fullName.toLowerCase().includes(q) ||
      scan.mobileNumber.includes(q) ||
      scan.status.toLowerCase().includes(q) ||
      scan.mode.toLowerCase().includes(q)
    );
  });

  // 7. Filtered Guest Bookings based on Service, Status, Date, and Search
  const filteredGuestBookings = guestBookings.filter((booking) => {
    if (guestServiceFilter !== 'All' && !booking.serviceName.toLowerCase().includes(guestServiceFilter.toLowerCase())) return false;
    if (guestStatusFilter !== 'All' && booking.status !== guestStatusFilter) return false;
    if (guestDateFilter === 'Today') {
      const today = new Date().toISOString().substring(0, 10);
      const dateStr = booking.bookedAt || booking.preferredDate || '';
      if (!dateStr.startsWith(today)) return false;
    } else if (guestDateFilter === '7days') {
      const time = new Date(booking.bookedAt || 0).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (time < sevenDaysAgo) return false;
    }
    const q = guestSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      booking.referenceId.toLowerCase().includes(q) ||
      booking.patientName.toLowerCase().includes(q) ||
      booking.phone.includes(q) ||
      booking.serviceName.toLowerCase().includes(q) ||
      booking.city.toLowerCase().includes(q) ||
      (booking.symptoms && booking.symptoms.toLowerCase().includes(q))
    );
  });

  // Filtered partners list based on Search, Alignment Tab, and Vertical Category
  const filteredPartners = partners.filter((p) => {
    // 1. Search Query
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      p.entityName.toLowerCase().includes(query) ||
      p.specialty.toLowerCase().includes(query) ||
      p.city.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      p.registrationNumber.toLowerCase().includes(query) ||
      p.contactPerson.toLowerCase().includes(query);

    // 2. Alignment Tab Filter
    let matchesTab = true;
    if (alignmentTab === 'Pending') {
      matchesTab = p.status === 'Pending';
    } else if (alignmentTab === 'Live') {
      matchesTab = p.status === 'Live' && !isPartnerSuspended(p);
    } else if (alignmentTab === 'Suspended') {
      matchesTab = isPartnerSuspended(p);
    } else if (alignmentTab === 'HighRisk') {
      const risk = checkIsHighRiskMultiRegistration(p.phone, partners);
      matchesTab = risk.isHighRisk;
    }

    // 3. Category Filter
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    return matchesSearch && matchesTab && matchesCategory;
  });

  // Action Handlers
  const handleApprove = (partner: PartnerApplication) => {
    updatePartnerField(partner.id, {
      status: 'Live',
      verifiedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isSuspendedDueToInactivity: false,
    });
    showToast(`✓ Approved! ${partner.entityName} is now LIVE on the Nhealth network.`);
  };

  const handlePutOnHold = (partner: PartnerApplication) => {
    updatePartnerField(partner.id, { status: 'Pending' });
    showToast(`Status changed: ${partner.entityName} reverted to Pending review.`);
  };

  // Suspension Actions
  const handleSuspendAccount = (partner: PartnerApplication, reason?: string) => {
    updatePartnerField(partner.id, {
      status: 'Suspended',
      isSuspendedDueToInactivity: true,
      suspensionReason: reason || 'Suspended by Admin due to inactivity or policy review',
      suspensionDate: new Date().toISOString(),
    });
    showToast(`Account Suspended: ${partner.entityName} has been flagged as Suspended.`);
  };

  // Revocation / Re-activation Approval Action
  const handleApproveRevocation = (partner: PartnerApplication) => {
    updatePartnerField(partner.id, {
      status: 'Live',
      isSuspendedDueToInactivity: false,
      lastActiveAt: new Date().toISOString(),
      revocationRequested: false,
      revocationStatus: 'Approved',
      isRestrictedByAdmin: false,
      suspensionReason: undefined,
    });
    setReviewingRevocationPartner(null);
    showToast(`✓ Account Re-activated! ${partner.entityName} is restored to Live. Notification routed to ${partner.email} & support@nhealth.in.`);
  };

  const handleRejectRevocation = (partner: PartnerApplication) => {
    updatePartnerField(partner.id, {
      revocationRequested: false,
      revocationStatus: 'Rejected',
    });
    setReviewingRevocationPartner(null);
    showToast(`Revocation request rejected for ${partner.entityName}. Account remains suspended.`);
  };

  // High-Risk Fraud Prevention Controls
  const handleToggleRestriction = (partner: PartnerApplication) => {
    const willRestrict = !partner.isRestrictedByAdmin;
    updatePartnerField(partner.id, {
      isRestrictedByAdmin: willRestrict,
      adminRestrictedReason: willRestrict
        ? 'Restricted by Admin: Potential multi-account fraud / misuse review'
        : undefined,
      status: willRestrict ? 'Suspended' : partner.status,
    });
    showToast(
      willRestrict
        ? `🔒 Account Restricted: Multi-registration fraud restriction applied to ${partner.entityName}.`
        : `🔓 Restriction Lifted: Account unfreezed for ${partner.entityName}.`
    );
  };

  const handleWhitelistPhoneGroup = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    partners.forEach((p) => {
      if (p.phone.replace(/\D/g, '').slice(-10) === cleanPhone) {
        updatePartnerField(p.id, {
          whitelistedByAdmin: true,
          isRestrictedByAdmin: false,
        });
      }
    });
    setInspectingPhone(null);
    showToast(`✓ Whitelisted: All accounts under +91 ${cleanPhone} verified as authorized medical consortium.`);
  };

  const handleBulkRestrictPhoneGroup = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    partners.forEach((p) => {
      if (p.phone.replace(/\D/g, '').slice(-10) === cleanPhone) {
        updatePartnerField(p.id, {
          isRestrictedByAdmin: true,
          status: 'Suspended',
          adminRestrictedReason: 'Multi-account fraud / misuse prevention lockdown',
        });
      }
    });
    setInspectingPhone(null);
    showToast(`🔒 Bulk Restriction Applied: All accounts under +91 ${cleanPhone} frozen from logins.`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-[#008080]/15 selection:text-[#002b49]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#002b49] text-white px-5 py-3 rounded-2xl shadow-2xl border border-teal-400/40 flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Console Navbar */}
      <nav className="bg-[#00172b] text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Patient Portal</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <img
              src="https://i.ibb.co/JW6HFRV0/Nhealth-logo-8cm-x-8cm-high-quality-1-1.png"
              alt="Nhealth Logo"
              className="h-9 w-auto object-contain rounded-lg border border-teal-500/30 shrink-0"
              onError={(e) => {
                e.currentTarget.src = 'https://i.ibb.co/wZG4rNV3/Nhealth-logo-8cm-x-8cm-high-quality-1-1.png';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Nhealth Command Center
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  Phase 3 Security &amp; Compliance
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block">
                Inactivity Suspensions • Fraud Warning Flags • Live Partner Credentialing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onNavigateOnboarding}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all cursor-pointer shadow-xs"
            >
              <span>+ Add Partner</span>
            </button>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all cursor-pointer"
              title="Sign Out of Command Center and return home"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Admin Console */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Real-time Security Notice Banner */}
        <div className="bg-gradient-to-r from-teal-950 via-[#002b49] to-[#00172b] text-white p-4 sm:p-5 rounded-3xl border border-teal-500/40 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-400/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-400/30">
              <ShieldAlert className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Phase 3 Security &amp; Anti-Fraud Controls Active</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  90-DAY INACTIVITY RULE ENFORCED
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Accounts without operational activity for &gt;90 days are automatically flagged as <strong>"Suspended due to Inactivity"</strong>. Phone numbers registered in 4+ categories trigger the <strong>High-Risk Warning Flag</strong>.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {revokeRequestsCount > 0 && (
              <button
                type="button"
                onClick={() => setAlignmentTab('Suspended')}
                className="text-xs font-mono bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-400/40 flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{revokeRequestsCount} Revocation Request{revokeRequestsCount > 1 ? 's' : ''} Pending</span>
              </button>
            )}
            {highRiskCount > 0 && (
              <button
                type="button"
                onClick={() => setAlignmentTab('HighRisk')}
                className="text-xs font-mono bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-xl border border-red-400/40 flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{highRiskCount} High-Risk Flagged</span>
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STATS GRID: Phase 3 Alignment (4 Primary Buckets) */}
        {/* ------------------------------------------------------------- */}
        {/* ------------------------------------------------------------- */}
        {/* STATS GRID: Phase 3 Alignment & Centralized Enquiries Pipeline */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {/* Card 1: Pending Approvals */}
          <div
            onClick={() => setAlignmentTab('Pending')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
              alignmentTab === 'Pending'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Pending
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {pendingCount}
            </div>
            <span className="text-[10.5px] text-amber-800 font-medium mt-0.5 block truncate">
              Awaiting verification
            </span>
          </div>

          {/* Card 2: Active Live Accounts */}
          <div
            onClick={() => setAlignmentTab('Live')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
              alignmentTab === 'Live'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                Active Live
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {liveCount}
            </div>
            <span className="text-[10.5px] text-emerald-800 font-medium mt-0.5 block truncate">
              Live &amp; patient-ready
            </span>
          </div>

          {/* Card 3: Inactive / Suspended Accounts */}
          <div
            onClick={() => setAlignmentTab('Suspended')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
              alignmentTab === 'Suspended'
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30'
                : 'bg-white border-slate-200 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider block">
                Suspended
              </span>
              <Ban className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-rose-700">
                {suspendedCount}
              </span>
              {revokeRequestsCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 animate-pulse">
                  {revokeRequestsCount} Req
                </span>
              )}
            </div>
            <span className="text-[10.5px] text-rose-800 font-medium mt-0.5 block truncate">
              Inactivity or holds
            </span>
          </div>

          {/* Card 4: High-Risk Multi-Registered Accounts */}
          <div
            onClick={() => setAlignmentTab('HighRisk')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
              alignmentTab === 'HighRisk'
                ? 'bg-amber-100/60 border-amber-500 ring-2 ring-amber-500/40'
                : 'bg-white border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider block">
                High-Risk
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">
              {highRiskCount}
            </div>
            <span className="text-[10.5px] text-amber-900 font-medium mt-0.5 block truncate">
              Phone in 4+ verticals
            </span>
          </div>

          {/* Card 5: Review Enquiries */}
          <div
            onClick={() => setAlignmentTab('Enquiries')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
              alignmentTab === 'Enquiries'
                ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/30'
                : 'bg-white border-slate-200 hover:border-teal-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-950 uppercase tracking-wider block">
                Enquiries
              </span>
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-teal-800">
                {localEnquiries.length}
              </span>
              {pendingEnquiriesCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 animate-pulse">
                  {pendingEnquiriesCount} New
                </span>
              )}
            </div>
            <span className="text-[10.5px] text-teal-900 font-medium mt-0.5 block truncate">
              Corporate &amp; leads
            </span>
          </div>

          {/* Card 6: Live Metric Counter - Total Vital Scans */}
          <div
            onClick={() => setAlignmentTab('VitalScans')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
              alignmentTab === 'VitalScans'
                ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/30'
                : 'bg-white border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-950 uppercase tracking-wider block">
                Total Vital Scans
              </span>
              <HeartPulse className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-purple-800">
                {vitalScans.length}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900">
                Live
              </span>
            </div>
            <span className="text-[10.5px] text-purple-800 font-medium mt-0.5 block truncate">
              {vitalScans.filter((s) => s.mode === 'Logged-in').length} User · {vitalScans.filter((s) => s.mode === 'Guest').length} Guest
            </span>
          </div>

          {/* Card 7: Dedicated Guest Bookings */}
          <div
            onClick={() => setAlignmentTab('GuestBookings')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
              alignmentTab === 'GuestBookings'
                ? 'bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/30'
                : 'bg-white border-slate-200 hover:border-cyan-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-950 uppercase tracking-wider block">
                Guest Bookings
              </span>
              <ClipboardList className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-cyan-800">
                {guestBookings.length}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-200 text-cyan-900">
                Hero
              </span>
            </div>
            <span className="text-[10.5px] text-cyan-800 font-medium mt-0.5 block truncate">
              {guestBookings.filter((b) => b.status === 'Confirmed').length} Confirmed orders
            </span>
          </div>

          {/* Card 8: Dedicated Advertising Management */}
          <div
            onClick={() => setAlignmentTab('Advertising')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
              alignmentTab === 'Advertising'
                ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/30'
                : 'bg-white border-slate-200 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider block">
                Advertising
              </span>
              <Megaphone className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-indigo-800">
                {banners.filter((b) => b.isActive).length} Active
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-200 text-indigo-900">
                {banners.length} Total
              </span>
            </div>
            <span className="text-[10.5px] text-indigo-800 font-medium mt-0.5 block truncate">
              Dynamic Auto-Slider Carousel
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ALIGNMENT TABS & SEARCH BAR */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
          {/* Primary Queue Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mr-1">
                View Queue:
              </span>

              {/* Tab: All */}
              <button
                type="button"
                onClick={() => setAlignmentTab('All')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  alignmentTab === 'All'
                    ? 'bg-[#002b49] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>All Accounts</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  alignmentTab === 'All' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {partners.length}
                </span>
              </button>

              {/* Tab 1: Pending Approvals */}
              <button
                type="button"
                onClick={() => setAlignmentTab('Pending')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  alignmentTab === 'Pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Approvals</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  alignmentTab === 'Pending' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
                }`}>
                  {pendingCount}
                </span>
              </button>

              {/* Tab 2: Active Live Accounts */}
              <button
                type="button"
                onClick={() => setAlignmentTab('Live')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  alignmentTab === 'Live'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Live Accounts</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  alignmentTab === 'Live' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {liveCount}
                </span>
              </button>

              {/* Tab 3: Inactive / Suspended Accounts */}
              <button
                type="button"
                onClick={() => setAlignmentTab('Suspended')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  alignmentTab === 'Suspended'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Inactive / Suspended</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  alignmentTab === 'Suspended' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'
                }`}>
                  {suspendedCount}
                </span>
                {revokeRequestsCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-black animate-pulse">
                    {revokeRequestsCount} Revoke Req
                  </span>
                )}
              </button>

              {/* Tab 4: High-Risk Multi-Registered Accounts */}
              <button
                type="button"
                onClick={() => setAlignmentTab('HighRisk')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  alignmentTab === 'HighRisk'
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-xs'
                    : 'bg-amber-100/70 hover:bg-amber-200 text-amber-950 border border-amber-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>High-Risk</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  alignmentTab === 'HighRisk' ? 'bg-white/20 text-white' : 'bg-amber-300 text-amber-950 font-black'
                }`}>
                  {highRiskCount}
                </span>
              </button>

              {/* Tab 5: Review Enquiries */}
              <button
                type="button"
                onClick={() => setAlignmentTab('Enquiries')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  alignmentTab === 'Enquiries'
                    ? 'bg-gradient-to-r from-teal-700 to-[#002b49] text-white shadow-xs'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Review Enquiries</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    alignmentTab === 'Enquiries'
                      ? 'bg-white/20 text-white'
                      : 'bg-teal-200 text-teal-900'
                  }`}
                >
                  {localEnquiries.length}
                </span>
                {pendingEnquiriesCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-300 text-amber-950 font-black animate-pulse">
                    {pendingEnquiriesCount} New
                  </span>
                )}
              </button>

              {/* Tab 6: Total Vital Scans */}
              <button
                type="button"
                onClick={() => setAlignmentTab('VitalScans')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  alignmentTab === 'VitalScans'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Total Vital Scans</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    alignmentTab === 'VitalScans'
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-200 text-purple-900'
                  }`}
                >
                  {vitalScans.length}
                </span>
              </button>

              {/* Tab 7: Guest Bookings */}
              <button
                type="button"
                onClick={() => setAlignmentTab('GuestBookings')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  alignmentTab === 'GuestBookings'
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border border-cyan-200'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Guest Bookings</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    alignmentTab === 'GuestBookings'
                      ? 'bg-white/20 text-white'
                      : 'bg-cyan-200 text-cyan-900'
                  }`}
                >
                  {guestBookings.length}
                </span>
              </button>

              {/* Tab 8: Advertising Banner Management */}
              <button
                type="button"
                onClick={() => setAlignmentTab('Advertising')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  alignmentTab === 'Advertising'
                    ? 'bg-gradient-to-r from-indigo-700 to-blue-700 text-white shadow-xs'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Advertising</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    alignmentTab === 'Advertising'
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-200 text-indigo-900'
                  }`}
                >
                  {banners.filter((b) => b.isActive).length} Active
                </span>
              </button>
            </div>

            {/* Quick Count Badge */}
            <div className="text-xs text-slate-500 font-medium">
              {alignmentTab === 'VitalScans' ? (
                <span>
                  Showing <strong>{filteredVitalScans.length}</strong> of {vitalScans.length} vital scans
                </span>
              ) : alignmentTab === 'GuestBookings' ? (
                <span>
                  Showing <strong>{filteredGuestBookings.length}</strong> of {guestBookings.length} guest bookings
                </span>
              ) : alignmentTab === 'Enquiries' ? (
                <span>
                  Showing <strong>{filteredEnquiries.length}</strong> of {localEnquiries.length} enquiries
                </span>
              ) : alignmentTab === 'Advertising' ? (
                <span>
                  Carousel Banners: <strong className="text-emerald-600">{banners.filter((b) => b.isActive).length} Active</strong> • {banners.length} Total Campaigns
                </span>
              ) : (
                <span>
                  Showing <strong>{filteredPartners.length}</strong> of {partners.length} accounts
                </span>
              )}
            </div>
          </div>

          {/* Search & Filter Row */}
          {alignmentTab === 'VitalScans' ? (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
              {/* Vital Scans Search Input */}
              <div className="relative w-full lg:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by Scan ID, User/Guest ID, Patient name, Phone, Status..."
                  value={vitalSearchQuery}
                  onChange={(e) => setVitalSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
                />
                {vitalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setVitalSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filters: Date & Mode */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto text-xs">
                {/* Date Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-bold mr-1">Date:</span>
                  {(['All', 'Today', '7days'] as const).map((df) => {
                    const label = df === 'All' ? 'All Time' : df === 'Today' ? 'Today' : 'Last 7 Days';
                    const isSel = vitalDateFilter === df;
                    return (
                      <button
                        key={df}
                        type="button"
                        onClick={() => setVitalDateFilter(df)}
                        className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer text-xs ${
                          isSel
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Mode Filter */}
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span className="text-slate-400 text-xs font-bold mr-1">Mode:</span>
                  {(['All', 'Logged-in', 'Guest'] as const).map((mf) => {
                    const isSel = vitalModeFilter === mf;
                    const count =
                      mf === 'All'
                        ? vitalScans.length
                        : vitalScans.filter((s) => s.mode === mf).length;
                    return (
                      <button
                        key={mf}
                        type="button"
                        onClick={() => setVitalModeFilter(mf)}
                        className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                          isSel
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        <span>{mf === 'All' ? 'All Scans' : mf}</span>
                        <span className={`text-[10px] px-1 rounded-full ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : alignmentTab === 'GuestBookings' ? (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
              {/* Guest Booking Search Input */}
              <div className="relative w-full lg:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by Reference ID, Guest name, Phone, Service, Doctor..."
                  value={guestSearchQuery}
                  onChange={(e) => setGuestSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50/50"
                />
                {guestSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setGuestSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filters: Date, Service, Status */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto text-xs">
                {/* Date Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-bold mr-1">Date:</span>
                  {(['All', 'Today', '7days'] as const).map((df) => {
                    const label = df === 'All' ? 'All Time' : df === 'Today' ? 'Today' : 'Last 7 Days';
                    const isSel = guestDateFilter === df;
                    return (
                      <button
                        key={df}
                        type="button"
                        onClick={() => setGuestDateFilter(df)}
                        className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer text-xs ${
                          isSel
                            ? 'bg-cyan-700 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Service Type Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-bold mr-1">Service:</span>
                  <select
                    value={guestServiceFilter}
                    onChange={(e) => setGuestServiceFilter(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-700 shadow-2xs"
                  >
                    <option value="All">All Services</option>
                    <option value="CareRide">CareRide / Transport</option>
                    <option value="Diagnostics">Diagnostics &amp; Lab Tests</option>
                    <option value="Doctor">Doctor Home Visits</option>
                    <option value="Nursing">Nursing &amp; Care Assist</option>
                    <option value="Pharmacy">Pharmacy &amp; Medicines</option>
                    <option value="Ambulance">Ambulance &amp; Emergency</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-bold mr-1">Status:</span>
                  {(['All', 'Confirmed', 'Clinician Dispatched', 'Sample Collected', 'Report Ready'] as const).map((st) => {
                    const isSel = guestStatusFilter === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setGuestStatusFilter(st)}
                        className={`px-2 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer text-xs ${
                          isSel
                            ? 'bg-cyan-700 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : alignmentTab === 'Enquiries' ? (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
              {/* Enquiry Search Input */}
              <div className="relative w-full lg:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by company, person, email, phone, location, requirements..."
                  value={enquirySearchQuery}
                  onChange={(e) => setEnquirySearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#008080] bg-slate-50/50"
                />
                {enquirySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setEnquirySearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Chips for Enquiries */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 text-xs">
                <span className="text-slate-400 text-xs font-bold hidden sm:inline mr-1">Status:</span>
                {(['All', 'Pending', 'Reviewed', 'Contacted', 'Resolved'] as const).map((st) => {
                  const isSelected = enquiryStatusFilter === st;
                  const count =
                    st === 'All'
                      ? localEnquiries.length
                      : localEnquiries.filter((e) => e.status === st).length;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEnquiryStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#008080] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <span>{st}</span>
                      <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by entity, phone, doctor, license, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#008080] bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs">
                <span className="text-slate-400 text-xs font-bold hidden sm:inline mr-1">Category:</span>
                {['All', 'Doctor', 'Hospital', 'Diagnostics', 'Pharmacy', 'Ambulance', 'Care Assist', 'Blood Bank'].map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-[#008080] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB PANELS: ADVERTISING, VITAL SCANS, GUEST BOOKINGS, ENQUIRIES, OR PARTNERS */}
        {/* ------------------------------------------------------------- */}
        {alignmentTab === 'Advertising' ? (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Dimensions Recommendation Card */}
            <div className="bg-gradient-to-r from-indigo-900 via-[#002b49] to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-indigo-500/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-400/30">
                    <Megaphone className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>Advertising &amp; Dual 4:1 Banner Carousel Management</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                        {banners.filter((b) => b.isActive).length} ACTIVE LIVE
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-white/10 text-slate-300 border-white/20">
                        {banners.length} TOTAL
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Manage two stacked, independent 4:1 banner carousels on the patient dashboard. Section 1 appears on top and Section 2 directly below it.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetBanners}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddBanner(adminBannerSection)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-[#00172d] font-black text-xs shadow-lg shadow-teal-900/50 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add to {adminBannerSection === 'section1' ? 'Section 1' : 'Section 2'}</span>
                  </button>
                </div>
              </div>

              {/* RECOMMENDED DIMENSIONS GUIDELINES DISPLAY (Strict 4:1 Ratio) */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Info className="w-5 h-5 text-cyan-300 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-cyan-200">Enforced Container Aspect Ratio:</span>{' '}
                    <span className="font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-400/40 text-cyan-300 font-bold">4:1 Ratio (aspect-ratio: 4 / 1)</span>
                    <span className="mx-2 text-slate-400">|</span>
                    <span className="font-bold text-teal-200">Recommended Dimensions:</span>{' '}
                    <span className="font-mono bg-teal-950/80 px-2 py-0.5 rounded border border-teal-400/40 text-teal-300 font-bold">1200 x 300 px</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300">
                  Strict 4:1 container width across Desktop, Tablet &amp; Mobile • Max file: 4MB
                </div>
              </div>
            </div>

            {/* DUAL SECTION SELECTOR TABS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setAdminBannerSection('section1');
                  setActivePreviewIdx(0);
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl font-bold transition-all cursor-pointer ${
                  adminBannerSection === 'section1'
                    ? 'bg-white text-indigo-900 shadow-md border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className={`w-3 h-3 rounded-full ${adminBannerSection === 'section1' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  <div>
                    <div className="text-xs sm:text-sm font-black">Banner Section 1 (Top Carousel)</div>
                    <div className="text-[11px] text-slate-500 font-normal">Displays at the very top of Patient Overview</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    {banners.filter((b) => b.section === 'section1' && b.isActive).length} Active
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                    {banners.filter((b) => b.section === 'section1').length} Total
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminBannerSection('section2');
                  setActivePreviewIdx(0);
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl font-bold transition-all cursor-pointer ${
                  adminBannerSection === 'section2'
                    ? 'bg-white text-indigo-900 shadow-md border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className={`w-3 h-3 rounded-full ${adminBannerSection === 'section2' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  <div>
                    <div className="text-xs sm:text-sm font-black">Banner Section 2 (Bottom Carousel)</div>
                    <div className="text-[11px] text-slate-500 font-normal">Displays directly below Section 1</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    {banners.filter((b) => b.section === 'section2' && b.isActive).length} Active
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                    {banners.filter((b) => b.section === 'section2').length} Total
                  </span>
                </div>
              </button>
            </div>

            {/* LIVE PREVIEW CONTAINER (STRICT 4:1 ASPECT RATIO) */}
            {(() => {
              const secBanners = banners.filter((b) => b.section === adminBannerSection);
              const previewBanner = secBanners[activePreviewIdx] || secBanners[0];
              return (
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-600" />
                      <span>
                        Live 4:1 Preview: {adminBannerSection === 'section1' ? 'Banner Section 1 (Top)' : 'Banner Section 2 (Bottom)'}
                      </span>
                    </h4>
                    {secBanners.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">
                          Slide {Math.min(activePreviewIdx + 1, secBanners.length)} of {secBanners.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActivePreviewIdx((prev) => (prev - 1 + secBanners.length) % secBanners.length)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="Previous preview slide"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePreviewIdx((prev) => (prev + 1) % secBanners.length)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="Next preview slide"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {previewBanner ? (
                    <div
                      style={{ aspectRatio: '4 / 1', width: '100%' }}
                      className="relative w-full aspect-[4/1] overflow-hidden rounded-2xl border border-cyan-500/30 shadow-xl bg-[#001424]"
                    >
                      {previewBanner.imageUrl ? (
                        <div className="absolute inset-0 overflow-hidden">
                          <img
                            src={previewBanner.imageUrl}
                            alt={previewBanner.title}
                            style={{
                              transform: `scale(${(previewBanner.scale || 100) / 100})`,
                              transformOrigin: 'center center',
                            }}
                            className={`w-full h-full ${
                              previewBanner.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                            }`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#001424]/95 via-[#001424]/75 to-[#001424]/30 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00172d] to-[#002b49]" />
                      )}

                      <div className="relative z-10 h-full p-3 sm:p-5 md:p-6 lg:p-7 flex flex-col justify-between max-w-2xl">
                        <div className="space-y-0.5 sm:space-y-1.5">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-[8px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border bg-cyan-500/20 text-cyan-300 border-cyan-500/40 uppercase tracking-wider backdrop-blur-xs">
                              {previewBanner.tag || 'FEATURED'}
                            </span>
                            <span className={`text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              previewBanner.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                              {previewBanner.isActive ? 'Active on Dashboard' : 'Hidden (Inactive)'}
                            </span>
                          </div>
                          <h2 className="text-xs sm:text-lg md:text-xl font-black text-white tracking-tight drop-shadow-md line-clamp-1 sm:line-clamp-2">
                            {previewBanner.title}
                          </h2>
                          <p className="text-[10px] sm:text-xs text-slate-200 drop-shadow line-clamp-1 sm:line-clamp-2 max-w-xl leading-relaxed hidden xs:block">
                            {previewBanner.subtitle}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-[#001424] font-black text-[10px] sm:text-xs shadow-lg flex items-center gap-1">
                            <span>{previewBanner.ctaText || 'Learn More'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                          <span className="text-[10px] text-white/70 hidden sm:inline">
                            Target: {previewBanner.ctaLink}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                      No banners uploaded for {adminBannerSection === 'section1' ? 'Section 1' : 'Section 2'}. Click "+ Add to {adminBannerSection === 'section1' ? 'Section 1' : 'Section 2'}" below.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* BANNERS LIST TABLE FOR SELECTED SECTION */}
            {(() => {
              const secBanners = banners.filter((b) => b.section === adminBannerSection);
              return (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                        <span>
                          {adminBannerSection === 'section1' ? 'Banner Section 1 Registry' : 'Banner Section 2 Registry'} ({secBanners.length} banners)
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Independent order, status toggle, and editing for {adminBannerSection === 'section1' ? 'Section 1 (Top)' : 'Section 2 (Bottom)'}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenAddBanner(adminBannerSection)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Banner to {adminBannerSection === 'section1' ? 'Section 1' : 'Section 2'}</span>
                    </button>
                  </div>

                  {secBanners.length === 0 ? (
                    <div className="p-12 text-center">
                      <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-base font-bold text-slate-700">
                        No banners in {adminBannerSection === 'section1' ? 'Section 1' : 'Section 2'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Add a new banner or reset to system defaults.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetBanners}
                        className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                      >
                        Reset All Defaults
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                            <th className="py-3 px-4 text-center w-16">Order</th>
                            <th className="py-3 px-4 w-32">Thumbnail (4:1)</th>
                            <th className="py-3 px-4">Banner Details &amp; Target</th>
                            <th className="py-3 px-4 text-center">Aspect / Timing</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {secBanners.map((banner, idx) => (
                            <tr key={banner.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* 1. Independent Reorder */}
                              <td className="py-3.5 px-4 text-center align-middle">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                                    #{banner.order || idx + 1}
                                  </span>
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveBannerOrder(banner.id, 'up')}
                                      className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      title="Move Up"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === secBanners.length - 1}
                                      onClick={() => handleMoveBannerOrder(banner.id, 'down')}
                                      className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      title="Move Down"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* 2. 4:1 Thumbnail */}
                              <td className="py-3.5 px-4 align-middle">
                                <div
                                  style={{ aspectRatio: '4 / 1', width: '104px' }}
                                  className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 relative shadow-2xs shrink-0 aspect-[4/1]"
                                >
                                  {banner.imageUrl ? (
                                    <img
                                      src={banner.imageUrl}
                                      alt={banner.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                      <ImageIcon className="w-4 h-4" />
                                    </div>
                                  )}
                                  <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono font-bold px-1 rounded bg-black/70 text-white">
                                    4:1
                                  </span>
                                </div>
                              </td>

                              {/* 3. Details */}
                              <td className="py-3.5 px-4 align-middle">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      {banner.tag || (banner.section === 'section1' ? 'SECTION 1' : 'SECTION 2')}
                                    </span>
                                    <span className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">
                                      {banner.title}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 line-clamp-1">
                                    {banner.subtitle}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span>CTA: <strong>{banner.ctaText}</strong></span>
                                    <span>•</span>
                                    <span className="text-cyan-700 font-medium">Target: {banner.ctaLink}</span>
                                  </div>
                                </div>
                              </td>

                              {/* 4. Sizing & Interval */}
                              <td className="py-3.5 px-4 text-center align-middle">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                  4:1 Aspect Ratio
                                </span>
                                <div className="text-[10px] text-slate-400 font-mono mt-1">
                                  {banner.autoPlayInterval || 5}s cycle ({banner.scale || 100}%)
                                </div>
                              </td>

                              {/* 5. Status Toggle */}
                              <td className="py-3.5 px-4 text-center align-middle">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBannerActive(banner)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                                    banner.isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${banner.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                  <span>{banner.isActive ? 'Active' : 'Inactive'}</span>
                                </button>
                              </td>

                              {/* 6. Actions */}
                              <td className="py-3.5 px-4 text-right align-middle">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditBanner(banner)}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Edit Banner"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingBanner(banner)}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                    title="Delete Banner"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ============================================================== */}
            {/* DUAL GRID TABS MANAGEMENT SECTION (SECTION 1 & SECTION 2) */}
            {/* ============================================================== */}
            {(() => {
              const currentSectionTabs = gridTabs.filter((t) => t.section === adminGridTabSection);
              const section1Tabs = gridTabs.filter((t) => t.section === 'section1');
              const section2Tabs = gridTabs.filter((t) => t.section === 'section2');

              return (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-5 p-5 sm:p-6 mt-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          Dual Grid Tabs Management (2:2 Aspect Ratio)
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                          Overview Sections 1 &amp; 2
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Configure interactive grid tabs (5x5 desktop, 3x3 mobile) placed directly below Banner Section 1 and Banner Section 2.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetGridTabs}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Reset Defaults
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddGridTab(adminGridTabSection)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs shadow-md shadow-teal-900/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add Grid Tab</span>
                      </button>
                    </div>
                  </div>

                  {/* Section Switcher Tabs: Section 1 (Below Banner 1) vs Section 2 (Below Banner 2) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAdminGridTabSection('section1')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        adminGridTabSection === 'section1'
                          ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full ${adminGridTabSection === 'section1' ? 'bg-teal-600' : 'bg-slate-300'}`} />
                        <div>
                          <div className="text-xs font-bold text-slate-900">Grid Tabs Section 1</div>
                          <div className="text-[10px] text-slate-500">Positioned directly below 1st Banner</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-200 text-teal-900">
                        {section1Tabs.length} Tabs
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminGridTabSection('section2')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        adminGridTabSection === 'section2'
                          ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full ${adminGridTabSection === 'section2' ? 'bg-teal-600' : 'bg-slate-300'}`} />
                        <div>
                          <div className="text-xs font-bold text-slate-900">Grid Tabs Section 2</div>
                          <div className="text-[10px] text-slate-500">Positioned directly below 2nd Banner</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-200 text-teal-900">
                        {section2Tabs.length} Tabs
                      </span>
                    </button>
                  </div>

                  {/* Tabs Registry Table */}
                  {currentSectionTabs.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                      No grid tabs created for this section yet. Click "+ Add Grid Tab" to add one.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                            <th className="py-3 px-3.5">Image (2:2)</th>
                            <th className="py-3 px-3.5">Tab Title &amp; Badge</th>
                            <th className="py-3 px-3.5">Target Route / Service</th>
                            <th className="py-3 px-3.5 text-center">Status</th>
                            <th className="py-3 px-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {currentSectionTabs.map((tab) => (
                            <tr key={tab.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3.5 w-16">
                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative">
                                  {tab.imageUrl ? (
                                    <img
                                      src={tab.imageUrl}
                                      alt={tab.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src =
                                          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                      <ImageIcon className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3.5">
                                <div className="font-bold text-slate-800 text-xs sm:text-sm">
                                  {tab.title}
                                </div>
                                {tab.badge && (
                                  <span className="inline-block mt-0.5 text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-teal-100 text-teal-800">
                                    {tab.badge}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3.5">
                                <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                                  {tab.targetLink}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleGridTabActive(tab)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-colors cursor-pointer ${
                                    tab.isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : 'bg-slate-100 text-slate-500 border-slate-300'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${tab.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                  <span>{tab.isActive ? 'Active' : 'Inactive'}</span>
                                </button>
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditGridTab(tab)}
                                    className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Edit Grid Tab"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingGridTab(tab)}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                    title="Delete Grid Tab"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ADD / EDIT BANNER MODAL */}
            {isBannerModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <h4 className="text-base font-black text-slate-800">
                        {editingBannerId ? 'Edit Promotional Banner' : 'Add New Promotional Banner'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseBannerModal}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {adUploadError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{adUploadError}</span>
                    </div>
                  )}

                  {/* Section Assignment Controls */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Target Banner Section
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBannerForm((prev) => ({ ...prev, section: 'section1' }))}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          (bannerForm.section || adminBannerSection) === 'section1'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div>Banner Section 1</div>
                        <div className={`text-[10px] ${ (bannerForm.section || adminBannerSection) === 'section1' ? 'text-indigo-200' : 'text-slate-400'}`}>
                          Top Carousel
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBannerForm((prev) => ({ ...prev, section: 'section2' }))}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          (bannerForm.section || adminBannerSection) === 'section2'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div>Banner Section 2</div>
                        <div className={`text-[10px] ${ (bannerForm.section || adminBannerSection) === 'section2' ? 'text-indigo-200' : 'text-slate-400'}`}>
                          Bottom Carousel
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Image Upload & 4:1 Preview Box */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>1. Banner Graphic (Upload File or Enter Image URL)</span>
                      <span className="text-[11px] text-indigo-600 font-mono font-bold">Strict 4:1 Aspect Ratio</span>
                    </label>

                    {/* Strict 4:1 Preview Box */}
                    <div
                      style={{ aspectRatio: '4 / 1', width: '100%' }}
                      className="w-full aspect-[4/1] rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 relative"
                    >
                      {adFormImagePreview || bannerForm.imageUrl ? (
                        <img
                          src={adFormImagePreview || bannerForm.imageUrl}
                          alt="Banner Preview"
                          style={{
                            transform: `scale(${(bannerForm.scale || 100) / 100})`,
                            transformOrigin: 'center center',
                          }}
                          className={`w-full h-full ${
                            bannerForm.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                          <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                          <span>No Image Selected</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-2 left-3 text-[11px] font-bold text-white drop-shadow">
                        {bannerForm.title || 'Headline Preview'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* File Uploader Button */}
                      <div>
                        <input
                          ref={bannerFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileUpload}
                          className="hidden"
                          id="modal-banner-file-input"
                        />
                        <button
                          type="button"
                          onClick={() => bannerFileInputRef.current?.click()}
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
                        >
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Browse / Upload Image File</span>
                        </button>
                      </div>

                      {/* URL input */}
                      <div>
                        <input
                          type="text"
                          placeholder="Or paste image URL (https://...)"
                          value={bannerForm.imageUrl || ''}
                          onChange={(e) => {
                            setBannerForm((prev) => ({ ...prev, imageUrl: e.target.value }));
                            setAdFormImagePreview(e.target.value);
                          }}
                          className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Tag / Badge */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Campaign Tag / Pill</label>
                      <input
                        type="text"
                        value={bannerForm.tag || ''}
                        onChange={(e) => setBannerForm((prev) => ({ ...prev, tag: e.target.value }))}
                        placeholder="e.g. EXCLUSIVE OFFER, EMERGENCY DISPATCH"
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>

                    {/* Headline / Title */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Banner Headline (Title) *</label>
                      <input
                        type="text"
                        value={bannerForm.title || ''}
                        onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Comprehensive Full Body Checkup"
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Subtitle / Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Subtitle / Description</label>
                    <textarea
                      rows={2}
                      value={bannerForm.subtitle || ''}
                      onChange={(e) => setBannerForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Detail key healthcare perks, discount codes, or doorstep turnaround..."
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none"
                    />
                  </div>

                  {/* CTA Text & Destination Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">CTA Button Text</label>
                      <input
                        type="text"
                        value={bannerForm.ctaText || ''}
                        onChange={(e) => setBannerForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                        placeholder="e.g. Book Checkup @ 45% OFF"
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Destination Service (Booking Modal)</label>
                      <select
                        value={bannerForm.ctaLink || 'Home diagnostics & lab tests'}
                        onChange={(e) => setBannerForm((prev) => ({ ...prev, ctaLink: e.target.value }))}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      >
                        <option value="Home diagnostics & lab tests">Home diagnostics &amp; lab tests</option>
                        <option value="Doctor Home Consultations">Doctor Home Consultations</option>
                        <option value="Ambulance & medical transport">Ambulance &amp; Emergency Transport</option>
                        <option value="Home nursing & patient care">Home nursing &amp; patient care</option>
                        <option value="Pharmacy & doorstep medicines">Pharmacy &amp; doorstep medicines</option>
                        <option value="Hospital bed & surgery coordination">Hospital bed &amp; surgery coordination</option>
                        <option value="vital-lens">Vital Lens™ AI Facial Scan</option>
                      </select>
                    </div>
                  </div>

                  {/* Sizing & Aspect Ratio Controls */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      <span>4:1 Aspect Ratio &amp; Carousel Timing Controls</span>
                    </div>

                    {/* Ratio notice */}
                    <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center justify-between">
                      <span className="font-bold">Aspect Ratio: 4:1 (Strictly Enforced)</span>
                      <span className="text-[11px] font-mono text-teal-600">aspect-ratio: 4 / 1</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Image Fit */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Image Fit</label>
                        <select
                          value={bannerForm.imageFit || 'cover'}
                          onChange={(e) => setBannerForm((prev) => ({ ...prev, imageFit: e.target.value as any }))}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        >
                          <option value="cover">Cover (Fill &amp; Fit 4:1 Container)</option>
                          <option value="contain">Contain (Show Full Image)</option>
                        </select>
                      </div>

                      {/* Auto-play Interval */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Carousel Cycle Duration</label>
                        <select
                          value={bannerForm.autoPlayInterval || 5}
                          onChange={(e) => setBannerForm((prev) => ({ ...prev, autoPlayInterval: Number(e.target.value) }))}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        >
                          <option value={3}>3 seconds (Fast)</option>
                          <option value={4}>4 seconds</option>
                          <option value={5}>5 seconds (Standard)</option>
                          <option value={6}>6 seconds (Relaxed)</option>
                        </select>
                      </div>
                    </div>

                    {/* Scale Zoom Slider & Active Toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>Image Zoom Scale</span>
                          <span className="font-mono text-indigo-600">{bannerForm.scale || 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="140"
                          step="5"
                          value={bannerForm.scale || 100}
                          onChange={(e) => setBannerForm((prev) => ({ ...prev, scale: Number(e.target.value) }))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Active Status</span>
                          <span className="text-[10px] text-slate-400">Show in live slider</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBannerForm((prev) => ({ ...prev, isActive: prev.isActive !== undefined ? !prev.isActive : false }))}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            bannerForm.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              bannerForm.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleCloseBannerModal}
                      className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBannerModal}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{editingBannerId ? 'Save Banner Changes' : 'Add Banner to Carousel'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DELETE BANNER CONFIRMATION MODAL */}
            {deletingBanner && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-red-200">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="text-base font-black text-slate-800">
                      Delete Promotional Banner?
                    </h4>
                    <p className="text-xs text-slate-500">
                      Are you sure you want to permanently delete <strong>"{deletingBanner.title}"</strong>? This will immediately remove it from the patient dashboard carousel.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeletingBanner(null)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteBanner}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      Yes, Delete Permanently
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ADD / EDIT GRID TAB MODAL */}
            {isGridTabModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <h4 className="text-base font-black text-slate-800">
                        {editingGridTabId ? 'Edit Grid Tab' : 'Add New Grid Tab (2:2 Ratio)'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsGridTabModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveGridTab} className="space-y-4 text-left">
                    {/* Section Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Grid Tab Section</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setGridTabForm((prev) => ({ ...prev, section: 'section1' }))}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                            (gridTabForm.section || adminGridTabSection) === 'section1'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Section 1 (Below 1st Banner)
                        </button>
                        <button
                          type="button"
                          onClick={() => setGridTabForm((prev) => ({ ...prev, section: 'section2' }))}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                            (gridTabForm.section || adminGridTabSection) === 'section2'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Section 2 (Below 2nd Banner)
                        </button>
                      </div>
                    </div>

                    {/* Tab Title */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Tab Title *</label>
                      <input
                        type="text"
                        required
                        value={gridTabForm.title || ''}
                        onChange={(e) => setGridTabForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Doctor Home Visits"
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                      />
                    </div>

                    {/* Target Route / Destination */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Target Route / Service Link *</label>
                      <select
                        value={gridTabForm.targetLink || 'Doctor home visits'}
                        onChange={(e) => setGridTabForm((prev) => ({ ...prev, targetLink: e.target.value }))}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                      >
                        <option value="Doctor home visits">Doctor home visits (Booking)</option>
                        <option value="Home diagnostics & lab tests">Home diagnostics &amp; lab tests (Booking)</option>
                        <option value="vital-lens">Vital Lens™ AI Camera Vitals</option>
                        <option value="Specialized nursing care at home">Specialized nursing care at home</option>
                        <option value="Physiotherapy & rehabilitation">Physiotherapy &amp; rehabilitation</option>
                        <option value="Ambulance & medical transport">Ambulance &amp; medical transport</option>
                        <option value="Medical equipment rental & sale">Medical equipment rental &amp; sale</option>
                        <option value="Elderly geriatric home care">Elderly geriatric home care</option>
                        <option value="Home vaccination services">Home vaccination services</option>
                        <option value="quick-booking">Quick Booking Screen</option>
                        <option value="records">My Records Vault</option>
                        <option value="history">Service &amp; Booking History</option>
                        <option value="invoices">Invoices &amp; Orders</option>
                        <option value="rewards">Referral &amp; Care Wallet</option>
                        <option value="help">Help &amp; Support</option>
                      </select>
                      <input
                        type="text"
                        value={gridTabForm.targetLink || ''}
                        onChange={(e) => setGridTabForm((prev) => ({ ...prev, targetLink: e.target.value }))}
                        placeholder="Or type custom route, tab ID, or URL (https://...)"
                        className="w-full text-[11px] font-mono px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 mt-1"
                      />
                    </div>

                    {/* Optional Badge */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Badge Text (Optional)</label>
                      <input
                        type="text"
                        value={gridTabForm.badge || ''}
                        onChange={(e) => setGridTabForm((prev) => ({ ...prev, badge: e.target.value }))}
                        placeholder="e.g. Verified, 45% Off, AI Camera, 24/7"
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                      />
                    </div>

                    {/* Standard Image Uploader (2:2 Ratio) */}
                    <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-teal-600" />
                          <span>Custom Tab Banner Image (2:2 Ratio)</span>
                        </label>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                          Square 2:2 Ratio
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* 2:2 Preview */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 bg-white shrink-0 relative flex items-center justify-center">
                          {gridTabImagePreview || gridTabForm.imageUrl ? (
                            <img
                              src={gridTabImagePreview || gridTabForm.imageUrl}
                              alt="Tab Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-1 text-slate-400">
                              <ImageIcon className="w-5 h-5 mx-auto opacity-50" />
                              <span className="text-[9px] block font-semibold mt-0.5">2:2 Ratio</span>
                            </div>
                          )}
                        </div>

                        {/* File selector input */}
                        <div className="flex-1 space-y-1.5">
                          <input
                            ref={gridTabFileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={handleGridTabFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => gridTabFileInputRef.current?.click()}
                            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-teal-600" />
                            <span>Upload Image (Max 4MB)</span>
                          </button>
                          <input
                            type="url"
                            value={gridTabForm.imageUrl || ''}
                            onChange={(e) => {
                              setGridTabForm((prev) => ({ ...prev, imageUrl: e.target.value }));
                              setGridTabImagePreview(e.target.value);
                            }}
                            placeholder="Or paste external image URL..."
                            className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
                          />
                        </div>
                      </div>

                      {gridTabUploadError && (
                        <p className="text-[11px] text-red-600 font-semibold">{gridTabUploadError}</p>
                      )}
                    </div>

                    {/* Active Status Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Tab Active Status</span>
                        <span className="text-[10px] text-slate-500">Show tab in Overview grid section</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGridTabForm((prev) => ({ ...prev, isActive: !(prev.isActive ?? true) }))}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          (gridTabForm.isActive ?? true) ? 'bg-teal-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                            (gridTabForm.isActive ?? true) ? 'left-6' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsGridTabModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{editingGridTabId ? 'Save Changes' : 'Add Grid Tab'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* DELETE GRID TAB CONFIRMATION MODAL */}
            {deletingGridTab && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-red-200 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-800">Delete Grid Tab?</h4>
                    <p className="text-xs text-slate-500">
                      Are you sure you want to permanently delete <strong>"{deletingGridTab.title}"</strong>? It will immediately disappear from the patient Overview grid.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeletingGridTab(null)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteGridTabConfirm}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      Yes, Delete Tab
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : alignmentTab === 'VitalScans' ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Table Header Summary */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-purple-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-purple-950 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-purple-600" />
                  <span>VitalLens Optical Biometrics Registry</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live audit trail of non-invasive facial PPG vital scans across registered patients and guest sessions.
                </p>
              </div>

              {/* Quick Summary Badges */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                  {vitalScans.filter((s) => s.mode === 'Logged-in').length} Logged-in
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {vitalScans.filter((s) => s.mode === 'Guest').length} Guest Scans
                </span>
              </div>
            </div>

            {/* Table Content or Empty State */}
            {filteredVitalScans.length === 0 ? (
              <div className="p-12 text-center">
                <HeartPulse className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">No vital scan records found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No scan logs match the current filter selection ({vitalModeFilter} mode, {vitalDateFilter} date). Try resetting filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVitalDateFilter('All');
                    setVitalModeFilter('All');
                    setVitalSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition-colors cursor-pointer"
                >
                  Reset Vital Scan Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Scan Reference &amp; Timestamp</th>
                      <th className="py-3 px-4">User / Guest ID</th>
                      <th className="py-3 px-4">Patient Profile</th>
                      <th className="py-3 px-4">Session Mode</th>
                      <th className="py-3 px-4">Bio-Markers (PPG Results)</th>
                      <th className="py-3 px-4 text-right">Scan Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredVitalScans.map((scan) => {
                      const isGuest = scan.mode === 'Guest';

                      const statusColor =
                        scan.status.toLowerCase().includes('optimal') || scan.status.toLowerCase().includes('normal')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : scan.status.toLowerCase().includes('elevated') || scan.status.toLowerCase().includes('mild')
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200';

                      const formattedDate =
                        scan.date && scan.time
                          ? `${scan.date} at ${scan.time}`
                          : new Date(scan.scanTimestamp || Date.now()).toLocaleDateString('en-IN');

                      return (
                        <tr key={scan.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Reference & Timestamp */}
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              {scan.id}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">
                              {formattedDate}
                            </span>
                          </td>

                          {/* 2. User / Guest ID */}
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                              {scan.userId}
                            </span>
                          </td>

                          {/* 3. Patient Profile */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-bold text-slate-800 text-xs">
                              {scan.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {scan.mobileNumber}
                            </div>
                            {(scan.age || scan.gender) && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {[
                                  scan.age ? `${scan.age} yrs` : null,
                                  scan.gender,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </div>
                            )}
                          </td>

                          {/* 4. Session Mode */}
                          <td className="py-3.5 px-4 align-top">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${
                                isGuest
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isGuest ? 'bg-purple-500' : 'bg-emerald-500'
                                }`}
                              />
                              <span>{scan.mode}</span>
                            </span>
                          </td>

                          {/* 5. Bio-Markers Summary */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[11px] font-bold" title="Heart Rate">
                                ❤️ {scan.heartRate} bpm
                              </span>
                              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-mono text-[11px] font-bold" title="Blood Oxygen">
                                💨 SpO2 {scan.oxygenSaturation}%
                              </span>
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[11px]" title="Heart Rate Variability">
                                HRV {scan.sdnn} ms
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono text-[11px]" title="Stress Index">
                                {scan.stressLevel}
                              </span>
                              {scan.bloodPressureSystolic && scan.bloodPressureDiastolic && (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[11px]" title="Estimated BP">
                                  BP {scan.bloodPressureSystolic}/{scan.bloodPressureDiastolic}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Scan Status */}
                          <td className="py-3.5 px-4 align-top text-right">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColor}`}
                            >
                              {scan.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : alignmentTab === 'GuestBookings' ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Table Header Summary */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-cyan-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-cyan-950 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-cyan-600" />
                  <span>Hero Page Guest Service Bookings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct healthcare orders placed by non-logged in visitors through the public hero service cards.
                </p>
              </div>

              {/* Status Breakdown Badges */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 font-bold border border-cyan-200">
                  {guestBookings.filter((b) => b.status === 'Confirmed').length} Confirmed
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  {guestBookings.filter((b) => b.status === 'Clinician Dispatched').length} Dispatched
                </span>
              </div>
            </div>

            {/* Table Content or Empty State */}
            {filteredGuestBookings.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">No guest bookings found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No guest bookings match the current filter selection ({guestServiceFilter} service, {guestStatusFilter} status).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setGuestDateFilter('All');
                    setGuestServiceFilter('All');
                    setGuestStatusFilter('All');
                    setGuestSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-cyan-700 text-white text-xs font-bold hover:bg-cyan-800 transition-colors cursor-pointer"
                >
                  Reset Guest Booking Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Booking Ref &amp; Date</th>
                      <th className="py-3 px-4">Guest Patient</th>
                      <th className="py-3 px-4">Service &amp; Location</th>
                      <th className="py-3 px-4">Slot &amp; Symptoms</th>
                      <th className="py-3 px-4 text-right">Status &amp; Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredGuestBookings.map((booking) => {
                      const formattedTime = new Date(
                        booking.bookedAt || booking.preferredDate || Date.now()
                      ).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const statusBadge =
                        booking.status === 'Confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : booking.status === 'Clinician Dispatched'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : booking.status === 'Sample Collected'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200';

                      return (
                        <tr key={booking.referenceId} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Reference & Date */}
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-mono font-bold text-cyan-900 block text-xs">
                              {booking.referenceId}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">
                              {formattedTime}
                            </span>
                          </td>

                          {/* 2. Guest Patient */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-bold text-slate-800 text-xs">
                              {booking.patientName}
                            </div>
                            <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                              <a href={`tel:${booking.phone}`} className="hover:text-cyan-700 hover:underline">
                                {booking.phone}
                              </a>
                            </div>
                            {(booking.age || booking.gender) && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {[
                                  booking.age ? `${booking.age} yrs` : null,
                                  booking.gender,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </div>
                            )}
                          </td>

                          {/* 3. Service & Location */}
                          <td className="py-3.5 px-4 align-top">
                            <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold text-[11px] inline-block mb-1">
                              {booking.serviceName}
                            </span>
                            <div className="text-xs text-slate-700 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{booking.address || `${booking.city}, ${booking.state}`}</span>
                            </div>
                          </td>

                          {/* 4. Slot & Symptoms */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{booking.preferredDate} · {booking.preferredTimeSlot}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-xs line-clamp-2">
                              {booking.symptoms || 'Standard appointment requested'}
                            </p>
                          </td>

                          {/* 5. Status & Actions */}
                          <td className="py-3.5 px-4 align-top text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${statusBadge}`}>
                                {booking.status}
                              </span>

                              {/* Status update select */}
                              <select
                                value={booking.status}
                                onChange={(e) =>
                                  handleUpdateGuestStatus(
                                    booking.referenceId,
                                    e.target.value as ConfirmedBooking['status']
                                  )
                                }
                                className="text-[10.5px] font-semibold px-2 py-1 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-700 shadow-2xs cursor-pointer"
                              >
                                <option value="Confirmed">Mark Confirmed</option>
                                <option value="Clinician Dispatched">Mark Dispatched</option>
                                <option value="Sample Collected">Mark Collected</option>
                                <option value="Report Ready">Mark Report Ready</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : alignmentTab === 'Enquiries' ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Table Header Summary */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#002b49] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <span>Centralized Enquiries &amp; Collaboration Pipeline</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct intake from Corporate B2B forms, Healthcare Service Inquiries, and Partner Collaborations.
                </p>
              </div>

              {/* Type Filter Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">Type:</span>
                <select
                  value={enquiryTypeFilter}
                  onChange={(e) => setEnquiryTypeFilter(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 shadow-2xs"
                >
                  <option value="All">All Inquiry Types</option>
                  <option value="Corporate Enquiry">Corporate Enquiry</option>
                  <option value="Healthcare Service Inquiry">Healthcare Service Inquiry</option>
                  <option value="Corporate & Institutional Collaboration">Corporate Collaboration</option>
                  <option value="Talent & Team Application">Talent &amp; Teams</option>
                </select>
              </div>
            </div>

            {/* Table Content or Empty State */}
            {filteredEnquiries.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">No enquiries found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No enquiries match the current filter selection ({enquiryStatusFilter} status). Try resetting filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEnquirySearchQuery('');
                    setEnquiryStatusFilter('All');
                    setEnquiryTypeFilter('All');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      <th className="py-3 px-4">Date / Time</th>
                      <th className="py-3 px-4">Company / User Name</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 min-w-[260px]">Requirements</th>
                      <th className="py-3 px-4 text-right">Status Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEnquiries.map((enq) => {
                      const isPending = enq.status === 'Pending';
                      const isReviewed = enq.status === 'Reviewed';
                      const isContacted = enq.status === 'Contacted';
                      const isResolved = enq.status === 'Resolved';

                      return (
                        <tr
                          key={enq.id}
                          className="hover:bg-teal-50/20 transition-colors group"
                        >
                          {/* 1. Date */}
                          <td className="py-4 px-4 align-top whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {new Date(enq.submittedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {new Date(enq.submittedAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </div>
                            <span className="inline-block mt-1 font-mono text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 font-bold">
                              {enq.id}
                            </span>
                          </td>

                          {/* 2. Company / User Name */}
                          <td className="py-4 px-4 align-top">
                            {enq.companyName ? (
                              <div className="font-bold text-sm text-[#002b49] flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                                <span>{enq.companyName}</span>
                              </div>
                            ) : null}
                            <div className="text-xs text-slate-800 font-semibold flex items-center gap-1 mt-0.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{enq.name}</span>
                              {enq.designation && (
                                <span className="text-[11px] text-slate-500 font-normal">
                                  ({enq.designation})
                                </span>
                              )}
                            </div>
                            {enq.employeeCount && (
                              <div className="mt-1">
                                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  Workforce: {enq.employeeCount}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* 3. Contact Info */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <a
                                  href={`mailto:${enq.email}`}
                                  className="text-teal-700 hover:text-teal-900 hover:underline break-all"
                                >
                                  {enq.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <a
                                  href={`tel:${enq.phone}`}
                                  className="font-bold text-slate-800 hover:text-teal-700 font-mono"
                                >
                                  {enq.phone}
                                </a>
                              </div>
                              {enq.location && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[180px]">{enq.location}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 4. Type */}
                          <td className="py-4 px-4 align-top whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${
                                enq.type === 'Corporate Enquiry'
                                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                                  : enq.type === 'Healthcare Service Inquiry'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : enq.type === 'Corporate & Institutional Collaboration'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : 'bg-purple-50 text-purple-800 border-purple-200'
                              }`}
                            >
                              {enq.type}
                            </span>
                            {enq.categoryOrService && (
                              <div className="text-[10px] text-slate-500 font-medium mt-1">
                                {enq.categoryOrService}
                              </div>
                            )}
                          </td>

                          {/* 5. Requirements */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-1.5 max-w-sm">
                              {enq.selectedOfferings && enq.selectedOfferings.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {enq.selectedOfferings.map((offering, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[9.5px] font-semibold bg-teal-50 text-teal-900 border border-teal-200/80 px-1.5 py-0.2 rounded"
                                    >
                                      {offering}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                                {enq.requirements}
                              </p>

                              {enq.adminNotes && (
                                <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                  <strong>Admin Note:</strong> {enq.adminNotes}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setInspectingEnquiry(enq);
                                  setAdminNoteDraft(enq.adminNotes || '');
                                }}
                                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect Full Payload &amp; Notes</span>
                              </button>
                            </div>
                          </td>

                          {/* 6. Status Action */}
                          <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                            <div className="flex flex-col items-end gap-1.5">
                              {/* Status Badge */}
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : isReviewed
                                    ? 'bg-sky-100 text-sky-900 border-sky-300'
                                    : isContacted
                                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                }`}
                              >
                                {isPending && <Clock className="w-3 h-3 text-amber-700" />}
                                {isReviewed && <Eye className="w-3 h-3 text-sky-700" />}
                                {isContacted && <PhoneCall className="w-3 h-3 text-blue-700" />}
                                {isResolved && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                                <span>{enq.status}</span>
                              </span>

                              {/* Action Buttons: Mark as Reviewed, Contacted, Resolved */}
                              <div className="flex items-center gap-1 pt-1">
                                {!isReviewed && !isResolved && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetEnquiryStatus(enq.id, 'Reviewed')}
                                    className="px-2 py-1 text-[10.5px] font-bold rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                                    title="Mark as Reviewed"
                                  >
                                    Reviewed
                                  </button>
                                )}

                                {!isContacted && !isResolved && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetEnquiryStatus(enq.id, 'Contacted')}
                                    className="px-2 py-1 text-[10.5px] font-bold rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                                    title="Mark as Contacted"
                                  >
                                    Contacted
                                  </button>
                                )}

                                {!isResolved && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetEnquiryStatus(enq.id, 'Resolved')}
                                    className="px-2 py-1 text-[10.5px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                                    title="Mark as Resolved"
                                  >
                                    Resolve
                                  </button>
                                )}

                                {isResolved && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetEnquiryStatus(enq.id, 'Pending')}
                                    className="px-2 py-1 text-[10.5px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                    title="Reopen Enquiry"
                                  >
                                    Reopen
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
          {filteredPartners.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-700">No partner accounts found for this view</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No accounts match the current filter selection ({alignmentTab}). Try switching tabs or clearing your search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAlignmentTab('All');
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredPartners.map((partner) => {
              const isPending = partner.status === 'Pending';
              const isSuspended = isPartnerSuspended(partner);
              const isLive = partner.status === 'Live' && !isSuspended;
              const daysInactive = calculateDaysInactive(partner);

              // Check High-Risk Multi-Registration Warning
              const riskAnalysis = checkIsHighRiskMultiRegistration(partner.phone, partners);
              const isHighRisk = riskAnalysis.isHighRisk;

              return (
                <div
                  key={partner.id}
                  className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border transition-all shadow-xs hover:shadow-md ${
                    partner.isRestrictedByAdmin
                      ? 'border-red-400 ring-2 ring-red-400/20 bg-red-50/20'
                      : isHighRisk
                      ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/10'
                      : isSuspended
                      ? 'border-rose-300 bg-rose-50/15'
                      : isLive
                      ? 'border-emerald-300 ring-1 ring-emerald-400/20'
                      : 'border-amber-200 bg-amber-50/10'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Left: Partner Profile, Badges & Credentials */}
                    <div className="flex-1 space-y-2.5">
                      {/* Status Badges Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Primary Status Badge */}
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            <span>PENDING APPROVAL</span>
                          </span>
                        ) : isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-950 text-xs font-extrabold uppercase tracking-wider">
                            <Ban className="w-3.5 h-3.5 text-rose-600" />
                            <span>SUSPENDED DUE TO INACTIVITY</span>
                          </span>
                        ) : isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-extrabold uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            <span>LIVE ON NETWORK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-extrabold uppercase tracking-wider">
                            <span>{partner.status}</span>
                          </span>
                        )}

                        {/* Category Pill */}
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                          {partner.category}
                        </span>

                        {/* ID */}
                        <span className="text-xs font-mono text-slate-400">
                          ID: {partner.id}
                        </span>

                        {/* Inactivity Counter Badge */}
                        {daysInactive > 0 && (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-md font-mono ${
                              daysInactive > INACTIVITY_THRESHOLD_DAYS
                                ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Last active: {daysInactive}d ago {daysInactive > INACTIVITY_THRESHOLD_DAYS ? '(>90d Rule)' : ''}
                          </span>
                        )}

                        {/* Admin Restriction Flag */}
                        {partner.isRestrictedByAdmin && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-red-600" />
                            <span>LOCKED BY ADMIN</span>
                          </span>
                        )}

                        {/* Whitelisted Badge */}
                        {partner.whitelistedByAdmin && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3 text-teal-600" />
                            <span>Whitelisted Group</span>
                          </span>
                        )}
                      </div>

                      {/* ------------------------------------------------------------- */}
                      {/* HIGH-RISK MULTI-REGISTRATION WARNING BADGE (Phase 3 Requirement 2) */}
                      {/* ------------------------------------------------------------- */}
                      {isHighRisk && (
                        <div className="p-2.5 bg-gradient-to-r from-amber-500/15 via-red-500/10 to-amber-500/15 border-2 border-amber-500/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-500 text-amber-950 flex items-center justify-center font-black shrink-0">
                              <AlertTriangle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-amber-950 block">
                                ⚠️ HIGH-RISK WARNING: Multi-Registration Flag (4+ Services)
                              </span>
                              <span className="text-[11px] text-amber-900 font-medium block">
                                Phone <strong className="font-mono">{partner.phone}</strong> is registered across{' '}
                                <strong>{riskAnalysis.categoryCount} distinct categories</strong>: {riskAnalysis.categories.join(', ')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setInspectingPhone(partner.phone)}
                              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              Inspect All 4+ Services
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleRestriction(partner)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                partner.isRestrictedByAdmin
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                                  : 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                              }`}
                            >
                              {partner.isRestrictedByAdmin ? 'Unlock Account' : 'Restrict Fraud / Misuse'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ------------------------------------------------------------- */}
                      {/* INACTIVE SUSPENDED & REVOCATION REQUEST CALLOUT (Phase 3 Requirement 1) */}
                      {/* ------------------------------------------------------------- */}
                      {isSuspended && partner.revocationRequested && (
                        <div className="p-3 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-teal-500/10 border-2 border-rose-400 rounded-xl space-y-2 animate-in fade-in">
                          <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                              <span className="text-xs font-black text-rose-950 uppercase tracking-tight">
                                Revocation / Re-activation Request Received
                              </span>
                              {partner.revocationRequestedAt && (
                                <span className="text-[10px] font-mono text-slate-500">
                                  Submitted: {new Date(partner.revocationRequestedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                              Routes to support@nhealth.in &amp; Admin Review
                            </span>
                          </div>

                          {partner.revocationReason && (
                            <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-rose-200">
                              <span className="text-[11px] font-bold text-slate-500 block">Partner's Reactivation Note:</span>
                              <p className="italic font-medium text-[#002b49]">"{partner.revocationReason}"</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleApproveRevocation(partner)}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve &amp; Re-activate Account</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectRevocation(partner)}
                              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                            >
                              Reject Request
                            </button>
                            <a
                              href={`mailto:support@nhealth.in?subject=Revocation%20Request%20Follow-up%20-%20${encodeURIComponent(partner.entityName)}&body=Partner%20ID:%20${partner.id}%0APhone:%20${partner.phone}`}
                              className="text-xs text-[#008080] font-bold hover:underline inline-flex items-center gap-1 ml-auto"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Email support@nhealth.in</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Partner Details */}
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-[#002b49] leading-tight flex items-center gap-2">
                          <span>{partner.entityName}</span>
                          {partner.category === 'Doctor' && partner.consultationFee && (
                            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              ₹{partner.consultationFee} OPD
                            </span>
                          )}
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-[#008080] mt-0.5">
                          {partner.specialty}
                        </p>
                      </div>

                      {/* Details Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-slate-400 block text-[11px]">License / Reg No:</span>
                          <span className="font-mono font-bold text-slate-800">{partner.registrationNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Contact Person:</span>
                          <span className="font-medium text-slate-800">{partner.contactPerson} ({partner.phone})</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Location:</span>
                          <span className="font-medium text-slate-800">{partner.city}, {partner.state}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Verification Document:</span>
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(partner)}
                            className="text-[#008080] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>{partner.documentName || 'License.pdf'}</span>
                          </button>
                        </div>
                      </div>

                      {partner.loginIdOrEmail && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Partner Login ID: <strong className="text-teal-800">{partner.loginIdOrEmail}</strong>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions & Controls */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2.5 w-full lg:w-auto shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => handleApprove(partner)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept / Approve &amp; Go Live</span>
                        </button>
                      ) : isSuspended ? (
                        <div className="flex flex-col items-stretch lg:items-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveRevocation(partner)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Re-activate Account</span>
                          </button>
                          <span className="text-[10px] text-rose-700 font-medium">
                            Suspended (Rule: &gt;90d Inactive)
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2">
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Live in Doctor Search &amp; Grid</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSuspendAccount(partner)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer border border-rose-200"
                              title="Flag Account as Suspended"
                            >
                              Suspend
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePutOnHold(partner)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                              title="Revert to Pending review"
                            >
                              Put on Hold
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </main>

      {/* ------------------------------------------------------------- */}
      {/* MULTI-REGISTRATION INSPECTION MODAL (Phase 3 Requirement 2) */}
      {/* ------------------------------------------------------------- */}
      {inspectingPhone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setInspectingPhone(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#002b49]">
                    Multi-Registration Fraud Audit Desk
                  </h4>
                  <p className="text-xs text-slate-500">
                    Phone: <strong className="font-mono text-slate-800">{inspectingPhone}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingPhone(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: List of all partner accounts under this phone number */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>High-Risk Condition Triggered:</strong> A single phone number is registered across 4 or more different healthcare service verticals. Review licensing and legal establishment to prevent multi-account misuse.
              </div>

              {partners
                .filter(
                  (p) =>
                    p.phone.replace(/\D/g, '').slice(-10) ===
                    inspectingPhone.replace(/\D/g, '').slice(-10)
                )
                .map((acc, idx) => (
                  <div
                    key={acc.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{acc.entityName}</span>
                        <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold">
                          {acc.category}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {acc.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        License: <span className="font-mono text-slate-700">{acc.registrationNumber}</span> • Contact: {acc.contactPerson} • {acc.city}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          acc.isRestrictedByAdmin
                            ? 'bg-red-200 text-red-900'
                            : acc.status === 'Live'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {acc.isRestrictedByAdmin ? 'Restricted' : acc.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleRestriction(acc)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        {acc.isRestrictedByAdmin ? 'Unlock' : 'Restrict'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal Footer Bulk Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                Admin controls to whitelist legitimate hospital networks or freeze multi-account misuse.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleWhitelistPhoneGroup(inspectingPhone)}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Verify &amp; Whitelist Group</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkRestrictPhoneGroup(inspectingPhone)}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Freeze All Accounts</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LICENSE DOCUMENT PREVIEW MODAL */}
      {/* ------------------------------------------------------------- */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#008080]" />
                <h4 className="text-base font-bold text-[#002b49]">
                  Verification Document Preview
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Partner Entity:</span>
                  <strong className="text-sm text-[#002b49]">{previewDoc.entityName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Official Registration / License:</span>
                  <strong className="font-mono text-emerald-700">{previewDoc.registrationNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Attached Document File:</span>
                  <span className="font-mono text-xs">{previewDoc.documentName || 'Medical_License.pdf'} ({previewDoc.documentSize || '2.4 MB'})</span>
                </div>
                <div className="text-[11px] text-teal-800 font-semibold bg-teal-50 p-2 rounded-lg border border-teal-200">
                  ✓ Digital Certificate &amp; License Authority Authenticated via State Medical Council / Pharmacy Council Database.
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 rounded-xl bg-[#002b49] text-white text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* INSPECT ENQUIRY FULL PAYLOAD & ADMIN NOTES MODAL */}
      {/* ------------------------------------------------------------- */}
      {inspectingEnquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setInspectingEnquiry(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-teal-500/30 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base sm:text-lg font-bold text-[#002b49]">
                      Enquiry Submission Record
                    </h4>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      {inspectingEnquiry.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submitted on{' '}
                    {new Date(inspectingEnquiry.submittedAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingEnquiry(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Current Status:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    inspectingEnquiry.status === 'Pending'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : inspectingEnquiry.status === 'Reviewed'
                      ? 'bg-sky-100 text-sky-900 border-sky-300'
                      : inspectingEnquiry.status === 'Contacted'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  {inspectingEnquiry.status}
                </span>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetEnquiryStatus(inspectingEnquiry.id, 'Reviewed')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 transition-colors cursor-pointer"
                >
                  Mark Reviewed
                </button>
                <button
                  type="button"
                  onClick={() => handleSetEnquiryStatus(inspectingEnquiry.id, 'Contacted')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-colors cursor-pointer"
                >
                  Mark Contacted
                </button>
                <button
                  type="button"
                  onClick={() => handleSetEnquiryStatus(inspectingEnquiry.id, 'Resolved')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            {/* Structured Fields Grid */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Contact Person
                  </span>
                  <div className="font-bold text-slate-800 text-sm">{inspectingEnquiry.name}</div>
                  {inspectingEnquiry.designation && (
                    <div className="text-slate-500">{inspectingEnquiry.designation}</div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Company / Organization
                  </span>
                  <div className="font-bold text-[#002b49] text-sm">
                    {inspectingEnquiry.companyName || 'Individual Healthcare Consumer'}
                  </div>
                  {inspectingEnquiry.employeeCount && (
                    <div className="text-slate-500">Workforce: {inspectingEnquiry.employeeCount}</div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Direct Contact Channels
                  </span>
                  <div className="font-semibold text-slate-800">
                    Phone:{' '}
                    <a
                      href={`tel:${inspectingEnquiry.phone}`}
                      className="text-teal-700 hover:underline font-mono"
                    >
                      {inspectingEnquiry.phone}
                    </a>
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Email:{' '}
                    <a
                      href={`mailto:${inspectingEnquiry.email}`}
                      className="text-teal-700 hover:underline"
                    >
                      {inspectingEnquiry.email}
                    </a>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Location &amp; Type
                  </span>
                  <div className="font-semibold text-slate-800">
                    Type: <span className="text-teal-800">{inspectingEnquiry.type}</span>
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Location: {inspectingEnquiry.location || 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Selected Offerings (if any) */}
              {inspectingEnquiry.selectedOfferings &&
                inspectingEnquiry.selectedOfferings.length > 0 && (
                  <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block mb-2">
                      Selected Offerings &amp; Service Packages
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectingEnquiry.selectedOfferings.map((pkg, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md bg-white border border-teal-200 text-teal-900 font-semibold text-xs"
                        >
                          • {pkg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Requirements Description */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Full Requirements &amp; Comments
                </span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
                  {inspectingEnquiry.requirements}
                </p>
              </div>

              {/* Internal Admin Notes */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                  Internal Administrative Follow-up Notes
                </span>
                <textarea
                  rows={2}
                  value={adminNoteDraft}
                  onChange={(e) => setAdminNoteDraft(e.target.value)}
                  placeholder="Record follow-up details, phone call outcome, or account assignment notes here..."
                  className="w-full p-2.5 rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs text-slate-800"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      handleSetEnquiryStatus(
                        inspectingEnquiry.id,
                        inspectingEnquiry.status,
                        adminNoteDraft
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    Save Internal Note
                  </button>
                </div>
              </div>

              {/* Raw Payload Collapsible / Inspection */}
              {inspectingEnquiry.rawPayload && Object.keys(inspectingEnquiry.rawPayload).length > 0 && (
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Raw Submission Payload (All Submitted Form Fields)
                  </span>
                  <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto p-2 bg-white rounded border border-slate-200 max-h-32">
                    {JSON.stringify(inspectingEnquiry.rawPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Centralized in Nhealth Admin Pipeline
              </span>
              <button
                type="button"
                onClick={() => setInspectingEnquiry(null)}
                className="px-5 py-2 rounded-xl bg-[#002b49] hover:bg-[#001d31] text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        &copy; 2026 Nhealth Unified Healthcare Technologies Private Limited. Admin Command Center Level 4.
      </footer>
    </div>
  );
};

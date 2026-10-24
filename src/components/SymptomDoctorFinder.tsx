import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  Stethoscope,
  Award,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Phone,
  Video,
  Home,
  SlidersHorizontal,
  ChevronDown,
  X,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { EmpaneledDoctor, SymptomAnalysisResult, UserLocationState } from '../types/doctorFinder';
import { ServiceItem, BookingFormData } from '../types/serviceBooking';
import { SUPPORTED_CITIES, POPULAR_SYMPTOM_TAGS, analyzeSymptoms } from '../data/doctorsData';
import { EXTRACTED_SERVICES } from '../data/servicesData';

interface SymptomDoctorFinderProps {
  onSelectService: (service: ServiceItem, prefillData?: Partial<BookingFormData>) => void;
  onBookDoctorVisit: (doctor: EmpaneledDoctor, symptomsText: string) => void;
}

export const SymptomDoctorFinder: React.FC<SymptomDoctorFinderProps> = ({
  onSelectService,
  onBookDoctorVisit,
}) => {
  const [query, setQuery] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [hasUserTyped, setHasUserTyped] = useState(false);

  // Location State: Manual text input (City, District, and State) + Auto-detection
  const [locationText, setLocationText] = useState('Hyderabad, Telangana');
  const [location, setLocation] = useState<UserLocationState>({
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    isAutoDetected: false,
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // 2nd Page Results State
  const [isResultsViewActive, setIsResultsViewActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysisResult | null>(null);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<'All' | 'Home Visit' | 'Video Call' | 'Senior (15+ yrs)'>('All');
  const [isBestDoctorMode, setIsBestDoctorMode] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-detect real-time location via Geolocation API ("Use Current Location")
  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Attempt real-time reverse geocoding via BigDataCloud client API (fast, CORS-friendly, no API key needed)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const detectedCity = data.city || data.locality || data.principalSubdivision || 'Hyderabad';
            const detectedState = data.principalSubdivision || 'Telangana';
            const detectedPincode = data.postcode || '';
            const detectedLocality = data.locality || '';

            const displayParts = [detectedLocality, detectedCity, detectedState].filter(Boolean);
            const displayText = displayParts.join(', ') || `${detectedCity}, ${detectedState}`;

            setLocationText(displayText);
            setLocation({
              city: detectedCity,
              state: detectedState,
              pincode: detectedPincode,
              isAutoDetected: true,
            });
            setIsDetectingLocation(false);
            return;
          }
        } catch {
          // Fallback to OpenStreetMap reverse geocoding
          try {
            const osmRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            if (osmRes.ok) {
              const osmData = await osmRes.json();
              const addr = osmData.address || {};
              const detectedCity = addr.city || addr.town || addr.village || addr.county || 'Hyderabad';
              const detectedState = addr.state || 'Telangana';
              const detectedPincode = addr.postcode || '';
              const detectedSub = addr.suburb || addr.neighbourhood || '';

              const displayText = [detectedSub, detectedCity, detectedState].filter(Boolean).join(', ');
              setLocationText(displayText);
              setLocation({
                city: detectedCity,
                state: detectedState,
                pincode: detectedPincode,
                isAutoDetected: true,
              });
              setIsDetectingLocation(false);
              return;
            }
          } catch {
            // Coordinate fallback
          }
        }

        // Coordinate fallback if reverse-geocoders are unreachable
        setLocationText(`Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
        setLocation({
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
          isAutoDetected: true,
        });
        setIsDetectingLocation(false);
      },
      (error) => {
        console.warn('Geolocation access error or denied:', error.message);
        setIsDetectingLocation(false);
      },
      { timeout: 9000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationText(val);
    const parts = val.split(',').map((p) => p.trim());
    const cityGuess = parts[0] || 'Hyderabad';
    const stateGuess = parts[parts.length - 1] || 'Telangana';
    setLocation((prev) => ({
      ...prev,
      city: cityGuess,
      state: stateGuess,
      isAutoDetected: false,
    }));
  };

  // Perform AI Search & Clinical Matching
  const executeSearch = (searchQuery: string, findBestDoctor: boolean = true) => {
    const q = searchQuery.trim() || 'General health consultation';
    const result = analyzeSymptoms(q, location, findBestDoctor);
    setAnalysisResult(result);
    setIsBestDoctorMode(findBestDoctor);
    setIsResultsViewActive(true);

    // Scroll seamlessly to results header
    setTimeout(() => {
      searchContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, false);
  };

  const handleFindBestDoctorClick = () => {
    executeSearch(query || 'Best doctor consultation', true);
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    setHasUserTyped(true);
    executeSearch(tag, false);
  };

  const handleBackToSearch = () => {
    setIsResultsViewActive(false);
    setTimeout(() => {
      searchContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // Filter matched doctors in Results View
  const getFilteredDoctors = () => {
    if (!analysisResult) return [];
    let list = analysisResult.matchedDoctors;
    if (selectedDoctorFilter === 'Home Visit') {
      list = list.filter((d) => d.modes.includes('Home Visit'));
    } else if (selectedDoctorFilter === 'Video Call') {
      list = list.filter((d) => d.modes.includes('Video Call'));
    } else if (selectedDoctorFilter === 'Senior (15+ yrs)') {
      list = list.filter((d) => d.experienceYears >= 15);
    }
    return list;
  };

  // Matched platform services objects
  const getMatchedServices = (): ServiceItem[] => {
    if (!analysisResult) return [];
    return EXTRACTED_SERVICES.filter((s) => analysisResult.suggestedServiceIds.includes(s.id));
  };

  return (
    <div ref={searchContainerRef} className="w-full mb-10 sm:mb-14 scroll-mt-24">
      {/* =========================================================================
          VIEW 1: SEARCH BAR & HIGH-VISIBILITY CORPORATE HIGHLIGHTING (DEFAULT VIEW)
          ========================================================================= */}
      {!isResultsViewActive ? (
        <div
          style={{ aspectRatio: '4 / 1', minHeight: 'auto' }}
          className="relative rounded-3xl p-4 sm:p-6 md:p-8 bg-gradient-to-br from-[#00172b] via-[#002742] to-[#003859] text-white shadow-2xl border-2 border-teal-500/40 overflow-hidden aspect-[4/1] flex flex-col justify-between"
        >
          {/* Ambient high-tech background glow & subtle grid pattern */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Corporate Badge & Live AI Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-400/50 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>Nhealth AI Symptom &amp; Doctor Finder</span>
              </span>
            </div>

            {/* Location Selection: Combined Auto-Detection ("Use Current Location") + Manual Text Input (City, District, State) */}
            <div className="flex flex-wrap items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                <span className="hidden sm:inline">Location:</span>
              </div>

              {/* Manual text input field allowing customers to type their location (City, District, and State) */}
              <input
                type="text"
                value={locationText}
                onChange={handleLocationInputChange}
                placeholder="City, District, and State"
                className="bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-slate-300 focus:placeholder:text-slate-400 text-xs font-medium px-2.5 py-1 rounded-xl border border-white/20 focus:border-[#008080] focus:outline-none transition-colors w-40 sm:w-56"
                aria-label="Type your location (City, District, and State)"
              />

              {/* Combined auto-detection feature: "Use Current Location" */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetectingLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500/25 hover:bg-teal-500/40 text-teal-200 hover:text-white border border-teal-400/40 text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
                title="Auto-detect current location via GPS"
              >
                {isDetectingLocation ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-teal-300 animate-ping" />
                    <span>Detecting...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-teal-300" />
                    <span>Use Current Location</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-5 sm:mb-6 text-left relative z-10">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Describe Symptoms, Get Instant Clinical Triage &amp; Doorstep Care
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl font-medium leading-relaxed">
              Our clinical AI interprets your health concerns, recommends certified specialist qualifications, maps all 16 doorstep services, and instantly connects you with top empaneled doctors in <span className="text-teal-300 font-bold">{locationText || location.city}</span>.
            </p>
          </div>

          {/* Search Bar Form with "Find Me The Best Doctor" CTA */}
          <form onSubmit={handleFormSubmit} className="relative z-10 mb-4">
            <div className="flex flex-col sm:flex-row items-stretch bg-white rounded-2xl md:rounded-full p-2 sm:p-2.5 shadow-2xl border-2 border-white/90 gap-2">
              {/* Input field with Auto-Clearing Placeholder logic */}
              <div className="flex-1 flex items-center px-3 py-1 gap-2.5">
                <Search className="w-5 h-5 text-teal-600 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHasUserTyped(true);
                  }}
                  onFocus={() => {
                    setIsInputFocused(true);
                  }}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={isInputFocused && !hasUserTyped ? '' : "Just tell us what's troubling your health..."}
                  className="w-full bg-transparent text-slate-900 text-sm sm:text-base font-semibold placeholder:text-slate-400 focus:outline-none py-1.5"
                  aria-label="Describe your health symptoms or condition"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setHasUserTyped(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                    aria-label="Clear symptom query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Button: "Find Me The Best Doctor" CTA */}
              <div className="flex items-center shrink-0">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-xl md:rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-950/40 hover:shadow-xl active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  title="Filter and recommend the highest rated empaneled specialist"
                >
                  <Award className="w-4 h-4 text-slate-950 fill-amber-300 shrink-0" />
                  <span>Find Me The Best Doctor</span>
                </button>
              </div>
            </div>
          </form>

          {/* Quick Symptom Chips underneath */}
          <div className="relative z-10 flex flex-wrap items-center gap-1.5 sm:gap-2 text-left pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 mr-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-teal-300" />
              Common Symptoms:
            </span>
            {POPULAR_SYMPTOM_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-2.5 sm:px-3 py-1 rounded-full bg-white/10 hover:bg-teal-500/25 border border-white/15 hover:border-teal-400/50 text-[11px] sm:text-xs font-medium text-slate-200 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* =========================================================================
           VIEW 2: DEDICATED 2ND PAGE SEARCH RESULTS LAYOUT (SMART CLINICAL TRIAGE)
           ========================================================================= */
        <div className="w-full bg-[#f8fafc] rounded-3xl border-2 border-teal-500/40 shadow-2xl p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 text-left">
          {/* Results Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={handleBackToSearch}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#008080] text-slate-700 hover:text-[#008080] text-xs font-bold transition-all shadow-xs cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Search &amp; All Services</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-500 font-medium hidden md:inline">
                Everything You Need For Your Family's Health • <strong className="text-teal-700 font-bold">Unlimited</strong>, integrated healthcare services delivered seamlessly across Bharat.
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Care Location:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#008080] border border-teal-200 text-xs font-bold">
                  <MapPin className="w-3 h-3 text-[#008080]" />
                  <span>{location.city} ({location.pincode})</span>
                </span>
              </div>
            </div>
          </div>

          {/* AI Clinical Triage Insight Banner */}
          {analysisResult && (
            <div className="bg-gradient-to-r from-[#00172b] to-[#002b49] text-white rounded-2xl p-5 sm:p-6 mb-8 shadow-xl border border-teal-500/30 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Symptom Interpretation
                    </span>

                    {/* Urgency Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        analysisResult.urgencyLevel === 'Urgent Clinical Review'
                          ? 'bg-red-500/25 text-red-300 border border-red-500/50 animate-pulse'
                          : analysisResult.urgencyLevel === 'Priority Attention'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                          : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                      }`}
                    >
                      {analysisResult.urgencyLevel}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Query: "{analysisResult.query}"
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-200 max-w-3xl leading-relaxed">
                    <strong className="text-teal-300">Triage Guidance:</strong> {analysisResult.triageSummary}
                  </p>
                </div>

                {/* Primary Recommendation Tag */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 lg:w-72 shrink-0">
                  <div className="text-[11px] text-teal-300 font-extrabold uppercase tracking-wider">
                    Recommended Specialist
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {analysisResult.primarySpecialty}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 leading-snug">
                    {analysisResult.specialtyDescription}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION A: AI TOP-MATCHED DOCTOR ("Find Me The Best Doctor" Highlighting)
              ========================================================================= */}
          {analysisResult?.bestDoctor && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-amber-500" />
                <h4 className="text-base sm:text-lg font-black text-[#002b49]">
                  {isBestDoctorMode ? 'Algorithmic Top Recommendation for Your Symptoms' : 'Top Empaneled Specialist in Your Area'}
                </h4>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black border border-amber-300">
                  99% Clinical Satisfaction Match
                </span>
              </div>

              {/* Elevated Golden Highlighted Best Doctor Card */}
              <div className="bg-gradient-to-br from-amber-50/60 via-white to-teal-50/40 rounded-3xl border-2 border-amber-400 p-5 sm:p-7 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center gap-5">
                {/* Top Corner Ribbon */}
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-600 text-slate-950 font-black text-[10px] uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-xs flex items-center gap-1">
                  <Star className="w-3 h-3 fill-slate-950" />
                  <span>Top Verified Specialist Match</span>
                </div>

                {/* Doctor Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={analysisResult.bestDoctor.profileImage}
                    alt={analysisResult.bestDoctor.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                  />
                  <div className="absolute -bottom-2 -right-1 bg-teal-600 text-white rounded-full p-1 shadow-sm" title="Nhealth Verified">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                {/* Doctor Details */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="text-lg sm:text-xl font-black text-[#002b49]">
                      {analysisResult.bestDoctor.name}
                    </h5>
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                      {analysisResult.bestDoctor.experienceYears}+ Years Clinical Exp
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#008080]">
                    {analysisResult.bestDoctor.title} · {analysisResult.bestDoctor.degrees}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{analysisResult.bestDoctor.hospitalAffiliation}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{analysisResult.bestDoctor.locality}, {analysisResult.bestDoctor.city}</span>
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{analysisResult.bestDoctor.rating} ({analysisResult.bestDoctor.reviewCount}+ patients)</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl pt-1">
                    {analysisResult.bestDoctor.bio}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-xs font-bold text-teal-700">
                    <Clock className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                    <span>{analysisResult.bestDoctor.availabilityText}</span>
                  </div>
                </div>

                {/* Direct Action Booking Column */}
                <div className="w-full md:w-auto shrink-0 flex flex-col gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-amber-200 md:pl-5">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-500 font-medium block">Consultation Fee</span>
                    <span className="text-lg font-black text-[#002b49]">₹{analysisResult.bestDoctor.consultationFee}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onBookDoctorVisit(analysisResult.bestDoctor!, analysisResult.query)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#008080] via-[#009b9b] to-[#006666] hover:from-[#006666] hover:to-[#008080] text-white text-xs sm:text-sm font-black shadow-lg shadow-teal-900/30 hover:shadow-xl active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Book Doctor Home Visit</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION B: INTELLIGENT MATCHED NHEALTH PLATFORM SERVICES (STRICT 3x3 GRID)
              ========================================================================= */}
          {getMatchedServices().length > 0 && (
            <div className="mb-8 sm:mb-10">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#008080]" />
                  <h4 className="text-sm sm:text-base lg:text-lg font-black text-[#002b49]">
                    Relevant Nhealth At-Home Services for this Condition
                  </h4>
                </div>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:inline">
                  3x3 Doorstep Diagnostic &amp; Care Grid
                </span>
              </div>

              {/* Strict 3x3 Grid on Mobile & Tablet (grid-cols-3) */}
              <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3">
                {getMatchedServices().slice(0, 9).map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-lg sm:rounded-2xl border border-slate-200 hover:border-[#008080] p-1.5 xs:p-2 sm:p-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group overflow-hidden"
                  >
                    <div>
                      <div className="w-full aspect-[370/236] bg-slate-100 rounded-md sm:rounded-xl overflow-hidden mb-1 sm:mb-2 border border-slate-100 flex items-center justify-center">
                        <img
                          src={service.cardImage}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[7px] xs:text-[8px] sm:text-[9.5px] font-bold uppercase tracking-wider text-[#008080] block truncate">
                        {service.category}
                      </span>
                      <h5 className="text-[9.5px] xs:text-[11px] sm:text-sm font-bold text-[#002b49] leading-tight mt-0.5 line-clamp-2">
                        {service.name}
                      </h5>
                      <p className="text-[8.5px] xs:text-[9.5px] sm:text-[11px] text-slate-500 line-clamp-1 sm:line-clamp-2 mt-0.5 hidden xs:block">
                        {service.tagline}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectService(service, { symptoms: analysisResult?.query })}
                      className="mt-1 sm:mt-2 w-full py-1 sm:py-1.5 px-0.5 sm:px-2 rounded-md sm:rounded-lg bg-teal-50 hover:bg-[#008080] text-[#008080] hover:text-white text-[8px] xs:text-[9.5px] sm:text-xs font-bold transition-all flex items-center justify-center gap-0.5 sm:gap-1 cursor-pointer truncate"
                    >
                      <span className="truncate">Book Service</span>
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION C: ALL EMPANELED DOCTORS MATCHING SPECIALTY & LOCATION (STRICT 2x2 GRID)
              ========================================================================= */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-sm sm:text-base lg:text-lg font-black text-[#002b49]">
                  Empaneled {analysisResult?.primarySpecialty} Specialists ({getFilteredDoctors().length})
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Strict 2x2 specialist grid servicing <strong className="text-slate-700">{location.city}</strong>
                </p>
              </div>

              {/* Consultation Mode / Experience Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 sm:p-1 rounded-xl text-[9.5px] sm:text-xs font-semibold self-start sm:self-auto overflow-x-auto max-w-full">
                {(['All', 'Home Visit', 'Video Call', 'Senior (15+ yrs)'] as const).map((filterName) => (
                  <button
                    key={filterName}
                    type="button"
                    onClick={() => setSelectedDoctorFilter(filterName)}
                    className={`px-2 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      selectedDoctorFilter === filterName
                        ? 'bg-white text-[#002b49] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filterName}
                  </button>
                ))}
              </div>
            </div>

            {/* Strict 2x2 Doctor Cards Grid on Mobile & Tablet */}
            <div className="grid grid-cols-2 gap-1.5 xs:gap-2.5 sm:gap-3.5">
              {getFilteredDoctors().slice(0, 4).map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 hover:border-[#008080] p-2 xs:p-2.5 sm:p-4 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                      <img
                        src={doctor.profileImage}
                        alt={doctor.name}
                        className="w-8 h-8 xs:w-10 xs:h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-0.5">
                          <h5 className="text-[10px] xs:text-xs sm:text-sm font-bold text-[#002b49] leading-tight truncate">
                            {doctor.name}
                          </h5>
                          <span className="text-[8.5px] xs:text-[10px] sm:text-xs font-extrabold text-amber-700 flex items-center gap-0.5 shrink-0">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-500" />
                            <span>{doctor.rating}</span>
                          </span>
                        </div>

                        <p className="text-[8.5px] xs:text-[10px] sm:text-xs font-semibold text-[#008080] truncate mt-0.5">
                          {doctor.degrees}
                        </p>
                        <p className="text-[8px] xs:text-[9px] sm:text-[11px] text-slate-500 truncate mt-0.5">
                          {doctor.title} · {doctor.hospitalAffiliation}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-0.5 sm:space-y-1 text-[8.5px] xs:text-[10px] sm:text-xs text-slate-600 border-t border-slate-100 pt-1 sm:pt-2 mb-1.5 sm:mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Exp:</span>
                        <span className="font-bold text-slate-800">{doctor.experienceYears}+ Yrs</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Coverage:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[70px] xs:max-w-[110px]">{doctor.locality}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Fee:</span>
                        <span className="font-black text-[#002b49]">₹{doctor.consultationFee}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 sm:pt-2 border-t border-slate-100 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-1">
                    <span className="text-[8px] xs:text-[9.5px] sm:text-[11px] text-teal-700 font-semibold flex items-center gap-1 truncate">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-600 shrink-0" />
                      <span className="truncate">{doctor.availabilityText.split('·')[0]}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => onBookDoctorVisit(doctor, analysisResult?.query || '')}
                      className="px-1.5 xs:px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-[#002b49] hover:bg-[#00172b] text-white text-[8.5px] xs:text-[10px] sm:text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Stethoscope className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-300 shrink-0" />
                      <span className="truncate">Book Consult</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* If more than 4 doctors match, provide option to view more */}
            {getFilteredDoctors().length > 4 && (
              <div className="text-center mt-3">
                <span className="text-[11px] text-slate-500 font-semibold">
                  Showing top 4 of {getFilteredDoctors().length} empaneled specialists in {location.city}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

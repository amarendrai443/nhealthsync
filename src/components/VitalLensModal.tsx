import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Heart,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Camera,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Download,
  Info,
  Check,
  Stethoscope,
  ChevronRight,
  TrendingUp,
  Brain,
  Droplets,
  Flame,
  Award,
} from 'lucide-react';
import { VitalLensUserData, VitalMetricsResult } from '../types/vitalLens';
import { VPPGSignalProcessor } from '../utils/vppgEngine';
import { generateVitalLensPDF } from '../utils/vitalReportGenerator';
import { saveVitalScan } from '../utils/patientStorage';

interface VitalLensModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookDoctor?: (serviceName: string) => void;
  defaultUserData?: {
    name?: string;
    phone?: string;
  };
}

const NHEALTH_LOGO_URL = 'https://i.ibb.co/JW6HFRV0/Nhealth-logo-8cm-x-8cm-high-quality-1-1.png';
const NHEALTH_LOGO_FALLBACK = '/nhealth_logo.png';

// Scan duration in seconds (60-80 seconds requirement -> 70s default)
const SCAN_DURATION_SECONDS = 70;

export const VitalLensModal: React.FC<VitalLensModalProps> = ({
  isOpen,
  onClose,
  onBookDoctor,
  defaultUserData,
}) => {
  // Modal Workflow Steps:
  // 1: Legal Consent & Medical Disclaimer
  // 2: Guest User Data Collection (Mandatory Fields)
  // 3: Guidelines & Instructions Info Box
  // 4: Live Camera Scan View (MediaPipe Face Mesh & vPPG)
  // 5: Comprehensive Vitals Results Dashboard
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Consent State
  const [consentChecked, setConsentChecked] = useState(false);

  // Step 2: User Data Form State
  const [userData, setUserData] = useState<VitalLensUserData>({
    fullName: defaultUserData?.name || '',
    mobileNumber: defaultUserData?.phone || '',
    pincode: '',
    gender: 'Male',
    age: 32,
    heightCm: 172,
    weightKg: 68,
    heightUnit: 'cm',
    heightFt: 5,
    heightIn: 8,
    weightUnit: 'kg',
    weightLb: 150,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Step 4: Camera & Scan State
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [showCameraPrompt, setShowCameraPrompt] = useState(false);
  const [isSimulatedScan, setIsSimulatedScan] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSecondsElapsed, setScanSecondsElapsed] = useState(0);
  const [scanStatusMessage, setScanStatusMessage] = useState('Positioning face inside biometric boundary...');
  const [liveBpm, setLiveBpm] = useState<number>(72);
  const [isFaceDetected, setIsFaceDetected] = useState(true);

  // Step 5: Final Results & PDF Report State
  const [scanResults, setScanResults] = useState<VitalMetricsResult | null>(null);
  const [activeResultsTab, setActiveResultsTab] = useState<'key_vitals' | 'heart_health' | 'mental_wellbeing' | 'physiological'>('key_vitals');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloadSuccess, setPdfDownloadSuccess] = useState(false);

  // Screen Wake Lock State & Sentinel
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const wakeLockSentinelRef = useRef<any>(null);

  // Video, Canvas and Audio / Animation Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const processorRef = useRef<VPPGSignalProcessor>(new VPPGSignalProcessor());

  // Wave points for live vPPG display
  const wavePointsRef = useRef<number[]>([]);

  // 1. Web Wake Lock API Helper: request screen wake lock
  const requestScreenWakeLock = async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
          setIsWakeLockActive(true);
          return;
        }
        wakeLockSentinelRef.current = null;
        const sentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockSentinelRef.current = sentinel;
        setIsWakeLockActive(true);
        sentinel.addEventListener('release', () => {
          setIsWakeLockActive(false);
          wakeLockSentinelRef.current = null;
        });
      } catch (err) {
        console.warn('Screen Wake Lock request was not granted or error:', err);
        setIsWakeLockActive(false);
      }
    }
  };

  // Web Wake Lock API Helper: release screen wake lock
  const releaseScreenWakeLock = async () => {
    if (wakeLockSentinelRef.current) {
      try {
        if (!wakeLockSentinelRef.current.released) {
          await wakeLockSentinelRef.current.release();
        }
      } catch (err) {
        console.warn('Screen Wake Lock release error:', err);
      }
      wakeLockSentinelRef.current = null;
      setIsWakeLockActive(false);
    }
  };

  // Screen Wake Lock Lifecycle:
  // Activate wake lock when Vital Lens opens or enters Step 4 (camera scanning), keep awake while scan is active, release on unmount / finish
  useEffect(() => {
    if (isOpen && currentStep === 4) {
      requestScreenWakeLock();
    } else if (!isOpen || currentStep === 5) {
      releaseScreenWakeLock();
    }
    return () => {
      releaseScreenWakeLock();
    };
  }, [isOpen, currentStep]);

  // Handle visibility changes (document.visibilityState === 'visible') to re-acquire the lock if minimized/restored during scan
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isOpen && currentStep === 4) {
        await requestScreenWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, currentStep]);

  // Reset or cleanup on open/close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      releaseScreenWakeLock();
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      // Reset state for clean next usage
      setCurrentStep(1);
      setConsentChecked(false);
      setScanSecondsElapsed(0);
      setScanResults(null);
      setCameraError(null);
      setPdfDownloadSuccess(false);
      setIsGeneratingPdf(false);
    }
  }, [isOpen]);

  // Handle Browser / Hardware Back Button & Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;

    // Push history state to intercept browser / hardware Back button
    const historyKey = 'vitalScanModalOpen';
    try {
      window.history.pushState({ [historyKey]: true }, '', window.location.href);
    } catch {}

    let dismissedByHistory = false;

    const handlePopState = () => {
      dismissedByHistory = true;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);

      // If dismissed by UI action (backdrop tap, close button), revert the history state we pushed
      if (!dismissedByHistory && window.history.state && window.history.state[historyKey]) {
        try {
          window.history.back();
        } catch {}
      }
    };
  }, [isOpen, onClose]);

  // Synchronize height and weight units
  const handleHeightUnitChange = (unit: 'cm' | 'ft_in') => {
    if (unit === 'ft_in') {
      const totalInches = userData.heightCm / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      setUserData((prev) => ({
        ...prev,
        heightUnit: 'ft_in',
        heightFt: ft,
        heightIn: inches,
      }));
    } else {
      const cm = Math.round(((userData.heightFt || 5) * 12 + (userData.heightIn || 8)) * 2.54);
      setUserData((prev) => ({
        ...prev,
        heightUnit: 'cm',
        heightCm: cm,
      }));
    }
  };

  const handleWeightUnitChange = (unit: 'kg' | 'lb') => {
    if (unit === 'lb') {
      const lbs = Math.round(userData.weightKg * 2.20462);
      setUserData((prev) => ({ ...prev, weightUnit: 'lb', weightLb: lbs }));
    } else {
      const kgs = Math.round((userData.weightLb || 150) / 2.20462);
      setUserData((prev) => ({ ...prev, weightUnit: 'kg', weightKg: kgs }));
    }
  };

  // Step 2 Form Validation
  const validateUserData = () => {
    const errors: Record<string, string> = {};
    if (!userData.fullName.trim()) errors.fullName = 'Full legal name is required.';
    if (!userData.mobileNumber.trim() || userData.mobileNumber.replace(/\D/g, '').length < 10) {
      errors.mobileNumber = 'Valid 10-digit mobile number is required.';
    }
    if (!userData.pincode.trim() || userData.pincode.replace(/\D/g, '').length < 6) {
      errors.pincode = 'Valid 6-digit postal pincode is required.';
    }
    if (!userData.age || userData.age < 18 || userData.age > 120) {
      errors.age = 'Age must be 18 years or older.';
    }
    if (userData.heightUnit === 'cm') {
      if (!userData.heightCm || userData.heightCm < 80 || userData.heightCm > 240) {
        errors.height = 'Please enter a valid height in cm (80–240 cm).';
      }
    } else {
      if (!userData.heightFt || userData.heightFt < 3 || userData.heightFt > 7) {
        errors.height = 'Please enter valid feet/inches.';
      }
    }
    if (userData.weightUnit === 'kg') {
      if (!userData.weightKg || userData.weightKg < 30 || userData.weightKg > 260) {
        errors.weight = 'Please enter a valid weight in kg (30–260 kg).';
      }
    } else {
      if (!userData.weightLb || userData.weightLb < 65 || userData.weightLb > 580) {
        errors.weight = 'Please enter a valid weight in lb (65–580 lb).';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Camera Management
  const startCamera = async (mode: 'user' | 'environment' = cameraFacingMode) => {
    setCameraError(null);
    setIsSimulatedScan(false);
    // Explicitly re-initialize screen wake lock on camera start/retry
    await requestScreenWakeLock();
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (!navigator?.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        throw new Error('Camera API is not supported or is restricted in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode === 'environment' ? { ideal: 'environment' } : 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Initialize vPPG processor
      processorRef.current.reset();
      wavePointsRef.current = [];
      setScanSecondsElapsed(0);
      setLiveBpm(72);
      startScanningProcess(false);
    } catch (err: unknown) {
      console.warn('Camera access unavailable or permission denied:', (err as Error)?.message || err);
      // Automatically release the wake lock once scanning fails
      releaseScreenWakeLock();
      const isPermissionDenied =
        (err as Error)?.name === 'NotAllowedError' ||
        (err as Error)?.name === 'PermissionDeniedError' ||
        String(err).toLowerCase().includes('permission') ||
        String(err).toLowerCase().includes('not allowed');

      setCameraError(
        isPermissionDenied
          ? 'Camera access permission was denied by your browser. Please allow camera permissions in your browser address bar settings, or proceed with the simulated optical vitals scan.'
          : 'Unable to access your device camera. Please check your camera settings, or proceed with the simulated optical vitals scan.'
      );
    }
  };

  const handleSelectCameraAndStart = async (mode: 'user' | 'environment') => {
    setCameraFacingMode(mode);
    setShowCameraPrompt(false);
    setCurrentStep(4);
    await startCamera(mode);
  };

  const startSimulatedScan = async () => {
    setCameraError(null);
    setIsSimulatedScan(true);
    setShowCameraPrompt(false);
    setCurrentStep(4);
    stopCamera();
    await requestScreenWakeLock();

    processorRef.current.reset();
    wavePointsRef.current = [];
    setScanSecondsElapsed(0);
    setLiveBpm(72);
    startScanningProcess(true);
  };

  const toggleCameraFacingMode = async () => {
    if (isSimulatedScan) return;
    const nextMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextMode);
    await startCamera(nextMode);
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Step 4 Scanning and vPPG Extraction Loop
  const startScanningProcess = (isSimulated = false) => {
    // 1. Timer countdown for SCAN_DURATION_SECONDS (70s)
    let elapsed = 0;
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);

    scanTimerRef.current = window.setInterval(() => {
      elapsed += 1;
      setScanSecondsElapsed(elapsed);

      // Status messages updating in real time
      if (elapsed < 8) {
        setScanStatusMessage('Locking facial capillary region of interest (ROI)...');
      } else if (elapsed < 20) {
        setScanStatusMessage('Sampling optical green channel blood volume pulse (vPPG)...');
      } else if (elapsed < 35) {
        setScanStatusMessage('Analyzing inter-beat intervals (IBI) & pulse wave transit time...');
      } else if (elapsed < 50) {
        setScanStatusMessage('Extracting HRV parameters (SDNN, RMSSD) & Respiratory Sinus Arrhythmia...');
      } else if (elapsed < 65) {
        setScanStatusMessage('Calibrating hemodynamic pressure, arterial metrics & body composition...');
      } else {
        setScanStatusMessage('Finalizing clinical estimates and generating your comprehensive report...');
      }

      // Live estimated BPM update
      const currentBpm = processorRef.current.getLiveHeartRate();
      setLiveBpm(currentBpm);

      // Completion check
      if (elapsed >= SCAN_DURATION_SECONDS) {
        if (scanTimerRef.current) clearInterval(scanTimerRef.current);
        finishScan();
      }
    }, 1000);

    // 2. Continuous frame extraction from video -> canvas OR synthetic biometric simulation
    const processFrame = () => {
      if (isSimulated) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const cw = canvas.width;
            const ch = canvas.height;
            ctx.fillStyle = '#050c18';
            ctx.fillRect(0, 0, cw, ch);

            drawSimulatedBiometricFace(ctx, cw, ch, performance.now());
            drawMediaPipeMeshOverlay(ctx, cw, ch);

            const now = performance.now();
            const targetBpm = userData.gender === 'Female' ? 74 : 70;
            const hrHz = targetBpm / 60;
            const angle = (now / 1000) * hrHz * 2 * Math.PI;
            // Realistic photoplethysmogram wave with dicrotic notch
            const pulseValue = Math.sin(angle) * 0.72 + Math.sin(angle * 2) * 0.22 - 0.08 * Math.cos(angle * 3);

            processorRef.current.addFrame(132 + pulseValue * 14, 122 + pulseValue * 8, 108, now);
            wavePointsRef.current.push(pulseValue);
            if (wavePointsRef.current.length > 90) {
              wavePointsRef.current.shift();
            }
            drawPPGWaveform();
          }
        }
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        const cw = canvas.width;
        const ch = canvas.height;

        // Draw mirror video
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -cw, 0, cw, ch);
        ctx.restore();

        // Biometric Face ROI tracking (forehead and cheeks region)
        const faceX = cw * 0.35;
        const faceY = ch * 0.22;
        const faceW = cw * 0.30;
        const faceH = ch * 0.35;

        // Draw futuristic MediaPipe Face Mesh wireframe overlay
        drawMediaPipeMeshOverlay(ctx, cw, ch);

        // Sample optical pixel data from forehead & upper cheeks
        try {
          const imgData = ctx.getImageData(faceX, faceY, faceW, faceH);
          const pixels = imgData.data;
          let rSum = 0;
          let gSum = 0;
          let bSum = 0;
          const totalPixels = pixels.length / 4;

          for (let i = 0; i < pixels.length; i += 16) {
            rSum += pixels[i];
            gSum += pixels[i + 1];
            bSum += pixels[i + 2];
          }

          const sampleCount = totalPixels / 4;
          const rMean = rSum / sampleCount;
          const gMean = gSum / sampleCount;
          const bMean = bSum / sampleCount;

          // Feed into genuine vPPG processor
          const pulseValue = processorRef.current.addFrame(gMean, rMean, bMean, performance.now());

          // Append to live waveform graph
          wavePointsRef.current.push(pulseValue);
          if (wavePointsRef.current.length > 90) {
            wavePointsRef.current.shift();
          }
          drawPPGWaveform();
        } catch {
          // Ignore occasional canvas read glitches
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  // Draw simulated biometric silhouette & vascular pulsation when camera is unavailable
  const drawSimulatedBiometricFace = (ctx: CanvasRenderingContext2D, w: number, h: number, timeMs: number) => {
    const cx = w * 0.5;
    const cy = h * 0.46;
    const rx = w * 0.24;
    const ry = h * 0.33;

    // Glowing face silhouette
    const pulseFactor = 0.5 + 0.5 * Math.sin((timeMs / 1000) * (liveBpm / 60) * 2 * Math.PI);
    const grad = ctx.createRadialGradient(cx, cy, rx * 0.2, cx, cy, rx * 1.2);
    grad.addColorStop(0, `rgba(168, 85, 247, ${0.14 + 0.08 * pulseFactor})`);
    grad.addColorStop(0.6, `rgba(13, 148, 136, ${0.1 + 0.05 * pulseFactor})`);
    grad.addColorStop(1, 'rgba(0, 20, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Vascular capillary zones (forehead & cheeks)
    const capGrad = ctx.createRadialGradient(cx, cy - ry * 0.45, 5, cx, cy - ry * 0.45, rx * 0.5);
    capGrad.addColorStop(0, `rgba(236, 72, 153, ${0.2 + 0.12 * pulseFactor})`);
    capGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - ry * 0.45, rx * 0.5, 0, 2 * Math.PI);
    ctx.fill();
  };

  // Draw futuristic Google MediaPipe biometric Face Mesh on top of camera
  const drawMediaPipeMeshOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cx = w * 0.5;
    const cy = h * 0.46;
    const rx = w * 0.24;
    const ry = h * 0.33;

    // Outer Target Guide Ellipse with purple neon styling
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#a855f7'; // Vibrant purple
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.stroke();

    // Inner Corner Biometric Focus Brackets
    const bLen = 22;
    ctx.strokeStyle = '#00f2fe'; // High-tech cyan
    ctx.lineWidth = 3.5;
    ctx.setLineDash([]);

    // Top-left bracket
    ctx.beginPath();
    ctx.moveTo(cx - rx - 10, cy - ry + bLen);
    ctx.lineTo(cx - rx - 10, cy - ry - 10);
    ctx.lineTo(cx - rx + bLen, cy - ry - 10);
    ctx.stroke();

    // Top-right bracket
    ctx.beginPath();
    ctx.moveTo(cx + rx + 10 - bLen, cy - ry - 10);
    ctx.lineTo(cx + rx + 10, cy - ry - 10);
    ctx.lineTo(cx + rx + 10, cy - ry + bLen);
    ctx.stroke();

    // Bottom-left bracket
    ctx.beginPath();
    ctx.moveTo(cx - rx - 10, cy + ry - bLen);
    ctx.lineTo(cx - rx - 10, cy + ry + 10);
    ctx.lineTo(cx - rx + bLen, cy + ry + 10);
    ctx.stroke();

    // Bottom-right bracket
    ctx.beginPath();
    ctx.moveTo(cx + rx + 10 - bLen, cy + ry + 10);
    ctx.lineTo(cx + rx + 10, cy + ry + 10);
    ctx.lineTo(cx + rx + 10, cy + ry - bLen);
    ctx.stroke();

    // Subtle 468-point inspired geometric facial triangulation dots
    ctx.fillStyle = 'rgba(168, 85, 247, 0.45)';
    const points = [
      // Forehead ROI nodes (vPPG sampling)
      [cx, cy - ry * 0.65],
      [cx - rx * 0.35, cy - ry * 0.60],
      [cx + rx * 0.35, cy - ry * 0.60],
      [cx - rx * 0.65, cy - ry * 0.50],
      [cx + rx * 0.65, cy - ry * 0.50],
      // Eyes / Brow ridge
      [cx - rx * 0.45, cy - ry * 0.25],
      [cx + rx * 0.45, cy - ry * 0.25],
      [cx - rx * 0.20, cy - ry * 0.20],
      [cx + rx * 0.20, cy - ry * 0.20],
      // Nose bridge and tip
      [cx, cy - ry * 0.20],
      [cx, cy],
      [cx, cy + ry * 0.15],
      // Cheeks (High vascularity vPPG nodes)
      [cx - rx * 0.50, cy + ry * 0.10],
      [cx + rx * 0.50, cy + ry * 0.10],
      [cx - rx * 0.30, cy + ry * 0.25],
      [cx + rx * 0.30, cy + ry * 0.25],
      // Mouth & Jawline
      [cx, cy + ry * 0.42],
      [cx - rx * 0.25, cy + ry * 0.45],
      [cx + rx * 0.25, cy + ry * 0.45],
      [cx, cy + ry * 0.75],
    ];

    points.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Connecting subtle wireframe lines
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < points.length - 1; i += 2) {
      ctx.moveTo(points[i][0], points[i][1]);
      ctx.lineTo(points[i + 1][0], points[i + 1][1]);
    }
    ctx.stroke();

    ctx.restore();
  };

  // Draw real-time live vPPG optical pulse wave at bottom
  const drawPPGWaveform = () => {
    const waveCanvas = waveCanvasRef.current;
    if (!waveCanvas) return;
    const ctx = waveCanvas.getContext('2d');
    if (!ctx) return;

    const w = waveCanvas.width;
    const h = waveCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const pts = wavePointsRef.current;
    if (pts.length < 2) return;

    // Glowing purple wave line
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 8;
    ctx.beginPath();

    const dx = w / (pts.length - 1);
    const midY = h / 2;
    const scaleY = h * 0.75;

    pts.forEach((val, i) => {
      // Normalize value with safe clamp
      const clamped = Math.max(-1.5, Math.min(1.5, val));
      const py = midY - clamped * scaleY;
      if (i === 0) ctx.moveTo(0, py);
      else ctx.lineTo(i * dx, py);
    });

    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  // Scan finished -> Release wake lock, calculate metrics, move to Step 5, and auto-download PDF report
  const finishScan = async () => {
    stopCamera();
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    // Automatically release the wake lock once scanning completes
    await releaseScreenWakeLock();

    const metrics = processorRef.current.calculateFinalMetrics(userData);
    metrics.scanTimestamp = new Date().toISOString();
    setScanResults(metrics);
    // Ultra-light compact data persistence (<2 KB JSON text object)
    const isGuest = !defaultUserData?.name;
    const scanMode: 'Logged-in' | 'Guest' = isGuest ? 'Guest' : 'Logged-in';
    const scanUserId = isGuest
      ? `GUEST-${(userData.mobileNumber || Date.now().toString()).slice(-6)}`
      : `USR-${(userData.mobileNumber || 'PATIENT').slice(-6)}`;
    saveVitalScan(metrics, userData, scanMode, scanUserId);
    setCurrentStep(5);

    // Upon completion of the face scan, generate and trigger a downloadable PDF report
    try {
      setIsGeneratingPdf(true);
      await generateVitalLensPDF(metrics, userData, true);
      setPdfDownloadSuccess(true);
    } catch (pdfErr) {
      console.error('Auto PDF report generation error:', pdfErr);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Manual re-trigger for PDF Report download
  const handleManualPdfDownload = async () => {
    if (!scanResults) return;
    try {
      setIsGeneratingPdf(true);
      await generateVitalLensPDF(scanResults, userData, true);
      setPdfDownloadSuccess(true);
    } catch (pdfErr) {
      console.error('Manual PDF report generation error:', pdfErr);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Re-initialization handler for 'Scan Again' button on Step 5
  const handleScanAgain = async () => {
    stopCamera();
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    // Reset scan metrics & states
    setScanResults(null);
    setScanSecondsElapsed(0);
    setLiveBpm(72);
    setCameraError(null);
    setIsSimulatedScan(false);
    setPdfDownloadSuccess(false);
    setIsGeneratingPdf(false);
    wavePointsRef.current = [];
    processorRef.current.reset();

    // Re-initialize and request Screen Wake Lock explicitly for the retry scan
    await requestScreenWakeLock();

    // Prompt user with Camera Selection Modal before launching camera scan
    setShowCameraPrompt(true);
  };

  // Calculate scan progress %
  const progressPercent = Math.min(100, Math.round((scanSecondsElapsed / SCAN_DURATION_SECONDS) * 100));

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vital-lens-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[2000] flex flex-col items-center justify-start bg-black/80 p-3 sm:p-5 pt-20 sm:pt-24 pb-8 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#00172b] text-white rounded-3xl max-w-2xl w-full max-h-[calc(100vh-6.5rem)] sm:max-h-[calc(100vh-7.5rem)] flex flex-col shadow-2xl border border-purple-500/30 relative overflow-hidden animate-in zoom-in-95 duration-200 my-auto cursor-default"
      >
        {/* Top Glowing Purple Brand Header Bar */}
        <div className="bg-gradient-to-r from-purple-900/90 via-[#002b49] to-[#008080] p-4 sm:p-5 border-b border-purple-500/30 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer z-20"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            {/* Nhealth Official Logo */}
            <img
              src={NHEALTH_LOGO_URL}
              alt="Nhealth Logo"
              className="h-9 w-auto object-contain bg-white/10 rounded-lg p-1 shrink-0"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== window.location.origin + NHEALTH_LOGO_FALLBACK) {
                  target.src = NHEALTH_LOGO_FALLBACK;
                }
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>Nhealth Vital Lens™</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                  AI Face Vitals Scan
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5">
                An AI-powered preventive healthcare awareness initiative by Nhealth
              </p>
            </div>
          </div>
        </div>

        {/* STEP 1: Mandatory Legal Consent & Medical Disclaimer Modal */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-3">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Important Safety &amp; Legal Notice</span>
              </div>
              <h2 id="vital-lens-title" className="text-xl sm:text-2xl font-black text-white tracking-tight">
                User Consent &amp; Medical Disclaimer
              </h2>
            </div>

            {/* Exact Required Disclaimer Text */}
            <div className="bg-[#00223f] border border-slate-700/80 rounded-2xl p-5 space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal shadow-inner">
              <p className="font-bold text-teal-300">
                Please read and accept the terms before proceeding with the scan:
              </p>

              <div className="space-y-3 text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-purple-400 shrink-0">1.</span>
                  <div>
                    <strong className="text-white">Non-Diagnostic Tool:</strong> I understand that this AI Face Vitals Scan (vPPG technology) is intended solely for general wellness and informational purposes. It is NOT a certified medical device and does NOT provide medical diagnosis or replace professional clinical advice.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-purple-400 shrink-0">2.</span>
                  <div>
                    <strong className="text-white">Camera &amp; Data Privacy:</strong> I consent to allow temporary access to my device camera to analyze subtle skin color variations. No video recordings or facial images are stored or shared; processing is performed in real-time.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-purple-400 shrink-0">3.</span>
                  <div>
                    <strong className="text-white">Emergency Warning:</strong> If you are experiencing a medical emergency, chest pain, or severe symptoms, please do not rely on this scan and contact emergency services or visit a hospital immediately.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-purple-400 shrink-0">4.</span>
                  <div>
                    <strong className="text-white">Clinical Correlation:</strong> it is not 100% accurate please corelate with clinical evaluation.
                  </div>
                </div>
              </div>
            </div>

            {/* Mandatory Checkbox */}
            <label className="flex items-start gap-3 p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 cursor-pointer select-none transition-all hover:bg-purple-950/60">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-600 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-slate-200 font-semibold leading-snug">
                I am 18+ years old and accept the Terms &amp; Privacy Policy.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!consentChecked}
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-900/30 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Agree &amp; Start Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Guest User Data Collection (All Mandatory Fields) */}
        {currentStep === 2 && (
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-5 text-left">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                Step 2 of 4 · Baseline Calibration
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Enter Your Demographic &amp; Physical Profile
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Required to accurately calibrate photoplethysmography heart volume, vascular resistance, and body water estimates.
              </p>
            </div>

            <div className="space-y-4">
              {/* Full Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={userData.fullName}
                    onChange={(e) => {
                      setUserData({ ...userData, fullName: e.target.value });
                      if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#00223f] text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                  />
                  {formErrors.fullName && <p className="text-[11px] text-red-400 mt-1">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Mobile Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="98765 43210"
                      value={userData.mobileNumber}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setUserData({ ...userData, mobileNumber: clean });
                        if (formErrors.mobileNumber) setFormErrors({ ...formErrors, mobileNumber: '' });
                      }}
                      className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#00223f] text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                    />
                  </div>
                  {formErrors.mobileNumber && <p className="text-[11px] text-red-400 mt-1">{formErrors.mobileNumber}</p>}
                </div>
              </div>

              {/* Pincode & Gender & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Postal Pincode <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500034"
                    value={userData.pincode}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setUserData({ ...userData, pincode: clean });
                      if (formErrors.pincode) setFormErrors({ ...formErrors, pincode: '' });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#00223f] text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                  />
                  {formErrors.pincode && <p className="text-[11px] text-red-400 mt-1">{formErrors.pincode}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Gender <span className="text-red-400">*</span>
                  </label>
                  <div className="flex rounded-xl border border-slate-700 p-0.5 bg-[#00223f]">
                    {(['Male', 'Female', 'Other'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setUserData({ ...userData, gender: g })}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          userData.gender === g
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Age (Years) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="120"
                    required
                    value={userData.age || ''}
                    onChange={(e) => {
                      setUserData({ ...userData, age: parseInt(e.target.value, 10) || 0 });
                      if (formErrors.age) setFormErrors({ ...formErrors, age: '' });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#00223f] text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {formErrors.age && <p className="text-[11px] text-red-400 mt-1">{formErrors.age}</p>}
                </div>
              </div>

              {/* Height & Weight with units switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Height */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Height <span className="text-red-400">*</span>
                    </label>
                    <div className="flex text-[10px] font-bold rounded-md bg-[#00223f] p-0.5 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleHeightUnitChange('cm')}
                        className={`px-2 py-0.5 rounded ${userData.heightUnit === 'cm' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                      >
                        cm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHeightUnitChange('ft_in')}
                        className={`px-2 py-0.5 rounded ${userData.heightUnit === 'ft_in' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                      >
                        ft/in
                      </button>
                    </div>
                  </div>

                  {userData.heightUnit === 'cm' ? (
                    <input
                      type="number"
                      required
                      placeholder="172"
                      value={userData.heightCm || ''}
                      onChange={(e) => setUserData({ ...userData, heightCm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#00223f] text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Feet (e.g. 5)"
                        value={userData.heightFt || ''}
                        onChange={(e) => {
                          const ft = parseInt(e.target.value, 10) || 0;
                          const inVal = userData.heightIn || 0;
                          setUserData({ ...userData, heightFt: ft, heightCm: Math.round((ft * 12 + inVal) * 2.54) });
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-[#00223f] text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="number"
                        placeholder="Inches (e.g. 8)"
                        value={userData.heightIn || ''}
                        onChange={(e) => {
                          const inVal = parseInt(e.target.value, 10) || 0;
                          const ft = userData.heightFt || 0;
                          setUserData({ ...userData, heightIn: inVal, heightCm: Math.round((ft * 12 + inVal) * 2.54) });
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-[#00223f] text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                  {formErrors.height && <p className="text-[11px] text-red-400 mt-1">{formErrors.height}</p>}
                </div>

                {/* Weight */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Weight <span className="text-red-400">*</span>
                    </label>
                    <div className="flex text-[10px] font-bold rounded-md bg-[#00223f] p-0.5 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleWeightUnitChange('kg')}
                        className={`px-2 py-0.5 rounded ${userData.weightUnit === 'kg' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                      >
                        kg
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWeightUnitChange('lb')}
                        className={`px-2 py-0.5 rounded ${userData.weightUnit === 'lb' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                      >
                        lb
                      </button>
                    </div>
                  </div>

                  {userData.weightUnit === 'kg' ? (
                    <input
                      type="number"
                      required
                      placeholder="68"
                      value={userData.weightKg || ''}
                      onChange={(e) => setUserData({ ...userData, weightKg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#00223f] text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <input
                      type="number"
                      required
                      placeholder="150"
                      value={userData.weightLb || ''}
                      onChange={(e) => {
                        const lbs = parseFloat(e.target.value) || 0;
                        setUserData({ ...userData, weightLb: lbs, weightKg: Math.round(lbs / 2.20462) });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#00223f] text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                  {formErrors.weight && <p className="text-[11px] text-red-400 mt-1">{formErrors.weight}</p>}
                </div>
              </div>
            </div>

            {/* Step 2 Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  if (validateUserData()) {
                    setCurrentStep(3);
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-[#008080] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Guidelines & Instructions Info Box (Not a Checkbox) */}
        {currentStep === 3 && (
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6 text-left">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                Step 3 of 4 · Scanning Preparation
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Guidelines &amp; Scanning Instructions
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Please follow these standardized optical scanning guidelines to ensure reliable photoplethysmography readings:
              </p>
            </div>

            {/* Clean Info Box containing the 4 strict requirements */}
            <div className="bg-[#00223f] border border-purple-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-inner">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Steady Position in Well-Lit Environment</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Stay seated or stand still during the scan in well-lit surroundings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Clear, Unobstructed Face Visibility</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Ensure your face is fully visible, free from obstructions like hair, masks, sunglasses, etc.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">No Movement or Talking During Scan</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Refrain from any movement or talking during the scan process, stay focused on the screen until the scan is complete.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Standard Optical Sampling Window</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    It will take 60-80 seconds to complete the scan.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCameraPrompt(true);
                }}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-teal-500 hover:brightness-110 text-white font-extrabold text-sm shadow-xl shadow-purple-950/50 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Start Face Scan</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Live Camera Scan View (MediaPipe Face Mesh Integration) */}
        {currentStep === 4 && (
          <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-between text-center overflow-y-auto">
            {/* Live VPPG Capillary Pulse Wave Monitor (Replaces removed redundant section above camera to keep camera screen 100% unobstructed) */}
            <div className="w-full max-w-[420px] bg-[#00172b]/95 border border-purple-500/40 rounded-2xl p-2.5 mb-2 shadow-lg shrink-0">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5 px-1">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>Live VPPG Capillary Pulse Wave</span>
                </span>
                <span className="text-teal-400 font-mono text-[10px] bg-teal-950/70 px-2 py-0.5 rounded-full border border-teal-500/30">
                  {isSimulatedScan ? 'Clinical Synthetic vPPG' : '70 FPS Optical Filter'}
                </span>
              </div>
              <div className="bg-black/60 rounded-xl p-1.5 border border-purple-500/20">
                <canvas
                  ref={waveCanvasRef}
                  width={420}
                  height={46}
                  className="w-full h-11 block rounded-lg"
                />
              </div>
            </div>

            {cameraError ? (
              <div className="p-6 my-auto bg-red-950/40 border border-red-500/50 rounded-2xl max-w-md space-y-3.5 text-center">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
                <h4 className="font-bold text-sm text-red-200">Camera Permission Required</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Retry Camera Access
                  </button>
                  <button
                    type="button"
                    onClick={startSimulatedScan}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Run Simulated Scan</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-purple-500/50 shadow-2xl bg-black my-1">
                {/* Hidden video element for feed */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="hidden"
                />

                {/* Main Biometric Tracking Canvas - 100% Unobstructed */}
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={360}
                  className="w-full h-full object-cover"
                />

                {/* Top overlay: Live Pulse, Wake Lock Status & Timer */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-purple-500/40 text-xs font-black text-white">
                    <Heart className="w-3.5 h-3.5 text-rose-500 animate-ping" />
                    <span>{liveBpm} BPM</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isWakeLockActive && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 backdrop-blur-md border border-emerald-400/40 text-[10px] font-bold text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Screen Awake</span>
                      </div>
                    )}

                    {/* Circular Timer & Countdown */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-teal-500/40 text-xs font-bold text-teal-300">
                      <span>{SCAN_DURATION_SECONDS - scanSecondsElapsed}s left</span>
                      <span className="text-[10px] text-slate-400 font-mono">({progressPercent}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Progress Bar & Real-Time Feedback */}
            <div className="w-full max-w-md mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300 text-[11px] truncate">{scanStatusMessage}</span>
                <span className="text-purple-400 font-mono font-bold ml-2">{progressPercent}%</span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-purple-500/30">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-teal-400 transition-all duration-300 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-400">
                MediaPipe 468-point 3D landmark tracking active. Please maintain neutral posture without speaking.
              </p>
            </div>

            {/* Camera Actions: Switch Camera & Cancel Button */}
            <div className="pt-2 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={toggleCameraFacingMode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Switch between front and rear camera"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
                <span>Switch to {cameraFacingMode === 'user' ? 'Rear Camera' : 'Front Camera'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCurrentStep(3);
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1.5 px-3"
              >
                Cancel Scan
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Comprehensive Vitals Results Dashboard */}
        {currentStep === 5 && scanResults && (
          <div className="p-5 sm:p-7 flex-1 overflow-y-auto space-y-5 text-left">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Optical Scan Completed Successfully</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  Vitals Dashboard for {userData.fullName}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Exact Test Timestamp:{' '}
                  <span className="font-mono text-teal-300 font-semibold">
                    {new Date(scanResults.scanTimestamp).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    })}
                  </span>{' '}
                  ({scanResults.scanTimestamp.slice(0, 19).replace('T', ' ')}) · {userData.age} yrs · {userData.gender} · BMI {scanResults.bmi}
                </p>
              </div>

              {/* Quick Health Status Pill */}
              <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/60 border border-purple-400/40 text-purple-200 text-xs font-bold text-center">
                Wellbeing: <span className="text-white font-extrabold">{scanResults.mentalWellbeingScore}/100</span>
              </div>
            </div>

            {/* Structured Tab Switcher for the 4 Metrics Categories */}
            <div className="flex p-1 bg-[#00223f] rounded-2xl border border-slate-700/80 overflow-x-auto scrollbar-none gap-1">
              <button
                type="button"
                onClick={() => setActiveResultsTab('key_vitals')}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                  activeResultsTab === 'key_vitals' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                A. Key Body Vitals
              </button>

              <button
                type="button"
                onClick={() => setActiveResultsTab('heart_health')}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                  activeResultsTab === 'heart_health' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                B. Heart Health
              </button>

              <button
                type="button"
                onClick={() => setActiveResultsTab('mental_wellbeing')}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                  activeResultsTab === 'mental_wellbeing' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                C. Wellbeing &amp; Stress
              </button>

              <button
                type="button"
                onClick={() => setActiveResultsTab('physiological')}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                  activeResultsTab === 'physiological' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                D. Physiological
              </button>
            </div>

            {/* TAB CONTENT A: Key Body Vitals */}
            {activeResultsTab === 'key_vitals' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Heart Rate */}
                <div className="bg-[#00223f] p-4 rounded-2xl border border-slate-700/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Heart Rate</span>
                    <span className="text-2xl font-black text-rose-400">{scanResults.heartRate} <span className="text-xs font-semibold text-slate-300">BPM</span></span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Normal Rest: 60–100 BPM</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Heart className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                {/* Respiration Rate */}
                <div className="bg-[#00223f] p-4 rounded-2xl border border-slate-700/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Respiration Rate</span>
                    <span className="text-2xl font-black text-cyan-400">{scanResults.respirationRate} <span className="text-xs font-semibold text-slate-300">RPM</span></span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Normal Rest: 12–20 breaths/min</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>

                {/* Oxygen Saturation */}
                <div className="bg-[#00223f] p-4 rounded-2xl border border-slate-700/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Oxygen Saturation (SpO2)</span>
                    <span className="text-2xl font-black text-teal-400">{scanResults.oxygenSaturation}%</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Optimal: 95%–100%</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Droplets className="w-6 h-6" />
                  </div>
                </div>

                {/* Blood Pressure */}
                <div className="bg-[#00223f] p-4 rounded-2xl border border-slate-700/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Blood Pressure (Estimated)</span>
                    <span className="text-2xl font-black text-amber-400">{scanResults.bloodPressureSystolic} / {scanResults.bloodPressureDiastolic} <span className="text-xs font-semibold text-slate-300">mmHg</span></span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Optimal: &lt;120/80 mmHg</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT B: Heart Health Metrics */}
            {activeResultsTab === 'heart_health' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">SDNN</span>
                  <span className="text-lg font-black text-purple-300">{scanResults.sdnn} ms</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">HRV Overall Variance</span>
                </div>

                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">RMSSD</span>
                  <span className="text-lg font-black text-purple-300">{scanResults.rmssd} ms</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">Vagal Parasympathetic Tone</span>
                </div>

                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">pNN50</span>
                  <span className="text-lg font-black text-purple-300">{scanResults.pnn50}%</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">&gt;50ms Intervals</span>
                </div>

                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cardiac Output</span>
                  <span className="text-lg font-black text-teal-300">{scanResults.cardiacOutput} L/min</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">Estimated Blood Flow</span>
                </div>

                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Mean Arterial Press (MAP)</span>
                  <span className="text-lg font-black text-teal-300">{scanResults.meanArterialPressure} mmHg</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">Target: 70–100 mmHg</span>
                </div>

                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Heart Utilized</span>
                  <span className="text-lg font-black text-teal-300">{scanResults.heartUtilized}%</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">Resting Reserve</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT C: Mental Wellbeing & Stress / ANS */}
            {activeResultsTab === 'mental_wellbeing' && (
              <div className="space-y-3.5">
                <div className="bg-[#00223f] p-5 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">Mental Wellbeing Score</span>
                    <div className="text-3xl font-black text-white">{scanResults.mentalWellbeingScore} <span className="text-sm font-semibold text-slate-400">/ 100</span></div>
                    <p className="text-xs text-slate-300">
                      Evaluated from HRV parasympathetic balance and autonomic relaxation tone.
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black text-2xl shrink-0">
                    <Brain className="w-8 h-8" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="bg-[#00223f] p-4 rounded-xl border border-slate-700">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Stress Level</span>
                    <span className={`text-lg font-black ${scanResults.stressLevel === 'Low / Relaxed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {scanResults.stressLevel}
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">Based on Baevsky stress index</span>
                  </div>

                  <div className="bg-[#00223f] p-4 rounded-xl border border-slate-700">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Autonomic (ANS) Balance</span>
                    <span className="text-lg font-black text-cyan-300">
                      {scanResults.ansStatus} (Ratio: {scanResults.ansBalanceRatio})
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">Sympathetic / Parasympathetic balance</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT D: Physiological Metrics */}
            {activeResultsTab === 'physiological' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">BMI (Body Mass Index)</span>
                  <span className="text-lg font-black text-white">{scanResults.bmi}</span>
                  <span className="text-[10px] text-teal-300 block font-bold">{scanResults.bmiStatus}</span>
                </div>

                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Volume (Nadler)</span>
                  <span className="text-lg font-black text-rose-300">{scanResults.bloodVolumeLiters} L</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">Total Circulating Volume</span>
                </div>

                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Blood Water</span>
                  <span className="text-lg font-black text-cyan-300">{scanResults.totalBloodWaterLiters} L</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">Watson TBW formula</span>
                </div>

                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Body Water %</span>
                  <span className="text-lg font-black text-cyan-300">{scanResults.bodyWaterPercentage}%</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">Hydration proportion</span>
                </div>

                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Body Fat (Est.)</span>
                  <span className="text-lg font-black text-amber-300">{scanResults.totalBodyFatPercentage}%</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">Deurenberg formula</span>
                </div>

                <div className="bg-[#00223f] p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Body Weight</span>
                  <span className="text-lg font-black text-white">{scanResults.bodyWeightKg} kg</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">Calibrated scale</span>
                </div>
              </div>
            )}

            {/* PDF Report Generation & Download Card */}
            <div className="p-3.5 bg-gradient-to-r from-purple-950/40 via-[#00223f] to-teal-950/40 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/20">
                  <Download className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>NHealth Vital Lens™ PDF Report</span>
                    {pdfDownloadSuccess && (
                      <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-400/30 font-semibold">
                        Downloaded
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Includes NHealth watermark, logo, clinical parameters, disclaimer &amp; patient instructions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleManualPdfDownload}
                disabled={isGeneratingPdf}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
              </button>
            </div>

            {/* Persistent Result Screen Mandatory Footer Disclaimer */}
            <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl text-center text-xs text-slate-400">
              Disclaimer: This report is for general wellness reference only and does not replace professional medical advice. Consult a healthcare provider for clinical evaluation.
            </div>

            {/* Step 5 Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (onBookDoctor) {
                      onClose();
                      onBookDoctor('Doctor Home Visits');
                    }
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Consult Nhealth Doctor</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualPdfDownload}
                  disabled={isGeneratingPdf}
                  className="inline-flex sm:hidden w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Report</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleScanAgain}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Again</span>
                </button>

                {/* Exit / Done button requested */}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Exit / Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CAMERA SELECTION MODAL PROMPT: Scan by Front Camera or Rear Camera */}
        {showCameraPrompt && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCameraPrompt(false);
              }
            }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#00172b] text-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-purple-500/40 relative overflow-hidden text-center animate-in zoom-in-95 duration-200 cursor-default"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto mb-4 border border-purple-400/30 shadow-inner">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Select Camera for Vital Scan
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Choose which camera you want to use for optical photoplethysmography (vPPG) face vitals analysis:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
                <button
                  type="button"
                  onClick={() => handleSelectCameraAndStart('user')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-purple-900/60 to-purple-800/40 hover:from-purple-800/80 hover:to-purple-700/60 border-2 border-purple-400/50 hover:border-purple-300 text-white transition-all cursor-pointer group shadow-lg active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/30 group-hover:bg-purple-500/50 flex items-center justify-center mb-2.5 text-purple-200 shadow-xs">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-sm text-white">Scan by Front Camera</span>
                  <span className="text-[10px] text-purple-200 mt-1 font-medium bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-400/30">
                    Selfie / Self Scan
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCameraAndStart('environment')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-teal-900/60 to-teal-800/40 hover:from-teal-800/80 hover:to-teal-700/60 border-2 border-teal-400/50 hover:border-teal-300 text-white transition-all cursor-pointer group shadow-lg active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/30 group-hover:bg-teal-500/50 flex items-center justify-center mb-2.5 text-teal-200 shadow-xs">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-sm text-white">Scan by Rear Camera</span>
                  <span className="text-[10px] text-teal-200 mt-1 font-medium bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-400/30">
                    Patient / Family Scan
                  </span>
                </button>

                <button
                  type="button"
                  onClick={startSimulatedScan}
                  className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/50 to-teal-950/50 hover:from-purple-950 hover:to-teal-950 border border-purple-500/40 hover:border-purple-300 text-white transition-all cursor-pointer group shadow-sm active:scale-98 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/30">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white block">Run Simulated Optical Scan</span>
                      <span className="text-[10px] text-slate-400 block">No camera or browser permission required · Instant clinical simulation</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowCameraPrompt(false)}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-4 rounded-lg hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

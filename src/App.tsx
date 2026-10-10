import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import {
  validateSignup,
  validateSignin,
  validateForgotPassword,
  type FieldErrors,
} from './utils/validation';
import {
  Search, Bell, Plus,
  Home,
  ChevronDown, Check, Moon, Sun,
  Package, ShoppingBag, Trash2,
  RefreshCw, Settings, LogOut, BarChart2,
  Camera, Upload, WifiOff, AlertTriangle,
  ShieldCheck, Compass,
  ChevronLeft, PanelLeftClose, PanelLeftOpen,
  Menu, X, Edit2, Volume2, VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS, ADMIN_EMAIL, API_BASE_URL } from './config/api';
import ProductsTable from './components/ProductsTable';
import ProductModal from './components/ProductModal';
import SaleModal from './components/SaleModal';
import EditSaleModal from './components/EditSaleModal';
import ExpenseModal from './components/ExpenseModal';
import ExpenseList from './components/ExpenseList';
import MarketReport from './components/MarketReport';
import NotificationsPanel, { buildNotifications } from './components/NotificationsPanel';
import BrandLogo from './components/BrandLogo';
import AlertDialog, { type AlertType } from './components/ui/AlertDialog';
import LegalModal from './components/LegalModal';
import { AdminView } from './components/AdminView';
import InsightPaywall from './components/InsightPaywall';
import { LandingPage } from './components/LandingPage';
import { SupportWidget } from './components/SupportWidget';
import { VoiceGuideButton } from './components/VoiceGuideButton';
import { useAppT, useAppLang, setAppLang, tf, LANGUAGE_CODES, LANGUAGE_META } from './i18n';
import {
  isVoiceGuideEnabled,
  setVoiceGuideEnabled,
  subscribeVoiceGuide,
  cancelSpeech,
  readPage,
  type GuidePage,
} from './voiceGuide';

function GlassmorphicDropdown({ icon: Icon, options, selected, onSelect, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative w-full mb-4 ${isOpen ? 'z-[100]' : 'z-10'}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full relative overflow-hidden bg-card text-foreground px-4 py-3 rounded-xl flex items-center justify-between border border-border/80 shadow-sm transition-all hover:border-white/20"
      >
        <div className="flex items-center gap-3 truncate">
          {Icon && <Icon className="w-4 h-4 text-amber-400 shrink-0" />}
          <span className="font-bold text-sm truncate">
            {selected ? selected.name : placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 4 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 p-1.5 mt-1.5 rounded-xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl z-[100] max-h-60 overflow-y-auto"
          >
            {options.map((opt: any, idx: number) => {
              const isSelected = selected && selected.id === opt.id;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors text-left text-sm font-semibold ${
                    isSelected ? 'bg-[#F5C518] text-black font-extrabold' : 'hover:bg-surface text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="truncate">{opt.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0 text-black" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  // Global App Language (shared with the marketing landing page)
  const T = useAppT();
  const currentLang = useAppLang();

  // Persistent Theme Mode (Dark/Light)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('marketos_theme');
      if (saved !== null) return saved === 'dark';
    } catch (e) {}
    return true; // Default dark mode for marketOS aesthetic
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('marketos_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('marketos_theme', 'light');
    }
  }, [isDarkMode]);

  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'insights' | 'settings' | 'admin' | 'guide'>('home');
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileHeaderMenuOpen, setMobileHeaderMenuOpen] = useState(false);
  const [voiceGuideEnabled, setVoiceGuideEnabledState] = useState<boolean>(() => isVoiceGuideEnabled());
  const [user, setUser] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('marketos_cached_auth_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(() => {
    return !localStorage.getItem('marketos_cached_auth_user');
  });

  const isFounder = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Keep the voice-guide state in sync when toggled from the header, settings or landing page
  useEffect(() => {
    return subscribeVoiceGuide(() => setVoiceGuideEnabledState(isVoiceGuideEnabled()));
  }, []);

  // Voice guide: read the current page out loud in the app language (auto on page entry)
  useEffect(() => {
    if (!voiceGuideEnabled) return;
    let page: GuidePage | null = null;
    if (showLandingPage) {
      page = 'landing';
    } else if (user) {
      page = activeTab as GuidePage;
    }
    if (!page) return;
    const handle = setTimeout(() => readPage(page, currentLang), 650);
    return () => {
      clearTimeout(handle);
      cancelSpeech();
    };
  }, [activeTab, showLandingPage, user, voiceGuideEnabled, currentLang]);

  // Auth Forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [forgotMode, setForgotMode] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | null>(null);

  // Ask the backend to re-validate the payload (server-side validation).
  // Returns an error message if the server rejected it, or null to continue.
  // If the server cannot be reached we fall back to the client validation that
  // already ran, so the app keeps working offline.
  const validateOnServer = useCallback(
    async (
      endpoint: string,
      payload: Record<string, unknown>
    ): Promise<{ message: string; errors?: FieldErrors } | null> => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) return null;
        // Only treat real validation rejections as blocking. A 404 (endpoint
        // not deployed yet) or 5xx (server trouble) must NOT block the user —
        // the client-side validation already ran, so let the flow continue.
        if (res.status === 400 || res.status === 422) {
          const data = await res.json().catch(() => ({}));
          return {
            message: data?.message || data?.error || 'Validation failed. Please check your details.',
            errors: data?.errors,
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const uData = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        };
        localStorage.setItem('marketos_cached_auth_user', JSON.stringify(uData));
        setUser(currentUser);
      } else {
        localStorage.removeItem('marketos_cached_auth_user');
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const friendlyAuthError = (err: any): string => {
    const code = String(err?.code || '');
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account already exists with this email. Try signing in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Your password is too weak. Use at least 8 characters with letters, numbers and a symbol.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        return err?.message || 'Something went wrong. Please try again.';
    }
  };

  const handleAuth = async (e: any) => {
    e.preventDefault();
    if (authBusy) return;
    setAuthError('');
    setAuthNotice('');
    setFieldErrors({});

    // 1) Client-side validation
    const result = isSignUp
      ? validateSignup({ fullName: username, email, password, confirmPassword })
      : validateSignin({ email, password });

    if (!result.valid) {
      setFieldErrors(result.errors);
      setAuthError(result.message);
      return;
    }

    if (isSignUp && !consentAgreed) {
      setAuthError('You must agree to the Terms & Conditions and Privacy Policy (NDPA 2023) to create your account.');
      return;
    }

    setAuthBusy(true);
    try {
      // 2) Server-side validation (source of truth)
      const serverError = await validateOnServer(
        isSignUp ? API_ENDPOINTS.authValidateSignup : API_ENDPOINTS.authValidateSignin,
        isSignUp
          ? { fullName: username.trim(), email: email.trim(), password, confirmPassword }
          : { email: email.trim(), password }
      );
      if (serverError) {
        if (serverError.errors) setFieldErrors(serverError.errors);
        setAuthError(serverError.message);
        return;
      }

      // 3) Firebase authentication
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: username.trim() });
        // Email confirmation: the account cannot be used until the user opens
        // the confirmation link we send to their inbox.
        await sendEmailVerification(cred.user);
        await signOut(auth);
        setAuthNotice(`We've sent a confirmation link to ${email.trim()}. Please open it to confirm your email, then sign in.`);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        setIsSignUp(false);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const isFounderAccount = cred.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (!cred.user.emailVerified && !isFounderAccount) {
          await sendEmailVerification(cred.user).catch(() => {});
          await signOut(auth);
          setAuthError('Your email is not confirmed yet. We just sent you a fresh confirmation link — please confirm your email, then sign in again.');
          return;
        }
      }
    } catch (err: any) {
      setAuthError(friendlyAuthError(err));
      // Dispatch realtime telemetry to admin log
      fetch(`${API_BASE_URL}/api/admin/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: email || 'anonymous',
          status: 401,
          path: isSignUp ? '/auth/signup' : '/auth/login',
          detail: `Auth failure: ${err.message}`
        })
      }).catch(() => {});
    } finally {
      setAuthBusy(false);
    }
  };

  const handleForgotPassword = async (e: any) => {
    e.preventDefault();
    if (authBusy) return;
    setAuthError('');
    setAuthNotice('');
    setFieldErrors({});

    const result = validateForgotPassword({ email });
    if (!result.valid) {
      setFieldErrors(result.errors);
      setAuthError(result.message);
      return;
    }

    setAuthBusy(true);
    try {
      const serverError = await validateOnServer(API_ENDPOINTS.authForgotPassword, { email: email.trim() });
      if (serverError) {
        if (serverError.errors) setFieldErrors(serverError.errors);
        setAuthError(serverError.message);
        return;
      }
      await sendPasswordResetEmail(auth, email.trim());
      setAuthNotice(`If an account exists for ${email.trim()}, a password reset link is on its way. Please check your inbox (and spam) and follow the link to set a new password.`);
    } catch (err: any) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setAuthNotice('');
    setFieldErrors({});
    setForgotMode(false);
    if (isSignUp && !consentAgreed) {
      setAuthError('You must agree to the Terms & Conditions and Privacy Policy (NDPA 2023) to create your account.');
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setAuthError(friendlyAuthError(err));
      fetch(`${API_BASE_URL}/api/admin/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'google-oauth-attempt',
          status: 401,
          path: '/auth/google',
          detail: `Google sign-in error: ${err.message}`
        })
      }).catch(() => {});
    }
  };

  const handleLogout = async () => {
    try {
      if (user?.uid) {
        const ks = getUserStorageKeys(user.uid);
        localStorage.removeItem(ks.p);
        localStorage.removeItem(ks.s);
        localStorage.removeItem(ks.e);
        localStorage.removeItem(ks.deleted);
        localStorage.removeItem(ks.hash);
        localStorage.removeItem(ks.lastSync);
        localStorage.removeItem(ks.tombstones);
      }
      localStorage.removeItem('marketos_products_v2');
      localStorage.removeItem('marketos_sales_v2');
      localStorage.removeItem('marketos_expenses_v2');
      localStorage.removeItem('marketos_deleted_v2');
      localStorage.removeItem('marketos_cached_auth_user');
    } catch {}

    setProducts([]);
    setSales([]);
    setExpenses([]);
    dataRef.current = { products: [], sales: [], expenses: [] };
    syncedHashRef.current = '';
    setLastSyncAt(null);
    setOtherDevicePending([]);
    setDirty(false);

    await signOut(auth);
  };

  // User Profile Avatar & Settings State
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return localStorage.getItem('marketos_user_avatar') || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
  });
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Sells Modal Confirmation states (replacing window.confirm and alert)
  const [deleteSaleConfirm, setDeleteSaleConfirm] = useState<{ id: string; name: string; amount: number } | null>(null);
  const [saleUpdateNotice, setSaleUpdateNotice] = useState<{ isOpen: boolean; message: string } | null>(null);

  // Custom Modal Dialog states (replaces window.alert, window.confirm, window.prompt)
  const [clearDataModalOpen, setClearDataModalOpen] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type?: AlertType;
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  });
  const [imageUrlPromptOpen, setImageUrlPromptOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const AVATAR_PRESETS = [
    { id: 'p1', name: 'Entrepreneur', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'p2', name: 'Professional', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { id: 'p3', name: 'Founder', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 'p4', name: 'Merchant', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { id: 'p5', name: 'Director', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  ];

  useEffect(() => {
    if (!user) return;
    if (user.displayName) setProfileDisplayName(user.displayName);
    // Prefer the avatar stored on this device. The upload and preset flows
    // write to localStorage immediately, while Firebase only receives the photo
    // when the user taps "Update Profile". Trusting user.photoURL first would
    // revert a freshly uploaded picture back to the old one (or the default
    // placeholder) on every refresh.
    const cached = localStorage.getItem('marketos_user_avatar');
    if (cached) {
      setAvatarUrl(cached);
    } else if (user.photoURL) {
      setAvatarUrl(user.photoURL);
      localStorage.setItem('marketos_user_avatar', user.photoURL);
    }
  }, [user]);

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAlertModal({
        isOpen: true,
        title: "Image File Too Large",
        description: "Please select an image smaller than 2MB so your application loads smoothly.",
        type: "warning"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (!reader.result) return;
      const dataUrl = reader.result.toString();
      setIsUploadingAvatar(true);
      try {
        // Upload to Cloudinary through the backend so the API secret never
        // leaves the server. The returned CDN url is saved as the avatar.
        const res = await fetch(API_ENDPOINTS.uploadAvatar, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: dataUrl,
            userId: user?.uid || ''
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.url) {
            setAvatarUrl(data.url);
            localStorage.setItem('marketos_user_avatar', data.url);
            return;
          }
        }
        // Offline / server not configured / failed: keep the local image
        // so the user can still see their new photo on this device.
        setAvatarUrl(dataUrl);
        localStorage.setItem('marketos_user_avatar', dataUrl);
      } catch {
        setAvatarUrl(dataUrl);
        localStorage.setItem('marketos_user_avatar', dataUrl);
      } finally {
        setIsUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    setProfileSuccessMessage('');
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: profileDisplayName.trim(),
          photoURL: avatarUrl
        });
      }
      localStorage.setItem('marketos_user_avatar', avatarUrl);
      setProfileSuccessMessage('Profile and picture updated successfully!');
      setTimeout(() => setProfileSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Reliable per-user localStorage keys helper
  const getUserStorageKeys = (explicitUid?: string) => {
    let uid = explicitUid;
    if (!uid && user?.uid) uid = user.uid;
    if (!uid) {
      try {
        const cached = localStorage.getItem('marketos_cached_auth_user');
        if (cached) uid = JSON.parse(cached)?.uid;
      } catch {}
    }
    const pfx = uid ? `marketos_${uid}` : 'marketos';
    return {
      p: `${pfx}_products_v2`,
      s: `${pfx}_sales_v2`,
      e: `${pfx}_expenses_v2`,
      deleted: `${pfx}_deleted_v2`,
      hash: `${pfx}_synced_hash`,
      lastSync: `${pfx}_last_sync`,
      tombstones: `${pfx}_known_tombstones`
    };
  };

  const getKnownTombstones = (explicitUid?: string): { products: Record<string, any>; sales: Record<string, any>; expenses: Record<string, any> } => {
    try {
      const ks = getUserStorageKeys(explicitUid);
      const raw = localStorage.getItem(ks.tombstones);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { products: {}, sales: {}, expenses: {} };
  };

  const saveKnownTombstones = (tombstones: { products?: Record<string, any>; sales?: Record<string, any>; expenses?: Record<string, any> }, explicitUid?: string) => {
    try {
      const ks = getUserStorageKeys(explicitUid);
      localStorage.setItem(ks.tombstones, JSON.stringify(tombstones));
    } catch {}
  };

  // Inventory / Products State: loaded directly from per-user localStorage
  const [products, setProducts] = useState<any[]>(() => {
    try {
      const ks = getUserStorageKeys();
      const saved = localStorage.getItem(ks.p) || localStorage.getItem('marketos_products_v2');
      if (!saved) return [];
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [productSortBy, setProductSortBy] = useState<'name' | 'price' | 'stock' | 'views'>('name');
  const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedProducts = [...products]
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const valA = a[productSortBy];
      const valB = b[productSortBy];
      if (valA < valB) return productSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return productSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Friendly single control for arranging stock (one choice instead of two)
  const arrangeOptions = [
    { id: 'name-asc', sortBy: 'name', order: 'asc' as const, label: T('stock.arrangeNameAZ') },
    { id: 'name-desc', sortBy: 'name', order: 'desc' as const, label: T('stock.arrangeNameZA') },
    { id: 'price-asc', sortBy: 'price', order: 'asc' as const, label: T('stock.arrangePriceLow') },
    { id: 'price-desc', sortBy: 'price', order: 'desc' as const, label: T('stock.arrangePriceHigh') },
    { id: 'stock-asc', sortBy: 'stock', order: 'asc' as const, label: T('stock.arrangeStockLow') },
  ];
  const arrangeById = (id: string) => arrangeOptions.find(o => o.id === id);
  const currentArrange = arrangeById(`${productSortBy}-${productSortOrder}`) || arrangeOptions[0];

  // Sales Record State: loaded directly from per-user localStorage
  const [sales, setSales] = useState<any[]>(() => {
    try {
      const ks = getUserStorageKeys();
      const saved = localStorage.getItem(ks.s) || localStorage.getItem('marketos_sales_v2');
      if (!saved) return [];
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  // Business Expenses State: loaded directly from per-user localStorage
  const [expenses, setExpenses] = useState<any[]>(() => {
    try {
      const ks = getUserStorageKeys();
      const saved = localStorage.getItem(ks.e) || localStorage.getItem('marketos_expenses_v2');
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // Unified Time Period State for Insights (serves all insight components)
  const [insightTimePeriod, setInsightTimePeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('today');
  const [insightCustomStart, setInsightCustomStart] = useState('');
  const [insightCustomEnd, setInsightCustomEnd] = useState('');

  // Edit Product State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const startEdit = (product: any) => {
    setEditForm({ ...product });
    setIsProductModalOpen(true);
  };
  
  const saveProduct = (savedProduct: any) => {
    if (!savedProduct) return;
    const now = Date.now();
    const withTimestamp = {
      ...savedProduct,
      updatedAt: now,
      updatedByDevice: deviceId
    };
    let updatedProducts: any[];
    if (products.find(p => p.id === savedProduct.id)) {
      updatedProducts = products.map(p => p.id === savedProduct.id ? withTimestamp : p);
    } else {
      updatedProducts = [withTimestamp, ...products];
    }
    setProducts(updatedProducts);
    const ks = dataKeys();
    localStorage.setItem(ks.p, JSON.stringify(updatedProducts));
    dataRef.current = { ...dataRef.current, products: updatedProducts };
    markChanged();
    setIsProductModalOpen(false);
    setEditForm(null);
  };
  
  const deleteProduct = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    const ks = dataKeys();
    localStorage.setItem(ks.p, JSON.stringify(updatedProducts));
    dataRef.current = { ...dataRef.current, products: updatedProducts };
    markDeleted('products', id);
    markChanged();
  };
  
  const addProduct = () => {
    setEditForm({
      id: Date.now().toString(), 
      name: "", 
      category: "General", 
      purchasePrice: 0, 
      quantityPurchased: 0, 
      purchaseUnit: "", 
      fractionConsumed: 0, 
      status: "Active",
      sellingUnits: [{ id: Date.now().toString(), name: "", yieldFromTotal: 0, price: 0 }]
    });
    setIsProductModalOpen(true);
  };

  // ---- Sync & offline engine ----
  // A stable per-browser id so the server can tell which device has pending local data.
  const [deviceId] = useState<string>(() => {
    let d = localStorage.getItem('marketos_device_id');
    if (!d) {
      d = 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('marketos_device_id', d);
    }
    return d;
  });

  const [online, setOnline] = useState<boolean>(() => navigator.onLine !== false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState(false);
  const [otherDevicePending, setOtherDevicePending] = useState<string[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const syncedHashRef = useRef<string>('');

  // Per-user localStorage keys. The legacy global keys are only used to migrate
  // data the first time a user signs in on this browser.
  // Per-user localStorage keys. The legacy global keys are only used to migrate
  // data the first time a user signs in on this browser.
  const dataKeys = () => getUserStorageKeys(user?.uid);
  const deletedCacheKey = () => dataKeys().deleted;
  const syncedHashKey = () => dataKeys().hash;
  const lastSyncKey = () => dataKeys().lastSync;

  // Mirror of current data so the sync loop always sees the latest values.
  const dataRef = useRef({ products, sales, expenses });

  const recentFirst = (arr: any[]) =>
    [...arr].sort((a, b) => {
      const at = Number(a?.updatedAt) || (a?.timestamp ? new Date(a.timestamp).getTime() : 0) || 0;
      const bt = Number(b?.updatedAt) || (b?.timestamp ? new Date(b.timestamp).getTime() : 0) || 0;
      return bt - at;
    });

  // Merge server rows into local newest-wins. Neither device's data is ever lost.
  // Merge server rows into local newest-wins. Neither device's data is ever lost.
  // Items matching tombstones are strictly dropped so deleted items can NEVER be resurrected from another device's local storage.
  const mergeRecords = (
    localArr: any[], 
    remoteArr: any[], 
    tombstonesMap: Record<string, { deletedAt: number; device?: string }> = {}, 
    pendingDeletedIds: Set<string> = new Set()
  ) => {
    const isItemTombstoned = (r: any): boolean => {
      if (!r || r.id == null) return true;
      const rid = String(r.id);
      if (pendingDeletedIds.has(rid)) return true;
      const tomb = tombstonesMap[rid];
      if (tomb && tomb.deletedAt) {
        const itemTime = Number(r.updatedAt) || (r.timestamp ? new Date(r.timestamp).getTime() : 0) || 0;
        if (itemTime <= tomb.deletedAt) {
          return true;
        }
      }
      return false;
    };

    const byId = new Map<string, any>();
    for (const r of (localArr || [])) {
      if (r && r.id != null) {
        const rid = String(r.id);
        if (!isItemTombstoned(r)) {
          byId.set(rid, r);
        }
      }
    }
    const out: any[] = [];
    for (const r of (remoteArr || [])) {
      if (!r || r.id == null) continue;
      const rid = String(r.id);
      if (isItemTombstoned(r)) continue;

      const local = byId.get(rid);
      if (local) byId.delete(rid);
      const rT = Number(r.updatedAt) || (r.timestamp ? new Date(r.timestamp).getTime() : 0) || 0;
      const lT = local ? (Number(local.updatedAt) || (local.timestamp ? new Date(local.timestamp).getTime() : 0) || 0) : 0;
      if (!local) {
        if (!r.deleted) out.push(r); // brand new item recorded on another device
      } else if (r.deleted) {
        if (lT > rT) out.push(local); // our local copy was updated after remote deletion
      } else if (lT >= rT) {
        out.push(local); // local edit/revision wins ties and newer local changes!
      } else {
        out.push(r); // another device has a strictly newer revision
      }
    }
    for (const r of byId.values()) {
      if (!isItemTombstoned(r)) {
        out.push(r);
      }
    }
    return out;
  };

  const notifyPending = () => {
    if (!user) return;
    fetch(API_ENDPOINTS.flagPending, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid, deviceId }),
    }).catch(() => {});
  };

  const clearOwnPending = () => {
    if (!user) return;
    fetch(API_ENDPOINTS.flagClear, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid, deviceId }),
    }).catch(() => {});
  };

  // Remember something deleted locally so it can be removed on every device
  // (tombstone) once we're back online.
  const markDeleted = (kind: 'products' | 'sales' | 'expenses', id: string) => {
    const sId = String(id);
    const now = Date.now();
    try {
      const dk = deletedCacheKey();
      const cache = JSON.parse(localStorage.getItem(dk) || '{"products":[],"sales":[],"expenses":[]}');
      if (sId && !cache[kind].includes(sId)) cache[kind].push(sId);
      localStorage.setItem(dk, JSON.stringify(cache));

      // Also record in known tombstones cache immediately
      const currentTombstones = getKnownTombstones();
      if (!currentTombstones[kind]) currentTombstones[kind] = {};
      currentTombstones[kind][sId] = { deletedAt: now, device: deviceId };
      saveKnownTombstones(currentTombstones);
    } catch {}
    // If online, immediately push tombstones so the database deletes the row permanently
    if (navigator.onLine && user) {
      pushPayload(dataRef.current).catch(() => {});
    }
  };

  // Push everything on this device up. The server merges newest-wins and never
  // wipes rows belonging to other devices.
  const pushPayload = async (data: { products: any[]; sales: any[]; expenses: any[] }) => {
    if (!user) return;
    let deleted = { products: [], sales: [], expenses: [] };
    try { deleted = JSON.parse(localStorage.getItem(deletedCacheKey()) || '{"products":[],"sales":[],"expenses":[]}'); } catch {}
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(API_ENDPOINTS.sync, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ 
        userId: user.uid, 
        userEmail: user.email || '', 
        userName: user.displayName || profileDisplayName || user.email?.split('@')[0] || 'Merchant',
        deviceId, 
        ...data, 
        deleted 
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      fetch(`${API_BASE_URL}/api/admin/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email || user.uid,
          status: res.status,
          path: '/api/sync',
          detail: `Client sync push failed with HTTP ${res.status}`
        })
      }).catch(() => {});
      throw new Error(await res.text());
    }
    const hash = JSON.stringify(data);
    syncedHashRef.current = hash;
    setDirty(false);
    localStorage.setItem(syncedHashKey(), hash);
    localStorage.setItem(deletedCacheKey(), '{"products":[],"sales":[],"expenses":[]}');
    clearOwnPending();
  };

  // One full sync round: push pending local changes/deletions, then pull from server.
  const syncCycle = useCallback(async () => {
    if (!user || !navigator.onLine) {
      setDirty(true);
      setSyncError(true);
      return;
    }
    try {
      // 1. Inspect any pending deletions
      let deletedObj = { products: [], sales: [], expenses: [] };
      try {
        deletedObj = JSON.parse(localStorage.getItem(deletedCacheKey()) || '{"products":[],"sales":[],"expenses":[]}');
      } catch {}

      const hasDeletions = (deletedObj.products?.length || 0) > 0 || (deletedObj.sales?.length || 0) > 0 || (deletedObj.expenses?.length || 0) > 0;
      
      // If we have local deletions or unsaved changes, push them first so database deletes tombstones immediately!
      if (hasDeletions || dirty) {
        try {
          await pushPayload(dataRef.current);
          try {
            deletedObj = JSON.parse(localStorage.getItem(deletedCacheKey()) || '{"products":[],"sales":[],"expenses":[]}');
          } catch {}
        } catch (e) {
          console.warn('Pre-sync push failed, will merge with local tombstones', e);
        }
      }

      const uName = encodeURIComponent(user.displayName || profileDisplayName || user.email?.split('@')[0] || 'Merchant');
      const uEmail = encodeURIComponent(user.email || '');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${API_ENDPOINTS.data}?userId=${encodeURIComponent(user.uid)}&name=${uName}&email=${uEmail}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        fetch(`${API_BASE_URL}/api/admin/telemetry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.email || user.uid,
            status: res.status,
            path: '/api/data',
            detail: `Client pull failed with HTTP ${res.status}`
          })
        }).catch(() => {});
        throw new Error('pull failed');
      }
      const remote = await res.json();
      
      // Merge remote tombstones into our local known tombstones cache
      const localTombstones = getKnownTombstones();
      if (remote.tombstones) {
        for (const type of ['products', 'sales', 'expenses'] as const) {
          const remoteMap = remote.tombstones[type] || {};
          if (!localTombstones[type]) localTombstones[type] = {};
          for (const [id, t] of Object.entries(remoteMap)) {
            const existing = localTombstones[type][id];
            const rT = Number((t as any).deletedAt) || 0;
            if (!existing || (existing.deletedAt || 0) < rT) {
              localTombstones[type][id] = t;
            }
          }
        }
        saveKnownTombstones(localTombstones);
      }

      // CRITICAL: Always pull freshest local state directly from localStorage so offline additions/edits are never overwritten!
      const ks = dataKeys();
      const currentLocalP = JSON.parse(localStorage.getItem(ks.p) || '[]');
      const currentLocalS = JSON.parse(localStorage.getItem(ks.s) || '[]');
      const currentLocalE = JSON.parse(localStorage.getItem(ks.e) || '[]');

      // Pass deleted IDs set to mergeRecords so deleted items are strictly filtered out
      const delP = new Set((deletedObj.products || []).map((x: any) => String(x)));
      const delS = new Set((deletedObj.sales || []).map((x: any) => String(x)));
      const delE = new Set((deletedObj.expenses || []).map((x: any) => String(x)));

      const mergedP = mergeRecords(currentLocalP, remote.products || [], localTombstones.products || {}, delP);
      const mergedS = recentFirst(mergeRecords(currentLocalS, remote.sales || [], localTombstones.sales || {}, delS));
      const mergedE = recentFirst(mergeRecords(currentLocalE, remote.expenses || [], localTombstones.expenses || {}, delE));

      // Persist the combined state immediately to localStorage
      localStorage.setItem(ks.p, JSON.stringify(mergedP));
      localStorage.setItem(ks.s, JSON.stringify(mergedS));
      localStorage.setItem(ks.e, JSON.stringify(mergedE));
      dataRef.current = { products: mergedP, sales: mergedS, expenses: mergedE };

      setProducts(mergedP);
      setSales(mergedS);
      setExpenses(mergedE);

      const deviceIds = (remote.meta?.pendingDeviceIds || []).filter((d: string) => d !== deviceId);
      setOtherDevicePending(deviceIds);

      const ours = { products: mergedP, sales: mergedS, expenses: mergedE };
      const currentHash = JSON.stringify(ours);
      if (currentHash !== syncedHashRef.current) {
        await pushPayload(ours);
      } else {
        setDirty(false);
      }
      setSyncError(false);
      const nowTs = Date.now();
      setLastSyncAt(nowTs);
      localStorage.setItem(lastSyncKey(), String(nowTs));
    } catch {
      setSyncError(true);
      setDirty(true);
    }
  }, [user, deviceId, dirty]);

  const syncCycleRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    syncCycleRef.current = syncCycle;
  }, [syncCycle]);

  // Persist current data per-user whenever state changes
  useEffect(() => {
    if (!user) return;
    const ks = dataKeys();
    localStorage.setItem(ks.p, JSON.stringify(products));
    localStorage.setItem(ks.s, JSON.stringify(sales));
    localStorage.setItem(ks.e, JSON.stringify(expenses));
    dataRef.current = { products, sales, expenses };
    if (JSON.stringify({ products, sales, expenses }) !== syncedHashRef.current) {
      setDirty(true);
    }
  }, [products, sales, expenses, user]);

  // Track browser connectivity and run a sync the moment we come back online.
  useEffect(() => {
    const handleOffline = () => { setOnline(false); setSyncError(true); setDirty(true); };
    const handleOnline = () => { setOnline(true); syncCycleRef.current(); };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Auto sync every 10 seconds while signed in.
  useEffect(() => {
    const iv = setInterval(() => { syncCycleRef.current(); }, 10000);
    return () => clearInterval(iv);
  }, []);

  // On login: migrate legacy data (first time), load this user's records, and
  // immediately pull whatever another device has already saved to the cloud.
  useEffect(() => {
    if (!user) {
      if (authLoading) return; // Do NOT clear if auth is still verifying on page load!
      setOtherDevicePending([]);
      setDirty(false);
      setProducts([]);
      setSales([]);
      setExpenses([]);
      dataRef.current = { products: [], sales: [], expenses: [] };
      return;
    }
    const ks = dataKeys();
    const hasOwn = localStorage.getItem(ks.p) || localStorage.getItem(ks.s) || localStorage.getItem(ks.e);
    if (!hasOwn) {
      const legacyP = localStorage.getItem('marketos_products_v2');
      const legacyS = localStorage.getItem('marketos_sales_v2');
      const legacyE = localStorage.getItem('marketos_expenses_v2');
      if (legacyP) localStorage.setItem(ks.p, legacyP);
      if (legacyS) localStorage.setItem(ks.s, legacyS);
      if (legacyE) localStorage.setItem(ks.e, legacyE);
    }
    const loadedP = JSON.parse(localStorage.getItem(ks.p) || '[]');
    const loadedS = JSON.parse(localStorage.getItem(ks.s) || '[]');
    const loadedE = JSON.parse(localStorage.getItem(ks.e) || '[]');

    // Set dataRef synchronously before triggering syncCycle!
    dataRef.current = { products: loadedP, sales: loadedS, expenses: loadedE };
    setProducts(loadedP);
    setSales(loadedS);
    setExpenses(loadedE);

    const savedHash = localStorage.getItem(syncedHashKey()) || '';
    syncedHashRef.current = savedHash;
    const savedSync = Number(localStorage.getItem(lastSyncKey()) || 0);
    setLastSyncAt(savedSync || null);

    if (navigator.onLine) {
      syncCycleRef.current();
    }
  }, [user, authLoading]);

  const markChanged = () => {
    setDirty(true);
    notifyPending();
  };

  const handleManualSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    setOnline(navigator.onLine !== false);
    await syncCycleRef.current();
    setTimeout(() => setIsSyncing(false), 400);
  };

  // ---- Notifications ----
  const hasNotifications = user ? buildNotifications(products, sales, expenses).length > 0 : false;
  const lastSyncAge = lastSyncAt ? Date.now() - lastSyncAt : Infinity;
  const overdueOffline = lastSyncAge > 2 * 60 * 1000;
  const showOfflineBanner = !online || overdueOffline || syncError;

  // Record Sale Form State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setIsSaleModalOpen(true);
  };

  const handleRecordSale = (sale: any) => {
    const now = Date.now();
    const saleWithTime = {
      ...sale,
      updatedAt: now,
      updatedByDevice: deviceId,
      timestamp: sale.timestamp || new Date().toISOString()
    };
    const updatedSales = [saleWithTime, ...sales];
    setSales(updatedSales);
    const ks = dataKeys();
    localStorage.setItem(ks.s, JSON.stringify(updatedSales));
    dataRef.current = { ...dataRef.current, sales: updatedSales };
    markChanged();
  };

  // Edit and Delete Sale State & Handlers
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);

  const startEditSale = (sale: any) => {
    setEditingSale(sale);
    setIsEditSaleModalOpen(true);
  };

  const handleSaveSale = (sale: any) => {
    if (!sale) return;
    const now = Date.now();
    const saleWithTime = {
      ...sale,
      updatedAt: now,
      updatedByDevice: deviceId,
      timestamp: sale.timestamp || new Date().toISOString()
    };
    const updatedSales = sales.map(s => s.id === sale.id ? saleWithTime : s);
    setSales(updatedSales);
    const ks = dataKeys();
    localStorage.setItem(ks.s, JSON.stringify(updatedSales));
    dataRef.current = { ...dataRef.current, sales: updatedSales };
    markChanged();
    setIsEditSaleModalOpen(false);
    setEditingSale(null);
    setSaleUpdateNotice({
      isOpen: true,
      message: `Sale record for "${sale.productName || 'Product'}" was updated successfully and synced across all your devices.`
    });
  };

  const handleDeleteSale = (id: string) => {
    const updatedSales = sales.filter(s => s.id !== id);
    setSales(updatedSales);
    const ks = dataKeys();
    localStorage.setItem(ks.s, JSON.stringify(updatedSales));
    dataRef.current = { ...dataRef.current, sales: updatedSales };
    markDeleted('sales', id);
    markChanged();
    if (editingSale?.id === id) {
      setIsEditSaleModalOpen(false);
      setEditingSale(null);
    }
  };

  const handleSaveExpense = (expense: any) => {
    const now = Date.now();
    const expenseWithTime = {
      ...expense,
      updatedAt: now,
      updatedByDevice: deviceId,
      date: expense.date || new Date().toISOString()
    };
    let updatedExpenses: any[];
    const exists = expenses.some(e => e.id === expense.id);
    if (exists) {
      updatedExpenses = expenses.map(e => e.id === expense.id ? expenseWithTime : e);
    } else {
      updatedExpenses = [expenseWithTime, ...expenses];
    }
    setExpenses(updatedExpenses);
    const ks = dataKeys();
    localStorage.setItem(ks.e, JSON.stringify(updatedExpenses));
    dataRef.current = { ...dataRef.current, expenses: updatedExpenses };
    markChanged();
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const startEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter(e => e.id !== id);
    setExpenses(updatedExpenses);
    const ks = dataKeys();
    localStorage.setItem(ks.e, JSON.stringify(updatedExpenses));
    dataRef.current = { ...dataRef.current, expenses: updatedExpenses };
    markDeleted('expenses', id);
    markChanged();
    if (editingExpense?.id === id) {
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
    }
  };


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <BrandLogo size="lg" showText={false} />
        <span className="text-xs font-bold text-muted-foreground animate-pulse tracking-wider uppercase">Loading marketOS...</span>
      </div>
    );
  }

  if (!user) {
    if (showLandingPage) {
      return (
        <div className="relative min-h-screen">
          <LandingPage
            currentUserEmail={undefined}
            onLaunchApp={() => setShowLandingPage(false)}
            onOpenLegal={(type) => setLegalModalTab(type)}
          />
          <SupportWidget userEmail={email} />
          <LegalModal 
            isOpen={!!legalModalTab}
            initialTab={legalModalTab || 'privacy'}
            onClose={() => setLegalModalTab(null)}
            onAccept={() => {
              setConsentAgreed(true);
              setLegalModalTab(null);
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-amber-400 selection:text-black">
        {/* Subtle background ambient gold glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#F5C518]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl p-6 sm:p-9 shadow-2xl relative z-10 flex flex-col items-center">
          
          {/* Animated Brand Logo */}
          <div className="mb-4">
            <BrandLogo size="md" />
          </div>

          <button
            type="button"
            onClick={() => setShowLandingPage(true)}
            className="mb-5 text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 transition-all shadow-sm"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{T('auth.newHint')}</span>
          </button>

          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1 text-center tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-xs text-muted-foreground text-center mb-7 font-medium">
            Manage your store, track sales & profit effortlessly
          </p>
          
          {/* Toggle - Sleek Pill Slider */}
          <div className="bg-surface p-1 rounded-full flex w-full max-w-[240px] mb-6 relative border border-border/50">
            <button 
              onClick={() => setIsSignUp(false)} 
              type="button"
              className={`flex-1 py-2 rounded-full text-xs font-extrabold transition-all z-10 ${!isSignUp ? 'text-black' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsSignUp(true)} 
              type="button"
              className={`flex-1 py-2 rounded-full text-xs font-extrabold transition-all z-10 ${isSignUp ? 'text-black' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sign up
            </button>
            <div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#F5C518] rounded-full transition-transform duration-300 ease-out shadow-sm shadow-amber-400/20"
              style={{ transform: isSignUp ? 'translateX(100%)' : 'translateX(0)' }}
            />
          </div>

          {forgotMode ? (
            <form onSubmit={handleForgotPassword} className="w-full flex flex-col gap-4">
              <p className="text-xs text-muted-foreground leading-relaxed -mt-1">
                Enter the email address linked to your account and we&apos;ll send you a secure link to reset your password.
              </p>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{T('auth.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                  placeholder="name@example.com"
                  className="bg-surface border border-border/60 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 font-semibold text-sm transition-all"
                  required
                />
                {fieldErrors.email && <span className="text-[11px] text-rose-400 font-semibold mt-1.5">{fieldErrors.email}</span>}
              </div>

              {authNotice && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-semibold leading-relaxed">
                  {authNotice}
                </div>
              )}

              {authError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-semibold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authBusy}
                className="pill-button w-full bg-[#F5C518] hover:bg-[#EAB308] disabled:opacity-60 text-black font-extrabold py-3.5 rounded-full transition-all shadow-xl shadow-amber-500/20 text-sm active:scale-[0.99]"
              >
                {authBusy ? 'Sending...' : T('auth.sendResetLink')}
              </button>

              <button
                type="button"
                onClick={() => { setForgotMode(false); setAuthError(''); setAuthNotice(''); setFieldErrors({}); }}
                className="text-xs text-muted-foreground hover:text-foreground font-bold py-1"
              >
                {T('auth.backToSignIn')}
              </button>
            </form>
          ) : (
          <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
            
            {isSignUp && (
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{T('auth.fullName')}</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setFieldErrors((p) => ({ ...p, fullName: '' })); }}
                  placeholder="e.g. Ada Okafor"
                  className="bg-surface border border-border/60 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 font-semibold text-sm transition-all"
                  required
                />
                {fieldErrors.fullName && <span className="text-[11px] text-rose-400 font-semibold mt-1.5">{fieldErrors.fullName}</span>}
              </div>
            )}

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{T('auth.email')}</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                placeholder="name@example.com"
                className="bg-surface border border-border/60 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 font-semibold text-sm transition-all"
                required
              />
              {fieldErrors.email && <span className="text-[11px] text-rose-400 font-semibold mt-1.5">{fieldErrors.email}</span>}
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{T('auth.password')}</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                placeholder="••••••••"
                className="bg-surface border border-border/60 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 font-semibold text-sm transition-all"
                required
              />
              {fieldErrors.password && <span className="text-[11px] text-rose-400 font-semibold mt-1.5">{fieldErrors.password}</span>}
            </div>

            {isSignUp && (
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{T('auth.confirmPassword')}</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: '' })); }}
                  placeholder="••••••••"
                  className="bg-surface border border-border/60 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 font-semibold text-sm transition-all"
                  required
                />
                {fieldErrors.confirmPassword && <span className="text-[11px] text-rose-400 font-semibold mt-1.5">{fieldErrors.confirmPassword}</span>}
              </div>
            )}

            {!isSignUp && (
              <button
                type="button"
                onClick={() => { setForgotMode(true); setAuthError(''); setAuthNotice(''); setFieldErrors({}); }}
                className="self-end text-xs font-bold text-amber-400 hover:text-amber-300 -mt-1"
              >
                {T('auth.forgotPassword')}
              </button>
            )}

            {isSignUp && (
              <div className="flex items-start gap-2.5 pt-1 text-left bg-surface/40 p-3 rounded-xl border border-border/50">
                <input 
                  type="checkbox" 
                  id="legal-consent-checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-[#F5C518] focus:ring-[#F5C518] bg-surface accent-[#F5C518] shrink-0 cursor-pointer"
                  required
                />
                <label htmlFor="legal-consent-checkbox" className="text-xs text-muted-foreground select-none leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('terms')}
                    className="text-[#F5C518] hover:underline font-bold inline"
                  >
                    Terms & Conditions
                  </button>
                  {' '}and consent to data processing under the{' '}
                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('privacy')}
                    className="text-[#F5C518] hover:underline font-bold inline"
                  >
                    Privacy Policy
                  </button>
                  {' '}(NDPA 2023).
                </label>
              </div>
            )}

            {authNotice && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-semibold leading-relaxed">
                {authNotice}
              </div>
            )}

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-semibold">
                {authError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={authBusy}
              className="pill-button w-full bg-[#F5C518] hover:bg-[#EAB308] disabled:opacity-60 text-black font-extrabold py-3.5 rounded-full mt-2 transition-all shadow-xl shadow-amber-500/20 text-sm active:scale-[0.99]"
            >
              {authBusy ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
              <div className="relative bg-card px-3 text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold">{T('auth.or')}</div>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleAuth}
              className="pill-button w-full bg-surface hover:bg-surface-hover border border-border/70 hover:border-[#F5C518]/40 text-foreground font-bold py-3 rounded-full flex items-center justify-center gap-2.5 transition-all text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </form>
          )}

          {/* On-page Single-Page Legal Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-border/40 w-full text-center flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <button 
              type="button" 
              onClick={() => setLegalModalTab('terms')}
              className="hover:text-[#F5C518] transition-colors underline-offset-2 hover:underline"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button 
              type="button" 
              onClick={() => setLegalModalTab('privacy')}
              className="hover:text-[#F5C518] transition-colors underline-offset-2 hover:underline"
            >
              Privacy & Consent Policy
            </button>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{T('auth.ndpa')}</span>
          </div>
        </div>

        {/* On-page Single-Page Legal Modal */}
        <LegalModal 
          isOpen={!!legalModalTab}
          initialTab={legalModalTab || 'privacy'}
          onClose={() => setLegalModalTab(null)}
          onAccept={() => {
            setConsentAgreed(true);
            setLegalModalTab(null);
          }}
        />

        {/* Support Desk Floating Button */}
        <SupportWidget userEmail={email} />
      </div>
    );
  }

  const clearAllData = () => {
    setClearDataModalOpen(true);
  };

  const executeClearAllData = () => {
    const now = Date.now();
    const ks = dataKeys();
    const currentTombstones = getKnownTombstones();
    const deletedBatch: { products: string[]; sales: string[]; expenses: string[] } = {
      products: [],
      sales: [],
      expenses: []
    };

    products.forEach((p: any) => {
      const id = String(p.id);
      deletedBatch.products.push(id);
      if (!currentTombstones.products) currentTombstones.products = {};
      currentTombstones.products[id] = { deletedAt: now, device: deviceId };
    });
    sales.forEach((s: any) => {
      const id = String(s.id);
      deletedBatch.sales.push(id);
      if (!currentTombstones.sales) currentTombstones.sales = {};
      currentTombstones.sales[id] = { deletedAt: now, device: deviceId };
    });
    expenses.forEach((e: any) => {
      const id = String(e.id);
      deletedBatch.expenses.push(id);
      if (!currentTombstones.expenses) currentTombstones.expenses = {};
      currentTombstones.expenses[id] = { deletedAt: now, device: deviceId };
    });

    saveKnownTombstones(currentTombstones);
    localStorage.setItem(deletedCacheKey(), JSON.stringify(deletedBatch));

    setProducts([]);
    setSales([]);
    setExpenses([]);
    localStorage.setItem(ks.p, '[]');
    localStorage.setItem(ks.s, '[]');
    localStorage.setItem(ks.e, '[]');
    dataRef.current = { products: [], sales: [], expenses: [] };
    markChanged();
    setClearDataModalOpen(false);

    if (navigator.onLine && user) {
      pushPayload({ products: [], sales: [], expenses: [] }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans transition-colors duration-300">
      
      {/* Sidebar (Desktop) - Toggleable / Collapsible */}
      {(activeTab as any) !== 'guide' && (
        <aside className={`hidden md:flex flex-col min-h-screen bg-card border-r border-border/60 transition-all duration-300 z-40 shrink-0 ${
          isSidebarCollapsed ? 'w-20 px-3 py-6' : 'w-64 px-6 py-8'
        }`}>
        <div className={`mb-8 flex items-center ${isSidebarCollapsed ? 'flex-col gap-4' : 'justify-between'} px-1`}>
          <BrandLogo size={isSidebarCollapsed ? "sm" : "md"} showText={!isSidebarCollapsed} />
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface border border-border/50 hover:border-amber-400/40 transition-colors"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* User profile tile - Clickable to open settings */}
        {!isSidebarCollapsed ? (
          <div 
            onClick={() => setActiveTab('settings')}
            className="bg-surface/70 border border-border/60 hover:border-amber-400/40 rounded-xl p-3 flex items-center gap-3 mb-8 cursor-pointer transition-all group"
            title="Edit Profile"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400/50 shrink-0">
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-sm text-foreground truncate group-hover:text-amber-400 transition-colors">
                {user?.displayName || profileDisplayName || 'Store Owner'}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">{user?.email || ''}</div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setActiveTab('settings')}
            className="mb-8 flex justify-center cursor-pointer group"
            title={`Profile: ${user?.displayName || profileDisplayName || 'Store Owner'}`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400/50 group-hover:border-amber-400 group-hover:scale-105 transition-all">
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('home')}
            className={`pill-button flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-3.5 px-4 py-3'} rounded-xl transition-all font-bold text-sm ${
              activeTab === 'home' 
                ? 'bg-[#F5C518] text-black shadow-md shadow-amber-500/15' 
                : 'text-muted-foreground hover:text-foreground hover:bg-surface'
            }`}
            title="Home"
          >
            <Home className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>{T('nav.home')}</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('products')}
            className={`pill-button flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-3.5 px-4 py-3'} rounded-xl transition-all font-bold text-sm ${
              activeTab === 'products' 
                ? 'bg-[#F5C518] text-black shadow-md shadow-amber-500/15' 
                : 'text-muted-foreground hover:text-foreground hover:bg-surface'
            }`}
            title="My Stock"
          >
            <Package className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>{T('nav.stock')}</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('insights')}
            className={`pill-button flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-3.5 px-4 py-3'} rounded-xl transition-all font-bold text-sm ${
              activeTab === 'insights' 
                ? 'bg-[#F5C518] text-black shadow-md shadow-amber-500/15' 
                : 'text-muted-foreground hover:text-foreground hover:bg-surface'
            }`}
            title="Insights"
          >
            <BarChart2 className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>{T('nav.insights')}</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`pill-button flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-3.5 px-4 py-3'} rounded-xl transition-all font-bold text-sm ${
              activeTab === 'settings' 
                ? 'bg-[#F5C518] text-black shadow-md shadow-amber-500/15' 
                : 'text-muted-foreground hover:text-foreground hover:bg-surface'
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>{T('nav.settings')}</span>}
          </button>

          <button 
            onClick={() => setActiveTab('guide')}
            className={`pill-button flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-3.5 px-4 py-3'} rounded-xl transition-all font-bold text-sm ${
              (activeTab as any) === 'guide' 
                ? 'bg-[#F5C518] text-black shadow-md shadow-amber-500/15' 
                : 'text-muted-foreground hover:text-foreground hover:bg-surface'
            }`}
            title="App Guide"
          >
            <Compass className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>{T('nav.guide')}</span>}
          </button>

          {isFounder && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`pill-button flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} rounded-xl transition-all font-bold text-sm ${
                activeTab === 'admin' 
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20' 
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30'
              }`}
              title="Mission Control (Admin)"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span>{T('nav.admin')}</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  Admin
                </span>
              )}
            </button>
          )}
        </nav>
      </aside>
      )}

      {/* Floating Bottom Nav for Mobile - Strictly 3: Home, Stock, Insights (Always available on Guide tab for easy return) */}
      <nav className={`fixed bottom-4 left-4 right-4 max-w-sm mx-auto bg-card/95 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5 flex items-center justify-between shadow-2xl z-50 ${(activeTab as any) === 'guide' ? 'flex' : 'md:hidden'}`}>
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-all flex-1 ${
            activeTab === 'home' ? 'text-[#F5C518] scale-105 font-black' : 'text-muted-foreground hover:text-foreground font-semibold'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">{T('nav.home')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center gap-1 transition-all flex-1 ${
            activeTab === 'products' ? 'text-[#F5C518] scale-105 font-black' : 'text-muted-foreground hover:text-foreground font-semibold'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px]">{T('nav.stock')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center gap-1 transition-all flex-1 ${
            activeTab === 'insights' ? 'text-[#F5C518] scale-105 font-black' : 'text-muted-foreground hover:text-foreground font-semibold'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px]">{T('nav.insights')}</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 w-full ${(activeTab as any) === 'guide' ? 'max-w-none p-0 overflow-x-clip' : 'max-w-7xl mx-auto pb-28 md:pb-10 overflow-x-hidden'} relative`}>
        
        {/* Main Header & Sync Bar (Hidden when on App Guide to give clean full-screen experience) */}
        {(activeTab as any) !== 'guide' && (
          <>
            <header className="px-4 sm:px-8 py-3.5 sm:py-5 flex items-center justify-between gap-2.5 sm:gap-4 border-b border-border/40 md:border-b-0">
          <div className="md:hidden shrink-0 pr-1 flex items-center gap-2">
            <BrandLogo size="sm" showText={false} />
          </div>

          {/* Desktop Sidebar Quick Toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border/70 hover:border-amber-400/50 text-muted-foreground hover:text-foreground transition-all shrink-0"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-amber-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Desktop Search Input (Hidden on Mobile, accessed via 3-bar dropdown) */}
          <div className="hidden md:flex flex-1 bg-surface border border-border/70 rounded-full h-10 sm:h-11 items-center px-3.5 sm:px-5 gap-2.5 max-w-md shadow-sm min-w-0">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input 
              type="text" 
              placeholder={T('search.placeholder')} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-foreground placeholder:text-muted-foreground font-medium" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-surface text-muted-foreground hover:text-foreground"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 justify-end shrink-0">
            {/* Desktop Sync Button (Hidden on Mobile, accessed via 3-bar dropdown) */}
            <button 
              onClick={handleManualSync} 
              disabled={isSyncing || (!dirty && !syncError && online && lastSyncAt != null)}
              className={`hidden md:flex pill-button items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isSyncing 
                  ? 'border border-border bg-surface opacity-50 cursor-not-allowed' 
                  : (dirty || syncError || !online)
                    ? 'bg-[#F5C518] text-black shadow-md shadow-amber-500/20'
                    : 'border border-border bg-surface text-muted-foreground cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : (dirty || syncError || !online) ? 'text-black/70' : ''}`} />
              <span>
                {isSyncing 
                    ? T('sync.saving') 
                    : (dirty || syncError || !online) 
                      ? T('sync.saveOnline') 
                      : T('sync.saved')}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${(dirty || syncError || !online) ? 'bg-black/50' : 'bg-emerald-400'}`} />
            </button>
            
            <VoiceGuideButton page={(activeTab as GuidePage)} />

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface hover:bg-surface-hover border border-border/80 flex items-center justify-center transition-colors text-foreground"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button 
              onClick={() => setNotificationsOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface hover:bg-surface-hover border border-border/80 flex items-center justify-center transition-colors text-foreground relative"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {hasNotifications && (
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full ring-2 ring-card"></span>
              )}
            </button>
            
            <div 
              onClick={() => setActiveTab('settings')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-amber-400/60 hover:border-amber-400 transition-all shrink-0 cursor-pointer hover:scale-105"
              title="Edit Profile"
            >
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>

            {/* Mobile 3-Bar Toggle Dropdown Button */}
            <button
              onClick={() => setMobileHeaderMenuOpen(!mobileHeaderMenuOpen)}
              className={`md:hidden w-9 h-9 rounded-xl border flex items-center justify-center transition-all relative ${
                mobileHeaderMenuOpen
                  ? 'bg-[#F5C518] text-black border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-surface hover:bg-surface-hover border-border/80 text-foreground'
              }`}
              title="Toggle search and cloud sync"
              aria-label="Toggle navigation options"
            >
              {mobileHeaderMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              {(searchQuery || dirty || syncError || !online) && !mobileHeaderMenuOpen && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-card" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Toggled Dropdown: Search & Cloud Sync Panel */}
        <AnimatePresence>
          {mobileHeaderMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden px-4 pb-4 pt-2 border-b border-border/70 bg-card/95 backdrop-blur-xl shadow-lg flex flex-col gap-3 overflow-hidden"
            >
              {/* Search stock input */}
              <div className="w-full bg-surface border border-border/80 rounded-xl h-11 flex items-center px-3.5 gap-2.5 shadow-inner">
                <Search className="w-4 h-4 text-amber-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder={T('search.placeholder')} 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-foreground placeholder:text-muted-foreground font-medium" 
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full hover:bg-surface text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Cloud sync status & manual sync button */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface/70 border border-border/70">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${!online ? 'bg-rose-500' : (dirty || syncError) ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {!online ? T('status.offline') : (dirty || syncError) ? T('status.unsaved') : T('status.active')}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {lastSyncAt ? `Last saved ${new Date(lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : T('status.localOnly')}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleManualSync} 
                  disabled={isSyncing || (!dirty && !syncError && online && lastSyncAt != null)}
                  className={`pill-button flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    isSyncing 
                      ? 'border border-border bg-surface opacity-50 cursor-not-allowed' 
                      : (dirty || syncError || !online)
                        ? 'bg-[#F5C518] text-black shadow-md shadow-amber-500/20'
                        : 'border border-border bg-surface text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : (dirty || syncError || !online) ? 'text-black/70' : ''}`} />
                  <span>
                    {isSyncing 
                      ? T('sync.saving') 
                      : (dirty || syncError || !online) 
                        ? T('sync.saveOnline') 
                        : T('sync.saved')}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${(dirty || syncError || !online) ? 'bg-black/50' : 'bg-emerald-400'}`} />
                </button>
              </div>

              {/* Mobile Navigation Shortcuts for Settings, Guide, and Admin */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => { setActiveTab('settings'); setMobileHeaderMenuOpen(false); }}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-xs font-bold ${
                    activeTab === 'settings'
                      ? 'bg-[#F5C518] text-black border-amber-400 font-extrabold shadow-sm'
                      : 'bg-surface/70 hover:bg-surface border-border/70 text-foreground'
                  }`}
                >
                  <Settings className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{T('nav.settings')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('guide'); setMobileHeaderMenuOpen(false); }}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-xs font-bold ${
                    (activeTab as any) === 'guide'
                      ? 'bg-[#F5C518] text-black border-amber-400 font-extrabold shadow-sm'
                      : 'bg-surface/70 hover:bg-surface border-border/70 text-foreground'
                  }`}
                >
                  <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{T('nav.guide')}</span>
                </button>

                {isFounder && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('admin'); setMobileHeaderMenuOpen(false); }}
                    className={`col-span-2 flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs font-bold ${
                      activeTab === 'admin'
                        ? 'bg-amber-400 text-black border-amber-500 font-extrabold shadow-sm'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Mission Control (Admin)</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 font-mono">
                      FOUNDER
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offline / needs-sync banner */}
        {showOfflineBanner && (
          <div className="px-4 sm:px-8 pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl px-4 sm:px-5 py-3 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                {!online ? <WifiOff className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                <div className="min-w-0">
                  <div className="text-xs font-extrabold">
                    {!online 
                      ? T('banner.offlineTitle') 
                      : syncError 
                        ? T('banner.cloudTitle') 
                        : T('banner.staleTitle')}
                  </div>
                  <div className="text-[11px] font-medium opacity-90 mt-0.5 leading-relaxed">
                    {T('banner.body')}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleManualSync}
                className="pill-button shrink-0 inline-flex items-center gap-2 bg-[#F5C518] text-black px-4 py-2 rounded-full text-xs font-extrabold transition-all shadow-md shadow-amber-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? T('sync.syncing') : T('sync.retry')}
              </button>
            </div>
          </div>
        )}
          </>
        )}

        <div className={(activeTab as any) === 'guide' ? 'p-0' : 'px-3 sm:px-5 xl:px-8 py-2'}>
          
          {activeTab === 'home' && (
            <div className="flex flex-col gap-6 max-w-4xl mx-auto">

              {/* Friendly Greeting so the page is easy to understand at a glance */}
              <div className="pt-1 sm:pt-2 px-3 sm:px-0">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{T('title.home')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{T('home.greeting')}</p>
              </div>

              {/* Quick Sell Register - bright yellow so it stands out as the main action */}
              <div className="bg-gradient-to-br from-[#FDE68A] via-[#FCD34D] to-[#FBBF24] -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full rounded-none sm:rounded-2xl p-4 sm:p-6 border-y sm:border border-amber-400/70 shadow-lg shadow-amber-500/20 relative flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-amber-950 text-lg sm:text-xl tracking-tight">{T('home.quickSell')}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/10 text-amber-950 border border-amber-900/20 shrink-0">
                        {T('home.tapToRecord')}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/80 mt-0.5">{T('home.quickSellSubtitle')}</p>
                  </div>

                  {products.length > 0 && (
                    <div className="text-xs text-amber-900 font-bold">
                      {products.length} {T(products.length === 1 ? 'home.itemInStock' : 'home.itemsInStock')}
                    </div>
                  )}
                </div>
                
                {products.length === 0 ? (
                  <div className="py-12 text-center text-xs text-amber-900 bg-white/70 rounded-xl border border-dashed border-amber-900/25 flex flex-col items-center justify-center gap-3">
                    <Package className="w-8 h-8 text-amber-900/60" />
                    <div>
                      <p className="font-bold text-amber-950 text-sm">{T('home.noStock')}</p>
                      <p className="text-amber-900/80 mt-0.5">{T('home.goToStock')}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="pill-button mt-1 px-4 py-2 bg-[#F5C518] text-black font-extrabold text-xs rounded-xl shadow-sm"
                    >
                      {T('home.goToStockBtn')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-0.5">
                    {products.map(product => {
                      const displayPrice = product.sellingUnits?.length > 0 ? product.sellingUnits[0].price : product.purchasePrice || 0;
                      const unitName = product.sellingUnits?.length > 0 ? product.sellingUnits[0].name : product.purchaseUnit || 'Unit';
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className="pill-button bg-white/85 hover:bg-white border border-amber-900/10 hover:border-amber-900/30 p-4 rounded-2xl flex items-center justify-between gap-3 text-left transition-all group w-full shadow-sm min-w-0"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0 pr-1">
                            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 border border-amber-900/20 flex items-center justify-center shrink-0">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm sm:text-base font-extrabold text-amber-950 leading-tight group-hover:text-amber-800 transition-colors truncate">
                                {product.name}
                              </div>
                              <div className="text-xs text-amber-900/70 font-semibold mt-0.5 truncate">
                                • {unitName}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-amber-50 bg-amber-950 px-3 py-1.5 rounded-xl border border-amber-900/10 whitespace-nowrap inline-block">
                              ₦{displayPrice.toLocaleString()}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {isSaleModalOpen && (
                  <SaleModal 
                    isOpen={isSaleModalOpen}
                    product={selectedProduct}
                    sales={sales}
                    onClose={() => setIsSaleModalOpen(false)}
                    onRecordSale={handleRecordSale}
                  />
                )}
              </div>

              {/* Recent Quick Sells - Mistaken Entry Management (Edit & Delete) */}
              <div className="bg-card -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full rounded-none sm:rounded-2xl p-4 sm:p-6 border-y sm:border border-border/50 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-foreground text-base sm:text-lg tracking-tight">{T('home.recentQuickSells')}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{T('home.recentQuickSellsSub')}</p>
                  </div>
                  {sales.length > 0 && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      {sales.length} Total {sales.length === 1 ? 'Sale' : 'Sales'}
                    </span>
                  )}
                </div>

                {sales.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground bg-surface/30 rounded-xl border border-dashed border-border/50">
                    {T('home.noSalesYet')}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {sales.slice(0, 10).map((sale) => (
                      <div
                        key={sale.id}
                        className="flex justify-between items-center p-3 rounded-xl bg-surface/40 hover:bg-surface border border-border/50 hover:border-border transition-all min-w-0 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-foreground text-xs sm:text-sm truncate flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span>{tf(currentLang, 'sale.soldName', sale.productName || 'Product')}</span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground">
                                {sale.quantitySold || 1} {sale.unitName || 'Unit'}
                              </span>
                              {sale.updatedByDevice ? (
                                sale.updatedByDevice === deviceId ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    {T('sale.thisDevice')}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                    {T('sale.anotherDevice')}
                                  </span>
                                )
                              ) : null}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {sale.timestamp ? new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : T('sale.recently')}
                              {sale.sellingPricePerUnit ? ` · ₦${sale.sellingPricePerUnit.toLocaleString()} each` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                          <div className="font-black text-sm sm:text-base text-emerald-400">
                            +₦{(sale.totalRevenue || sale.amount || 0).toLocaleString()}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditSale(sale)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-surface border border-border/50 hover:border-amber-400/40 transition-colors"
                              title="Edit Sale Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteSaleConfirm({
                                  id: sale.id,
                                  name: sale.productName || 'Product',
                                  amount: sale.totalRevenue || sale.amount || 0
                                });
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-surface border border-border/50 hover:border-rose-400/40 transition-colors"
                              title={T('edit.deleteTitle')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Business Expenses Component */}
              <ExpenseList 
                expenses={expenses}
                deviceId={deviceId}
                onEdit={startEditExpense}
                onDelete={handleDeleteExpense}
                onAdd={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
              />

            </div>
          )}

          {activeTab === 'products' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">{T('title.products')}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {T('products.subtitle')}
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-500 border border-amber-400/25 font-bold">
                      {products.length} {T(products.length === 1 ? 'home.itemInStock' : 'home.itemsInStock')}
                    </span>
                  </p>
                </div>
                <button 
                  onClick={addProduct} 
                  className="pill-button bg-[#F5C518] hover:bg-[#EAB308] text-black font-extrabold py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {T('products.add')}
                </button>
              </div>

              {/* One simple arrange control */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                <div className="md:col-span-2 md:max-w-md">
                  <GlassmorphicDropdown
                    icon={Package}
                    placeholder={T('stock.arrangeBy')}
                    options={arrangeOptions.map(o => ({ id: o.id, name: o.label }))}
                    selected={{ id: currentArrange.id, name: currentArrange.label }}
                    onSelect={(opt: any) => {
                      const chosen = arrangeById(opt.id);
                      if (chosen) {
                        setProductSortBy(chosen.sortBy as any);
                        setProductSortOrder(chosen.order);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Products Table */}
              <ProductsTable 
                products={filteredAndSortedProducts} 
                sales={sales}
                onEdit={startEdit} 
                onDelete={deleteProduct} 
                onAdd={addProduct}
              />

              {/* Add / Edit Product Modal */}
              <ProductModal 
                isOpen={isProductModalOpen}
                initialData={editForm}
                onClose={() => setIsProductModalOpen(false)}
                onSave={saveProduct}
              />

            </div>
          )}
        </div>

        {activeTab === 'insights' && (
          <InsightPaywall user={user} isFounder={isFounder}>
            <div className="px-3 sm:px-5 xl:px-8 py-2 flex flex-col gap-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* One Simple Market Report */}
              <MarketReport 
                sales={sales} 
                expenses={expenses} 
                products={products}
                timePeriod={insightTimePeriod}
                setTimePeriod={setInsightTimePeriod}
                customStart={insightCustomStart}
                setCustomStart={setInsightCustomStart}
                customEnd={insightCustomEnd}
                setCustomEnd={setInsightCustomEnd}
              />
            </div>
          </InsightPaywall>
        )}

        {activeTab === 'settings' && (
          <div className="px-4 sm:px-8 py-2 max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">{T('title.settings')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{T('settings.subtitle')}</p>
            </div>
            
            {/* Profile Details & Photo Editor */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-foreground tracking-tight mb-1">{T('settings.profileTitle')}</h3>
                <p className="text-xs text-muted-foreground">{T('settings.profileDesc')}</p>
              </div>

              {/* Profile Picture Upload & Presets */}
              <div className="p-4 sm:p-5 rounded-xl bg-surface/40 border border-border/60 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative shrink-0 group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-md relative">
                    <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-[#F5C518] text-black rounded-full flex items-center justify-center shadow-lg border border-black/20 hover:scale-105 transition-transform disabled:opacity-60"
                    title="Upload Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarFileUpload} 
                    className="hidden" 
                  />
                </div>

                <div className="flex-1 w-full text-center sm:text-left space-y-3">
                  <div>
                    <div className="text-xs font-bold text-foreground mb-1">Profile Photo</div>
                    <div className="text-[11px] text-muted-foreground">Upload your own photo or pick a curated business avatar below</div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="pill-button inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface hover:bg-surface-hover border border-border text-foreground text-xs font-bold transition-all shadow-sm disabled:opacity-60"
                    >
                      {isUploadingAvatar ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3 text-amber-400" />
                          Upload Photo
                        </>
                      )}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setTempImageUrl(avatarUrl.startsWith('data:') ? '' : avatarUrl);
                        setImageUrlPromptOpen(true);
                      }}
                      className="pill-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-hover border border-border text-muted-foreground hover:text-foreground text-xs font-semibold transition-all"
                    >
                      Paste Image Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Avatar Presets Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2.5 text-muted-foreground">
                  Quick Avatar Presets
                </label>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map(preset => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(preset.url);
                          localStorage.setItem('marketos_user_avatar', preset.url);
                        }}
                        className={`relative w-12 h-12 rounded-full overflow-hidden transition-all shrink-0 border-2 ${
                          isSelected 
                            ? 'border-[#F5C518] scale-105 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/30' 
                            : 'border-border/60 opacity-60 hover:opacity-100 hover:border-white/40'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Email</label>
                  <input 
                    type="email" 
                    disabled 
                    value={user?.email || ''} 
                    className="w-full bg-surface border border-border/80 rounded-xl px-4 py-3 text-muted-foreground cursor-not-allowed text-sm font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Display Name</label>
                  <input 
                    type="text" 
                    value={profileDisplayName} 
                    onChange={(e) => setProfileDisplayName(e.target.value)}
                    className="w-full bg-surface border border-border/80 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-amber-400 text-sm font-bold transition-colors" 
                    placeholder="Your Name or Store Name" 
                  />
                </div>

                {profileSuccessMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {profileSuccessMessage}
                  </div>
                )}

                <button 
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isUpdatingProfile}
                  className="pill-button w-full bg-[#F5C518] hover:bg-[#EAB308] text-black rounded-full py-3.5 font-extrabold text-sm transition-all shadow-md shadow-amber-500/15 flex items-center justify-center gap-2"
                >
                  {isUpdatingProfile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    'Save Profile Changes'
                  )}
                </button>
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-7 shadow-sm">
              <h3 className="text-base font-extrabold mb-1 text-foreground tracking-tight">{T('settings.appearance')}</h3>
              <p className="text-xs text-muted-foreground mb-4">{T('settings.themeDesc')}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsDarkMode(false)}
                  className={`p-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-extrabold transition-all ${
                    !isDarkMode
                      ? 'border-amber-400 bg-amber-400/10 text-amber-500 shadow-sm ring-1 ring-amber-400/30'
                      : 'border-border/80 bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  {T('settings.lightMode')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDarkMode(true)}
                  className={`p-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-extrabold transition-all ${
                    isDarkMode
                      ? 'border-amber-400 bg-amber-400/10 text-amber-400 shadow-sm ring-1 ring-amber-400/30'
                      : 'border-border/80 bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  {T('settings.darkMode')}
                </button>
              </div>
            </div>


            {/* Language / Multi-Dialect Settings - applies across the whole app including the marketing page */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-7 shadow-sm">
              <h3 className="text-base font-extrabold mb-1 text-foreground tracking-tight">{T('settings.languageTitle')}</h3>
              <p className="text-xs text-muted-foreground mb-4">{T('settings.languageDesc')}</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_CODES.map((langKey) => {
                  const langObj = LANGUAGE_META[langKey];
                  const isActive = currentLang === langKey;
                  return (
                    <button
                      key={langKey}
                      type="button"
                      onClick={() => setAppLang(langKey)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                        isActive
                          ? 'bg-[#F5C518] text-black border-amber-300 font-black'
                          : 'border-border/80 bg-surface text-muted-foreground hover:text-foreground hover:border-amber-500/50'
                      }`}
                    >
                      <span>{langObj.flag}</span>
                      <span>{langObj.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice Explanation Settings */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-foreground tracking-tight">{T('voice.title')}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{T('voice.desc')}</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVoiceGuideEnabled(true)}
                  className={`p-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-extrabold transition-all ${
                    voiceGuideEnabled
                      ? 'border-amber-400 bg-amber-400/10 text-amber-500 shadow-sm ring-1 ring-amber-400/30'
                      : 'border-border/80 bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  {T('voice.on')}
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceGuideEnabled(false)}
                  className={`p-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-extrabold transition-all ${
                    !voiceGuideEnabled
                      ? 'border-amber-400 bg-amber-400/10 text-amber-500 shadow-sm ring-1 ring-amber-400/30'
                      : 'border-border/80 bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  <VolumeX className="w-4 h-4" />
                  {T('voice.off')}
                </button>
              </div>
            </div>

            {/* Founder Admin Mission Control Shortcut */}
            {isFounder && (
              <div className="bg-card border border-amber-500/30 rounded-2xl p-5 sm:p-7 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-extrabold text-foreground tracking-tight">Founder Mission Control</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Clearance authorized for <span className="text-amber-400 font-mono">{ADMIN_EMAIL}</span>. Monitor live server interactions (200, 401, 500), detect customer issues in real-time, and resolve complaints.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className="pill-button w-full sm:w-auto px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/15 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Launch Admin Telemetry Portal</span>
                </button>
              </div>
            )}

            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-7 shadow-sm">
              <h3 className="text-base font-extrabold mb-3 text-rose-400 tracking-tight">{T('settings.dangerZone')}</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={clearAllData} 
                  className="pill-button flex-1 flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 rounded-full px-5 py-3 font-bold text-xs sm:text-sm transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  {T('settings.clearAllData')}
                </button>
                <button 
                  onClick={handleLogout} 
                  className="pill-button flex-1 flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border/80 text-foreground rounded-full px-5 py-3 font-bold text-xs sm:text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {T('action.signout')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Founder Admin Portal View */}
        {activeTab === 'admin' && (
          <div className="px-4 sm:px-8 py-4 animate-in fade-in duration-200">
            <AdminView
              currentUserEmail={user?.email}
              onBackToApp={() => setActiveTab('home')}
            />
          </div>
        )}

        {/* Logged-in App Guide View - Full-screen with floating bottom nav bar */}
        {(activeTab as any) === 'guide' && (
          <div className="relative min-h-screen bg-background pb-24">
            <LandingPage
              currentUserEmail={user?.email}
              onLaunchApp={() => setActiveTab('home')}
              onOpenAdmin={() => setActiveTab('admin')}
              onOpenLegal={(type) => setLegalModalTab(type)}
            />
          </div>
        )}

        {/* Global Sale & Expense Edit Modals */}
        <EditSaleModal
          isOpen={isEditSaleModalOpen}
          sale={editingSale}
          onClose={() => {
            setIsEditSaleModalOpen(false);
            setEditingSale(null);
          }}
          onSave={handleSaveSale}
          onDelete={handleDeleteSale}
        />

        <ExpenseModal 
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSave={handleSaveExpense}
          initialExpense={editingExpense}
        />

        {/* AlertDialog Modals replacing all native browser dialogs */}
        <NotificationsPanel
          isOpen={notificationsOpen}
          products={products}
          sales={sales}
          expenses={expenses}
          otherDevicePending={otherDevicePending}
          onClose={() => setNotificationsOpen(false)}
          onRetrySync={handleManualSync}
        />

        <AlertDialog
          isOpen={clearDataModalOpen}
          title={T('confirm.resetTitle')}
          description={T('confirm.resetDesc')}
          type="danger"
          confirmText={T('confirm.yesClear')}
          cancelText={T('action.cancel')}
          onConfirm={executeClearAllData}
          onCancel={() => setClearDataModalOpen(false)}
        />

        <AlertDialog
          isOpen={alertModal.isOpen}
          title={alertModal.title}
          description={alertModal.description}
          type={alertModal.type}
          confirmText={T('confirm.understood')}
          isConfirmOnly={true}
          onConfirm={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        />

        <AlertDialog
          isOpen={imageUrlPromptOpen}
          title={T('confirm.imageUrlTitle')}
          description={T('confirm.imageUrlDesc')}
          type="info"
          confirmText={T('confirm.savePicture')}
          cancelText={T('action.cancel')}
          promptInput={{
            value: tempImageUrl,
            placeholder: 'https://example.com/avatar.jpg',
            onChange: (val) => setTempImageUrl(val)
          }}
          onConfirm={() => {
            if (tempImageUrl.trim()) {
              setAvatarUrl(tempImageUrl.trim());
              localStorage.setItem('marketos_user_avatar', tempImageUrl.trim());
            }
            setImageUrlPromptOpen(false);
          }}
          onCancel={() => setImageUrlPromptOpen(false)}
        />

        <AlertDialog
          isOpen={!!deleteSaleConfirm}
          title={T('edit.deleteTitle')}
          description={tf(currentLang, 'confirm.deleteSaleDesc', deleteSaleConfirm?.name || 'Product', (deleteSaleConfirm?.amount || 0).toLocaleString())}
          type="danger"
          confirmText={T('confirm.yesDeleteSale')}
          cancelText={T('action.cancel')}
          onConfirm={() => {
            if (deleteSaleConfirm) {
              handleDeleteSale(deleteSaleConfirm.id);
              setDeleteSaleConfirm(null);
            }
          }}
          onCancel={() => setDeleteSaleConfirm(null)}
        />

        <AlertDialog
          isOpen={!!saleUpdateNotice?.isOpen}
          title={T('confirm.saleUpdatedTitle')}
          description={saleUpdateNotice?.message || T('confirm.saleUpdatedMsg')}
          type="success"
          confirmText={T('confirm.done')}
          isConfirmOnly={true}
          onConfirm={() => setSaleUpdateNotice(null)}
        />

      </main>

      {/* Global Bottom-Right Floating Support & Complaint Widget */}
      <SupportWidget userEmail={user?.email} userId={user?.uid} />
    </div>
  );
}

export default App;

import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import { 
  Search, Bell, Plus, 
  Home, 
  ChevronDown, Check, Moon, Sun,
  Package, ShoppingBag, Trash2,
  RefreshCw, Settings, LogOut, BarChart2,
  Camera, Upload, WifiOff, AlertTriangle,
  ShieldCheck, Compass,
  ChevronLeft, PanelLeftClose, PanelLeftOpen,
  Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS, ADMIN_EMAIL, API_BASE_URL } from './config/api';
import ProductsTable from './components/ProductsTable';
import ProductModal from './components/ProductModal';
import SaleModal from './components/SaleModal';
import ExpenseModal from './components/ExpenseModal';
import ExpenseList from './components/ExpenseList';
import DashboardView from './components/DashboardView';
import InsightsView from './components/InsightsView';
import ProductAnalysis from './components/ProductAnalysis';
import NotificationsPanel, { buildNotifications } from './components/NotificationsPanel';
import BrandLogo from './components/BrandLogo';
import AlertDialog, { type AlertType } from './components/ui/AlertDialog';
import LegalModal from './components/LegalModal';
import { AdminView } from './components/AdminView';
import { LandingPage } from './components/LandingPage';
import { SupportWidget } from './components/SupportWidget';

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
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isFounder = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Auth Forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    if (isSignUp && !consentAgreed) {
      setAuthError('You must agree to the Terms & Conditions and Privacy Policy (NDPA 2023) to create your account.');
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: username });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
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
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    if (isSignUp && !consentAgreed) {
      setAuthError('You must agree to the Terms & Conditions and Privacy Policy (NDPA 2023) to create your account.');
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setAuthError(err.message);
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

  const AVATAR_PRESETS = [
    { id: 'p1', name: 'Entrepreneur', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'p2', name: 'Professional', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { id: 'p3', name: 'Founder', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 'p4', name: 'Merchant', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { id: 'p5', name: 'Director', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  ];

  useEffect(() => {
    if (user) {
      if (user.displayName) setProfileDisplayName(user.displayName);
      if (user.photoURL) {
        setAvatarUrl(user.photoURL);
        localStorage.setItem('marketos_user_avatar', user.photoURL);
      } else {
        const cached = localStorage.getItem('marketos_user_avatar');
        if (cached) setAvatarUrl(cached);
      }
    }
  }, [user]);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      reader.onloadend = () => {
        if (reader.result) {
          const res = reader.result.toString();
          setAvatarUrl(res);
        }
      };
      reader.readAsDataURL(file);
    }
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

  // Inventory / Products State
  const [products, setProducts] = useState<any[]>(() => {
    const saved = localStorage.getItem('marketos_products_v2');
    if (!saved) return [];
    // Stock and profit are derived live from money made vs cost, so products are
    // stored as-is (no repair needed).
    return JSON.parse(saved);
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

  // Sales Record State
  const [sales, setSales] = useState<any[]>(() => {
    const saved = localStorage.getItem('marketos_sales_v2');
    if (!saved) return [];
    // Sales only record money received; profit is derived live from each
    // product's purchase cost, so no per-sale cost repair is needed here.
    return JSON.parse(saved);
  });

  // Business Expenses State
  const [expenses, setExpenses] = useState<any[]>(() => {
    const saved = localStorage.getItem('marketos_expenses_v2');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // Edit Product State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const startEdit = (product: any) => {
    setEditForm({ ...product });
    setIsProductModalOpen(true);
  };
  
  const saveProduct = (savedProduct: any) => {
    if (!savedProduct) return;
    if (products.find(p => p.id === savedProduct.id)) {
      setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
    } else {
      setProducts([savedProduct, ...products]);
    }
    markChanged();
    setIsProductModalOpen(false);
    setEditForm(null);
  };
  
  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    markDeleted('products', id);
    markChanged();
  };
  
  const addProduct = () => {
    setEditForm({
      id: Date.now().toString(), 
      name: "", 
      category: "General", 
      purchasePrice: 0, 
      quantityPurchased: 1, 
      purchaseUnit: "Units", 
      fractionConsumed: 0, 
      status: "Active",
      sellingUnits: [{ id: Date.now().toString(), name: "Piece", yieldFromTotal: 1, price: 0 }]
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
  const dataKeys = () => {
    const pfx = user ? `marketos_${user.uid}` : 'marketos';
    return { p: `${pfx}_products_v2`, s: `${pfx}_sales_v2`, e: `${pfx}_expenses_v2` };
  };
  const deletedCacheKey = () => (user ? `marketos_${user.uid}_deleted_v2` : 'marketos_deleted_v2');
  const syncedHashKey = () => (user ? `marketos_synced_hash_${user.uid}` : 'marketos_synced_hash');
  const lastSyncKey = () => (user ? `marketos_last_sync_${user.uid}` : 'marketos_last_sync');

  // Mirror of current data so the sync loop always sees the latest values.
  const dataRef = useRef({ products, sales, expenses });

  const recentFirst = (arr: any[]) =>
    [...arr].sort((a, b) => {
      const at = Number(a?.updatedAt) || (a?.timestamp ? new Date(a.timestamp).getTime() : 0) || 0;
      const bt = Number(b?.updatedAt) || (b?.timestamp ? new Date(b.timestamp).getTime() : 0) || 0;
      return bt - at;
    });

  // Merge server rows into local newest-wins. Neither device's data is ever lost.
  const mergeRecords = (localArr: any[], remoteArr: any[]) => {
    const byId = new Map<string, any>();
    for (const r of localArr) if (r && r.id != null) byId.set(String(r.id), r);
    const out: any[] = [];
    for (const r of remoteArr) {
      if (!r || r.id == null) continue;
      const rid = String(r.id);
      const local = byId.get(rid);
      if (local) byId.delete(rid);
      const rT = Number(r.updatedAt) || (r.timestamp ? new Date(r.timestamp).getTime() : 0) || 0;
      const lT = local ? (Number(local.updatedAt) || (local.timestamp ? new Date(local.timestamp).getTime() : 0) || 0) : 0;
      if (!local) {
        if (!r.deleted) out.push(r); // brand new, recorded on another device
      } else if (r.deleted) {
        if (rT < lT) out.push(local); // our copy is newer, keep it
      } else if (rT >= lT) {
        out.push(r); // server has the newer revision
      } else {
        out.push(local); // our revision is newer
      }
    }
    for (const r of byId.values()) out.push(r);
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
    try {
      const dk = deletedCacheKey();
      const cache = JSON.parse(localStorage.getItem(dk) || '{"products":[],"sales":[],"expenses":[]}');
      if (id && !cache[kind].includes(id)) cache[kind].push(id);
      localStorage.setItem(dk, JSON.stringify(cache));
    } catch {}
  };

  // Push everything on this device up. The server merges newest-wins and never
  // wipes rows belonging to other devices.
  const pushPayload = async (data: { products: any[]; sales: any[]; expenses: any[] }) => {
    if (!user) return;
    let deleted = { products: [], sales: [], expenses: [] };
    try { deleted = JSON.parse(localStorage.getItem(deletedCacheKey()) || '{"products":[],"sales":[],"expenses":[]}'); } catch {}
    const res = await fetch(API_ENDPOINTS.sync, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: user.uid, 
        userEmail: user.email || '', 
        userName: user.displayName || profileDisplayName || user.email?.split('@')[0] || 'Merchant',
        deviceId, 
        ...data, 
        deleted 
      }),
    });
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

  // One full sync round: pull + merge, then push anything newer locally.
  const syncCycle = useCallback(async () => {
    if (!user || !navigator.onLine) {
      setDirty(true);
      setSyncError(true);
      return;
    }
    try {
      const uName = encodeURIComponent(user.displayName || profileDisplayName || user.email?.split('@')[0] || 'Merchant');
      const uEmail = encodeURIComponent(user.email || '');
      const res = await fetch(`${API_ENDPOINTS.data}?userId=${encodeURIComponent(user.uid)}&name=${uName}&email=${uEmail}`);
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
      const mergedP = mergeRecords(dataRef.current.products, remote.products || []);
      const mergedS = recentFirst(mergeRecords(dataRef.current.sales, remote.sales || []));
      const mergedE = recentFirst(mergeRecords(dataRef.current.expenses, remote.expenses || []));
      setProducts(mergedP);
      setSales(mergedS);
      setExpenses(mergedE);
      const deviceIds = (remote.meta?.pendingDeviceIds || []).filter((d: string) => d !== deviceId);
      setOtherDevicePending(deviceIds);
      const ours = { products: mergedP, sales: mergedS, expenses: mergedE };
      if (JSON.stringify(ours) !== syncedHashRef.current) {
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
  }, [user, deviceId]);

  const syncCycleRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    syncCycleRef.current = syncCycle;
  }, [syncCycle]);

  // Persist current data per-user (only after sign-in; the legacy global keys
  // stay untouched so they can migrate the user the first time).
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
      setOtherDevicePending([]);
      setDirty(false);
      setProducts([]);
      setSales([]);
      setExpenses([]);
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
    setProducts(loadedP);
    setSales(loadedS);
    setExpenses(loadedE);
    const savedHash = localStorage.getItem(syncedHashKey()) || '';
    syncedHashRef.current = savedHash;
    const savedSync = Number(localStorage.getItem(lastSyncKey()) || 0);
    setLastSyncAt(savedSync || null);
    syncCycleRef.current();
  }, [user]);

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
    // Stock and profit are derived live from money made vs cost, so a sale only
    // needs to be stored here.
    setSales([sale, ...sales]);
    markChanged();
  };

  const handleSaveExpense = (expense: any) => {
    setExpenses(prevExpenses => {
      const exists = prevExpenses.some(e => e.id === expense.id);
      return exists
        ? prevExpenses.map(e => e.id === expense.id ? expense : e)
        : [expense, ...prevExpenses];
    });
    markChanged();
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const startEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(e => e.id !== id));
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
      <div className="min-h-screen bg-[#09090b] text-foreground flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-amber-400 selection:text-black">
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
            <span>New to marketOS? Explore Product Tour & Guide</span>
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

          <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
            
            {isSignUp && (
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your Name or Business"
                  className="bg-surface border border-border/60 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 font-semibold text-sm transition-all"
                  required
                />
              </div>
            )}

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-surface border border-border/60 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 font-semibold text-sm transition-all"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-surface border border-border/60 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 font-semibold text-sm transition-all"
                required
              />
            </div>

            {isSignUp && (
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Confirm password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-surface border border-border/60 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 font-semibold text-sm transition-all"
                  required
                />
              </div>
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

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-semibold">
                {authError}
              </div>
            )}

            <button 
              type="submit" 
              className="pill-button w-full bg-[#F5C518] hover:bg-[#EAB308] text-black font-extrabold py-3.5 rounded-full mt-2 transition-all shadow-xl shadow-amber-500/20 text-sm active:scale-[0.99]"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
              <div className="relative bg-card px-3 text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold">OR</div>
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
            <span className="text-emerald-400 font-semibold">NDPA 2023 Compliant</span>
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
    // Tombstone everything so the cloud tells other devices to clean up too.
    products.forEach((p: any) => markDeleted('products', p.id));
    sales.forEach((s: any) => markDeleted('sales', s.id));
    expenses.forEach((e: any) => markDeleted('expenses', e.id));
    setProducts([]);
    setSales([]);
    setExpenses([]);
    markChanged();
    setClearDataModalOpen(false);
  };

  // When activeTab is 'guide', render the App Guide as a true full page without the dashboard sidebar/navbars
  if (activeTab === 'guide') {
    return (
      <div className="relative min-h-screen bg-[#07090E]">
        <LandingPage
          currentUserEmail={user?.email}
          onLaunchApp={() => setActiveTab('home')}
          onOpenAdmin={() => setActiveTab('admin')}
          onOpenLegal={(type) => setLegalModalTab(type)}
        />
        <SupportWidget userEmail={user?.email} />
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
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans transition-colors duration-300">
      
      {/* Sidebar (Desktop) - Toggleable / Collapsible */}
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
            {!isSidebarCollapsed && <span>Home</span>}
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
            {!isSidebarCollapsed && <span>My Stock</span>}
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
            {!isSidebarCollapsed && <span>Insights</span>}
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
            {!isSidebarCollapsed && <span>Settings</span>}
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
            {!isSidebarCollapsed && <span>App Guide</span>}
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
                {!isSidebarCollapsed && <span>Mission Control</span>}
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

      {/* Floating Bottom Nav for Mobile (Directly Inspired by Image 2) */}
      <nav className="fixed bottom-4 left-3 right-3 max-w-md mx-auto bg-card/95 backdrop-blur-xl border border-white/10 rounded-full px-3 py-2 flex items-center justify-around shadow-2xl z-50 md:hidden">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'home' ? 'text-[#F5C518] scale-105 font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[9px]">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'products' ? 'text-[#F5C518] scale-105 font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[9px]">Stock</span>
        </button>

        <button 
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'insights' ? 'text-[#F5C518] scale-105 font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span className="text-[9px]">Insights</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'settings' ? 'text-[#F5C518] scale-105 font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[9px]">Settings</span>
        </button>

        <button 
          onClick={() => setActiveTab('guide')}
          className={`flex flex-col items-center gap-0.5 transition-all ${
            (activeTab as any) === 'guide' ? 'text-[#F5C518] scale-105 font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-[9px]">Guide</span>
        </button>

        {isFounder && (
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-0.5 transition-all ${
              activeTab === 'admin' ? 'text-amber-400 scale-105 font-bold' : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9px]">Admin</span>
          </button>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto pb-28 md:pb-10 relative overflow-x-hidden">
        
        {/* Header - Inspired by Image 2 "Search Habit" bar */}
        {/* Header */}
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
              placeholder="Search my stock..." 
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
                  ? 'Saving...' 
                  : (dirty || syncError || !online) 
                    ? 'Save Online' 
                    : 'Saved'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${(dirty || syncError || !online) ? 'bg-black/50' : 'bg-emerald-400'}`} />
            </button>
            
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
                  placeholder="Search my stock..." 
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
                      {!online ? 'Offline Mode' : (dirty || syncError) ? 'Unsaved Changes' : 'Cloud Sync Active'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {lastSyncAt ? `Last saved ${new Date(lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Local device storage active'}
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
                      ? 'Saving...' 
                      : (dirty || syncError || !online) 
                        ? 'Save Online' 
                        : 'Saved'}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${(dirty || syncError || !online) ? 'bg-black/50' : 'bg-emerald-400'}`} />
                </button>
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
                      ? 'You are offline' 
                      : syncError 
                        ? 'Could not reach the cloud' 
                        : 'Your records have not synced for a while'}
                  </div>
                  <div className="text-[11px] font-medium opacity-90 mt-0.5 leading-relaxed">
                    Please go online so the records saved on this device get uploaded to your account.
                  </div>
                </div>
              </div>
              <button 
                onClick={handleManualSync}
                className="pill-button shrink-0 inline-flex items-center gap-2 bg-[#F5C518] text-black px-4 py-2 rounded-full text-xs font-extrabold transition-all shadow-md shadow-amber-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Retry Now'}
              </button>
            </div>
          </div>
        )}

        <div className="px-3 sm:px-5 xl:px-8 py-2">
          
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-6">
              
              {/* Left Column (Home) */}
              <div className="lg:col-span-2 flex flex-col gap-4 xl:gap-6 min-w-0 order-2 lg:order-1">
                
                <DashboardView sales={sales} expenses={expenses} products={products} />

                <ProductAnalysis products={products} sales={sales} onSell={handleSelectProduct} />

                <div className="flex justify-end mt-1">
                  <button 
                    onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
                    className="pill-button flex items-center gap-2 bg-[#F5C518] hover:bg-[#EAB308] text-black px-4 sm:px-5 py-2.5 rounded-full text-xs font-extrabold transition-all shadow-md shadow-amber-500/15"
                  >
                    <Plus className="w-4 h-4" />
                    Record Money Spent
                  </button>
                </div>

                <ExpenseList 
                  expenses={expenses}
                  onEdit={startEditExpense}
                  onDelete={handleDeleteExpense}
                />

                {/* Expense Modal Wrapper */}
                <ExpenseModal 
                  isOpen={isExpenseModalOpen}
                  onClose={() => setIsExpenseModalOpen(false)}
                  onSave={handleSaveExpense}
                  initialExpense={editingExpense}
                />

              </div>

              {/* Right Column (Home) - Quick Sell Panel (Top on Mobile, Sidebar on Desktop) */}
              <div className="flex flex-col gap-4 xl:gap-6 min-w-0 order-1 lg:order-2">
                
                <div className="bg-card -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full rounded-none sm:rounded-2xl p-3.5 sm:p-5 xl:p-6 border-y sm:border border-border/50 shadow-sm relative flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-foreground text-base sm:text-lg tracking-tight">Quick Sell</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5C518]/15 text-amber-500 border border-[#F5C518]/30 shrink-0">
                          Tap to Record
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Tap an item to record a customer sale</p>
                    </div>
                  </div>
                  
                  {products.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground bg-surface/40 rounded-xl border border-dashed border-border/50">
                      No stock added yet. Go to "My Stock" to add items.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[380px] lg:max-h-[600px] overflow-y-auto pr-0.5">
                      {products.map(product => (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className="pill-button bg-surface/60 hover:bg-surface border border-border/50 hover:border-border/80 p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-2.5 text-left transition-all group w-full shadow-sm min-w-0"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-1">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                              <span className="text-xs sm:text-sm font-bold text-foreground leading-tight group-hover:text-amber-400 transition-colors truncate">
                                {product.name}
                              </span>
                              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold shrink-0 whitespace-nowrap">
                                • {product.sellingUnits?.length > 0 
                                  ? product.sellingUnits[0].name 
                                  : product.purchaseUnit || 'Unit'
                                }
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 whitespace-nowrap inline-block">
                              ₦{(product.sellingUnits?.length > 0 ? product.sellingUnits[0].price : product.purchasePrice || 0).toLocaleString()}
                            </span>
                          </div>
                        </button>
                      ))}
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

              </div>

            </div>
          )}

          {activeTab === 'products' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">My Stock</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Track what you bought, what you have left, and prices</p>
                </div>
                <button 
                  onClick={addProduct} 
                  className="pill-button bg-[#F5C518] hover:bg-[#EAB308] text-black font-extrabold py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add New Item
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                <GlassmorphicDropdown
                  placeholder="Sort By..."
                  colorClass="bg-gradient-to-r from-amber-400 to-amber-500"
                  options={[
                    { id: 'name', name: 'Name' },
                    { id: 'price', name: 'Price' },
                    { id: 'stock', name: 'Stock' },
                    { id: 'views', name: 'Views' },
                  ]}
                  selected={{ id: productSortBy, name: `Sort: ${productSortBy.charAt(0).toUpperCase() + productSortBy.slice(1)}` }}
                  onSelect={(opt: any) => setProductSortBy(opt.id as any)}
                />
                <GlassmorphicDropdown
                  placeholder="Order..."
                  colorClass="bg-gradient-to-r from-amber-400 to-amber-500"
                  options={[
                    { id: 'asc', name: 'Ascending' },
                    { id: 'desc', name: 'Descending' },
                  ]}
                  selected={{ id: productSortOrder, name: `Order: ${productSortOrder === 'asc' ? 'Ascending' : 'Descending'}` }}
                  onSelect={(opt: any) => setProductSortOrder(opt.id as any)}
                />
              </div>

              {/* Products Table */}
              <ProductsTable 
                products={filteredAndSortedProducts} 
                sales={sales}
                onEdit={startEdit} 
                onDelete={deleteProduct} 
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
          <div className="px-5 sm:px-8 py-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <InsightsView sales={sales} expenses={expenses} products={products} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="px-4 sm:px-8 py-2 max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">Settings & Profile</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Customize your profile photo, business details and preferences</p>
            </div>
            
            {/* Profile Details & Photo Editor */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-foreground tracking-tight mb-1">Store Owner Profile</h3>
                <p className="text-xs text-muted-foreground">Update your photo and display name across marketOS</p>
              </div>

              {/* Profile Picture Upload & Presets */}
              <div className="p-4 sm:p-5 rounded-xl bg-surface/40 border border-border/60 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative shrink-0 group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-md">
                    <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-[#F5C518] text-black rounded-full flex items-center justify-center shadow-lg border border-black/20 hover:scale-105 transition-transform"
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
                      className="pill-button inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface hover:bg-surface-hover border border-border text-foreground text-xs font-bold transition-all shadow-sm"
                    >
                      <Upload className="w-3 h-3 text-amber-400" />
                      Upload Photo
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
                        onClick={() => setAvatarUrl(preset.url)}
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
              <h3 className="text-base font-extrabold mb-1 text-foreground tracking-tight">Appearance</h3>
              <p className="text-xs text-muted-foreground mb-4">Choose your preferred application theme</p>
              
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
                  Light Mode
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
                  Dark Mode
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
              <h3 className="text-base font-extrabold mb-3 text-rose-400 tracking-tight">Danger Zone</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={clearAllData} 
                  className="pill-button flex-1 flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 rounded-full px-5 py-3 font-bold text-xs sm:text-sm transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
                <button 
                  onClick={handleLogout} 
                  className="pill-button flex-1 flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border/80 text-foreground rounded-full px-5 py-3 font-bold text-xs sm:text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
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
          title="Reset All Business Data?"
          description="This will permanently delete all your products, sales history, and expense records. This action cannot be undone."
          type="danger"
          confirmText="Yes, Clear Everything"
          cancelText="Cancel"
          onConfirm={executeClearAllData}
          onCancel={() => setClearDataModalOpen(false)}
        />

        <AlertDialog
          isOpen={alertModal.isOpen}
          title={alertModal.title}
          description={alertModal.description}
          type={alertModal.type}
          confirmText="Understood"
          isConfirmOnly={true}
          onConfirm={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        />

        <AlertDialog
          isOpen={imageUrlPromptOpen}
          title="Enter Image URL"
          description="Paste a direct image URL (JPEG, PNG, WebP) to update your profile photo."
          type="info"
          confirmText="Save Picture"
          cancelText="Cancel"
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

      </main>

      {/* Global Bottom-Right Floating Support & Complaint Widget */}
      <SupportWidget userEmail={user?.email} userId={user?.uid} />
    </div>
  );
}

export default App;

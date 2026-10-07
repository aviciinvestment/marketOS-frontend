import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Package, 
  Zap, 
  Layers, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  WifiOff, 
  Smartphone, 
  ArrowRight,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { ADMIN_EMAIL } from '../config/api';

interface LandingPageProps {
  currentUserEmail?: string;
  onLaunchApp: () => void;
  onOpenAdmin?: () => void;
  onOpenLegal?: (type: 'terms' | 'privacy') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUserEmail,
  onLaunchApp,
  onOpenAdmin,
  onOpenLegal
}) => {
  const isFounder = currentUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Guide Simulator State (Simulated Video)
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const guideSteps = [
    {
      id: 'step-start',
      number: '01',
      title: 'Where & What to Start With',
      subtitle: 'Stock Inventory & Unit Yield Breakdown',
      description:
        'Start in the Products tab. Add each item with its Supplier Cost (e.g. ₦12,000/carton), your Customer Selling Price (₦1,500/piece), and the Unit Yield (10 pieces per carton). MarketOS automatically calculates your exact profit-per-unit so you never undercharge or sell at a hidden loss.',
      icon: Package,
      actionHighlight: 'Tap "+ Add Product" in the Products tab',
      mockupData: {
        item: 'Indomie Super Pack (Carton)',
        costPrice: '₦14,500 / carton',
        sellingPrice: '₦450 / sachet',
        yield: '40 sachets per carton',
        profitPerUnit: '₦87.50 profit/sachet',
        margin: '19.4% Margin',
      },
    },
    {
      id: 'step-quicksell',
      number: '02',
      title: 'How to Record Sales in 1-Tap',
      subtitle: 'Rapid Checkout without Paper Ledgers',
      description:
        'When a customer buys, simply tap the product tile in Quick Sell! The quantity increments instantly, deducting from your stock and adding the exact cash collected to your daily Money Made. No calculator, no math mistakes during rush hours.',
      icon: Zap,
      actionHighlight: 'Tap any product card in "Quick Sell" on your Dashboard',
      mockupData: {
        item: 'Golden Penny Sugar 500g',
        action: 'Tapped 2 times',
        salesRecorded: '₦1,600 Added',
        stockRemaining: '48 units left',
        speed: '0.4s transaction speed',
      },
    },
    {
      id: 'step-payback',
      number: '03',
      title: 'Capital Payback vs Gross Profit',
      subtitle: 'Never "Eat" Your Seed Capital',
      description:
        'Many shop owners go broke because they treat all sales cash as spendable profit. MarketOS strictly separates your Cost of Goods (COGS - money needed to restock) from Gross Profit. You know exactly what must go back to the supplier.',
      icon: DollarSign,
      actionHighlight: 'Check Gross Profit = Total Sales - Cost of Goods',
      mockupData: {
        totalCollected: '₦50,000 Cash in Hand',
        costToRestock: '₦38,000 Protected Capital',
        grossProfit: '₦12,000 Real Gross Profit',
        rule: 'Rule: Never spend the ₦38k payback!',
      },
    },
    {
      id: 'step-expenses',
      number: '04',
      title: 'Record Shop Operations & Expenses',
      subtitle: 'Fuel, Transport, Levies & Power',
      description:
        'Every naira that leaves your drawer matters. Tap "+ Log Expense" to enter shop generator fuel, market association dues, carriage, or staff lunch. MarketOS immediately deducts this from Gross Profit to show your real Net Take-Home Profit.',
      icon: Layers,
      actionHighlight: 'Tap "+ Log Expense" in the Expenses tab',
      mockupData: {
        fuelGen: '₦3,500 (Generator Fuel)',
        marketLevy: '₦500 (Security & Sanitation)',
        transport: '₦1,200 (Stock Haulage)',
        totalExpenses: '₦5,200 Total Expenses',
        netTakeHome: '₦6,800 Real Pocket Profit',
      },
    },
    {
      id: 'step-timeframe',
      number: '05',
      title: 'How to Change Time Frames',
      subtitle: 'Today, Week, Month, Year & All Time',
      description:
        'Wondering how much you made this week compared to last month? At the top of your dashboard, tap the time frame filter pills: "Today", "Week", "Month", "Year", or "All Time". All charts, profits, and expense reports recalculate in milliseconds.',
      icon: Calendar,
      actionHighlight: 'Tap the pill filter [ Today | Week | Month | Year ]',
      mockupData: {
        activeFilter: 'This Month (October)',
        monthSales: '₦1,420,500 Total Sales',
        monthNetProfit: '₦284,100 Take-Home',
        margin: '20.0% Realized Margin',
      },
    },
    {
      id: 'step-insights',
      number: '06',
      title: 'How to Read Executive Insights',
      subtitle: 'Fast-Moving Goods, Margins & Reorder Warnings',
      description:
        'Tap the Insights tab to see your business intelligence. MarketOS ranks your highest-margin money makers, alerts you when your fastest-moving goods are about to run out of stock, and warns you if your operating expenses are eating too much profit.',
      icon: TrendingUp,
      actionHighlight: 'Tap "Insights" tab in the bottom / sidebar navigation',
      mockupData: {
        topMover: 'Dangote Sugar (₦42,000 profit generated)',
        lowStockAlert: 'Peak Milk (Only 4 units left - Reorder!)',
        healthScore: '94% Financial Health Index',
      },
    },
  ];

  // Auto-play timer for simulated video walkthrough
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setPlaybackProgress((prev) => {
        if (prev >= 100) {
          setCurrentStep((s) => (s + 1) % guideSteps.length);
          return 0;
        }
        return prev + 2; // ~5 seconds per step
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, guideSteps.length]);

  const handleStepSelect = (index: number) => {
    setCurrentStep(index);
    setPlaybackProgress(0);
  };

  const step = guideSteps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#07090E]/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <a
              href="#guide-video-section"
              className="text-xs text-slate-300 hover:text-amber-400 font-semibold px-2 py-1 transition-colors"
            >
              How To Use
            </a>
            <a
              href="#features-section"
              className="text-xs text-slate-300 hover:text-amber-400 font-semibold px-2 py-1 transition-colors"
            >
              Features
            </a>

            {isFounder && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <ShieldCheck size={14} />
                <span>Mission Control</span>
              </button>
            )}

            <button
              onClick={onLaunchApp}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all duration-200 shadow-lg shadow-amber-500/20 flex items-center gap-1.5 active:scale-95"
            >
              <span>Launch App</span>
              <ChevronRight size={16} />
            </button>
          </nav>

          {/* Mobile Three-Bar (Hamburger) Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-amber-400 hover:border-slate-700 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A0D14]/95 backdrop-blur-2xl border-t border-slate-800/80 px-5 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
            <a
              href="#guide-video-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-200 hover:text-amber-400 font-semibold transition-colors border-b border-slate-800/60"
            >
              How To Use
            </a>
            <a
              href="#features-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-200 hover:text-amber-400 font-semibold transition-colors border-b border-slate-800/60"
            >
              Features
            </a>
            {isFounder && onOpenAdmin && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-2"
              >
                <ShieldCheck size={16} />
                <span>Mission Control (Admin)</span>
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchApp();
              }}
              className="w-full py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98"
            >
              <span>Launch App</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative px-4 sm:px-8 pt-12 sm:pt-20 pb-16 max-w-6xl mx-auto w-full text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[300px] bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-medium mb-6 animate-pulse">
          <Sparkles size={13} />
          <span>Built for Market Stall Holders, Supermarkets & Retailers</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Stop Guessing Your Shop’s Real Profit. Run with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
            100% Financial Truth.
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Record customer sales in 1-tap, automatically protect supplier capital from being spent, track generator and shop expenses, and sync seamlessly offline across your devices.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <button
            onClick={onLaunchApp}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Open marketOS Web App</span>
            <ArrowRight size={16} />
          </button>

          <a
            href="#guide-video-section"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all flex items-center justify-center gap-2"
          >
            <Play size={15} className="text-amber-400 fill-amber-400" />
            <span>Watch Animated Interactive Guide</span>
          </a>
        </div>

        {/* Quick Trust Badges */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>100% Offline-First (No Internet Needed)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>NDPR 2019 & NDPA 2023 Privacy Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Instant Cartons-to-Pieces Breakdown</span>
          </div>
        </div>
      </section>

      {/* ANIMATED INTERACTIVE VIDEO GUIDE / WALKTHROUGH */}
      <section id="guide-video-section" className="px-4 sm:px-8 py-16 bg-[#090C12] border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">
              <Play size={12} className="fill-amber-400" />
              <span>Interactive App Guide & Video Simulator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Master marketOS in Under 2 Minutes
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Everything you need to run your business with clarity: from your very first stock entry to reading executive cashflow insights.
            </p>
          </div>

          {/* Video / Simulator Container */}
          <div className="bg-[#0E1118] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left: Step Selector Playlist */}
            <div className="lg:col-span-5 p-4 sm:p-6 bg-slate-950/60 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Curriculum Steps ({guideSteps.length})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs flex items-center gap-1"
                      title={isPlaying ? 'Pause auto-tour' : 'Play auto-tour'}
                    >
                      {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                      <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStep(0);
                        setPlaybackProgress(0);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Restart guide"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-2">
                  {guideSteps.map((s, index) => {
                    const isActive = currentStep === index;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleStepSelect(index)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                          isActive
                            ? 'bg-amber-500/10 border-amber-500/40 text-slate-100 shadow-md'
                            : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-900 hover:text-slate-300'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isActive
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {s.number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold flex items-center justify-between">
                            <span className={isActive ? 'text-amber-400' : 'text-slate-300'}>
                              {s.title}
                            </span>
                            {isActive && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {s.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar for Current Step */}
              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span>Current Step Progress</span>
                  <span className="font-mono">{playbackProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-100 rounded-full"
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Live Interactive Simulator Screen */}
            <div className="lg:col-span-7 p-5 sm:p-8 flex flex-col justify-between space-y-6">
              {/* Simulator Header / Screen Frame */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-mono text-[11px] text-slate-500">marketOS Simulator Screen</span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-medium">
                    Step {currentStep + 1} of {guideSteps.length}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <StepIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{step.title}</h3>
                    <p className="text-xs text-amber-400/90 font-medium">{step.subtitle}</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                  {step.description}
                </p>

                {/* Where to start hint */}
                <div className="mt-4 p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
                    How To Do It
                  </span>
                  <span>{step.actionHighlight}</span>
                </div>
              </div>

              {/* Animated Interactive Mockup Card */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-mono text-slate-400">LIVE APP DATA DEMO</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                    Simulated Output
                  </span>
                </div>

                {/* Dynamic Content based on current step */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {Object.entries(step.mockupData).map(([key, val]) => (
                    <div key={key} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </div>
                      <div className="text-slate-100 font-semibold mt-0.5 truncate">{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setCurrentStep((s) => (s > 0 ? s - 1 : guideSteps.length - 1));
                    setPlaybackProgress(0);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <button
                  onClick={onLaunchApp}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Try It in the App</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => {
                    setCurrentStep((s) => (s + 1) % guideSteps.length);
                    setPlaybackProgress(0);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <span>Next Step</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features-section" className="px-4 sm:px-8 py-20 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
            Why Nigerian Merchants Choose MarketOS
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 mt-2">
            Engineered for African Market Realities
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            No slow internet buffering. No complex accounting jargon. Just clean, honest cash numbers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#0E1118] border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-sm group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <WifiOff size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              Bulletproof Offline-First
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Works deep inside concrete market stalls (Balogun, Alaba, Onitsha Main Market, Computer Village) without network. Records save locally and push automatically once you reconnect.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#0E1118] border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-sm group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DollarSign size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              Cost of Goods (COGS) Shield
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically isolates supplier seed capital from profit. You will never spend stock replenishment funds accidentally, keeping your business liquid and solvent.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#0E1118] border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-sm group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Smartphone size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              Multi-Device Real-Time Sync
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use your Android or iPhone while walking the market stalls, or open the laptop dashboard at your desk. Everything stays synced seamlessly without duplicates.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[#0E1118] border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-sm group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Package size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              Carton-to-Unit Yield Math
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Buy in crates, cartons, or sacks; sell in sachets, bottles, or pieces. MarketOS handles the internal fractions so you always know your exact profit per piece.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-[#0E1118] border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-sm group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              Time Frame Flexibility
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Switch effortlessly between Today, Week, Month, Year, and All Time. Compare sales surges during festive seasons vs dry months with 1 tap.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-[#0E1118] border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-sm group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              NDPR & NDPA Privacy Strict
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your business revenue and prices belong to you alone. Fully compliant with Nigerian Data Protection Act 2023 with localized encryption.
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="px-4 sm:px-8 py-16 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-t border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100">
            Ready to Take Control of Your Daily Shop Revenue?
          </h2>
          <p className="text-xs sm:text-base text-slate-300">
            Join hundreds of retail merchants who have eliminated paper errors and know their exact take-home profit every single evening.
          </p>
          <div className="pt-2">
            <button
              onClick={onLaunchApp}
              className="px-8 py-4 rounded-xl text-sm sm:text-base font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 hover:scale-105 transition-all"
            >
              Start Free on marketOS Now
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER - Vertical on mobile, horizontal row on desktop */}
      <footer className="mt-auto border-t border-slate-800 bg-[#05070B] px-5 sm:px-8 py-10 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          <BrandLogo size="sm" />
          <span className="text-slate-400 font-medium">marketOS • Nigeria Retail Operating System</span>
        </div>

        {/* Links list - Stacked vertically on mobile screens */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-xs sm:text-[11px] w-full sm:w-auto">
          {onOpenLegal && (
            <>
              <button
                onClick={() => onOpenLegal('terms')}
                className="hover:text-amber-400 transition-colors py-1 sm:py-0 w-full sm:w-auto"
              >
                Terms & Conditions
              </button>
              <button
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-amber-400 transition-colors py-1 sm:py-0 w-full sm:w-auto"
              >
                Privacy & NDPR Policy
              </button>
            </>
          )}
          {isFounder && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-amber-400 hover:underline font-semibold py-1 sm:py-0 w-full sm:w-auto"
            >
              Founder Admin
            </button>
          )}
          <span className="text-slate-500 pt-1 sm:pt-0">© {new Date().getFullYear()} marketOS. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

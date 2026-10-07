import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, CheckCircle2, Scale, Lock, BookOpen } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
  onAccept?: () => void;
}

export default function LegalModal({ 
  isOpen, 
  onClose, 
  initialTab = 'privacy',
  onAccept 
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="bg-card w-full max-w-2xl rounded-2xl border border-border/60 shadow-2xl relative z-10 flex flex-col max-h-[88vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-border/40 flex items-center justify-between bg-surface/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5C518]/15 text-[#F5C518] border border-[#F5C518]/30 flex items-center justify-center shrink-0">
                {activeTab === 'privacy' ? <ShieldCheck className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                  {activeTab === 'privacy' ? 'Privacy & Consent Policy' : 'Terms & Conditions of Service'}
                </h3>
                <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Grounded in Nigerian Law (NDPA 2023 • FCCPA 2018 • CAMA 2020)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface hover:bg-surface-hover border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-border/30 flex gap-2 bg-card shrink-0">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`pill-button px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 transition-all ${
                activeTab === 'privacy'
                  ? 'bg-[#F5C518] text-black shadow-sm'
                  : 'bg-surface text-muted-foreground hover:text-foreground border border-border/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Privacy & Consent Policy
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`pill-button px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 transition-all ${
                activeTab === 'terms'
                  ? 'bg-[#F5C518] text-black shadow-sm'
                  : 'bg-surface text-muted-foreground hover:text-foreground border border-border/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Terms & Conditions
            </button>
          </div>

          {/* Scrollable Policy Content */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs sm:text-sm text-foreground/90 leading-relaxed">
            {activeTab === 'privacy' ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                  <b>Legal Notice & Regulatory Grounding:</b> This Privacy and Consent Policy is promulgated pursuant to the <b>Nigeria Data Protection Act (NDPA) 2023</b>, overseen by the Nigeria Data Protection Commission (NDPC), and the <b>Cybercrimes (Prohibition, Prevention, etc.) Act 2015 (as amended 2024)</b>.
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    1. Identity of Data Controller
                  </h4>
                  <p className="text-muted-foreground">
                    <b>marketOS</b> ("we", "us", or "our") operates as a cloud-synchronized commercial retail, inventory, and point-of-sale accounting hub for Nigerian small and medium-sized enterprises (SMEs) and sole proprietors. For the purposes of the NDPA 2023, marketOS acts as a Data Controller regarding your business profile and a Data Processor regarding commercial transactions you record on the platform.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    2. Data We Collect and Process
                  </h4>
                  <p className="text-muted-foreground mb-2">
                    Pursuant to the principles of lawful processing and data minimization (Section 24, NDPA 2023), we only collect information necessary to provide our business intelligence tools:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                    <li><b>Account Data:</b> User full name, email address, store username, authentication credentials, and optional store avatar image.</li>
                    <li><b>Commercial Inventory Data:</b> Product names, quantities purchased, cost prices in Nigerian Naira (₦), selling units (e.g. cups, bags, bottles), and unit yield ratios.</li>
                    <li><b>Sales & Transactional Data:</b> Customer sales timestamps, quantities sold, revenue collected, and payback fractions.</li>
                    <li><b>Operational Expense Records:</b> Categorized expenditure (rent, transportation, electricity/NEPA, packaging, logistics, staff salaries).</li>
                    <li><b>Technical Diagnostics:</b> Sync timestamps, browser user agent, offline cache markers, and error telemetry.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    3. Lawful Basis and Purpose of Processing
                  </h4>
                  <p className="text-muted-foreground mb-2">
                    Under Sections 25 and 26 of the NDPA 2023, your personal and commercial data is processed on the following lawful bases:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                    <li><b>Express Consent:</b> By checking the consent checkbox on registration, you grant unambiguous, informed consent for processing your business data.</li>
                    <li><b>Contractual Necessity:</b> To calculate cost of goods sold, profit margins, stock depletion, and synchronize records across your authorized devices.</li>
                    <li><b>Compliance with Nigerian Commercial Law:</b> Facilitating accurate bookkeeping records in harmony with the <b>Companies and Allied Matters Act (CAMA) 2020</b>.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    4. Security and Data Protection Safeguards
                  </h4>
                  <p className="text-muted-foreground">
                    In compliance with Section 39 of the NDPA 2023 and the Cybercrimes Act 2015, we enforce industry-standard cryptographic protocols:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground mt-2">
                    <li>TLS/HTTPS 256-bit encryption for all data in transit.</li>
                    <li>Firebase Cloud Firestore and REST sync protocols with encrypted storage at rest.</li>
                    <li>Role-based access tokens restricting inventory records strictly to your authenticated account ID.</li>
                    <li>Protection against unauthorized surveillance, data corruption, or unlawful transfer.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1 flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    5. Data Subject Rights (NDPA 2023)
                  </h4>
                  <p className="text-muted-foreground mb-2">
                    As a user in the Federal Republic of Nigeria, you possess unconditional rights under Sections 34 through 38 of the NDPA 2023:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                    <li><b>Right to Access:</b> You can view your complete financial summary and raw product records at any time.</li>
                    <li><b>Right to Rectification:</b> Edit or update product details, selling prices, or expense items directly via the application.</li>
                    <li><b>Right to Erasure ("Right to be Forgotten"):</b> Clear your business database via the Settings menu or request full account termination.</li>
                    <li><b>Right to Data Portability:</b> Export your sales intelligence or sync with your accounting records.</li>
                    <li><b>Right to Lodge a Complaint:</b> You have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC) at <span className="text-[#F5C518]">https://ndpc.gov.ng</span>.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1">
                    6. Retention and Cross-Border Transfers
                  </h4>
                  <p className="text-muted-foreground">
                    Your records are retained as long as your account remains active. Commercial accounting records are kept to allow historical period comparisons (Today, Week, Month, Year, All Time). We do not sell, lease, or monetize your trade secrets or customer data to third-party advertisers. Any international cloud infrastructure utilized complies with Section 41 of the NDPA 2023 ensuring adequate data protection standards.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                  <b>Commercial Contract & Compliance:</b> These Terms & Conditions constitute a legally binding agreement under the laws of the Federal Republic of Nigeria, including the <b>Federal Competition and Consumer Protection Act (FCCPA) 2018</b> and <b>CAMA 2020</b>.
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1">
                    1. Acceptance of Terms
                  </h4>
                  <p className="text-muted-foreground">
                    By registering for, accessing, or using marketOS, you warrant that you are at least 18 years of age or possess lawful parental/guardian authority to conduct commercial business in Nigeria, and agree to abide by these Terms in full.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1">
                    2. Software Purpose and Functionality
                  </h4>
                  <p className="text-muted-foreground">
                    marketOS provides a proprietary financial algorithm designed to track retail store inventory yields, cost recovery, and net business earnings. The software separates product cost of goods sold (COGS) from operational expenses to compute true gross profit and net take-home earnings.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1">
                    3. User Account Responsibilities
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                    <li>You are solely responsible for maintaining the confidentiality of your login email and password under the Cybercrimes Act 2015.</li>
                    <li>You agree to provide true, accurate, and current pricing and inventory figures.</li>
                    <li>marketOS shall not be liable for losses caused by unauthorized credential sharing on your devices.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1">
                    4. Intellectual Property Rights
                  </h4>
                  <p className="text-muted-foreground">
                    All interface designs, branding, logos, graphics, source code, and mathematical payback models in marketOS are the exclusive intellectual property of marketOS. You receive a limited, revocable, non-exclusive license to use the system for managing your personal or company commercial store.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1">
                    5. Financial Disclaimer
                  </h4>
                  <p className="text-muted-foreground">
                    marketOS provides operational business intelligence and automated arithmetic computations. While designed to enhance profit clarity, marketOS does not serve as a licensed chartered tax advisory, commercial bank, or auditing firm. Users remain responsible for independent tax filings with federal and state revenue authorities (e.g. FIRS, LIRS, etc.).
                  </p>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1">
                    6. Limitation of Liability & Consumer Rights
                  </h4>
                  <p className="text-muted-foreground">
                    In accordance with the FCCPA 2018, marketOS is provided "as is" and "as available". We do not guarantee uninterrupted server connectivity during general telecommunications or power disruptions. To the fullest extent permitted by Nigerian law, our liability shall not exceed the subscription fees paid by you to marketOS in the preceding 6 months.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F5C518] mb-1">
                    7. Governing Law and Dispute Resolution
                  </h4>
                  <p className="text-muted-foreground">
                    These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising shall first be submitted to good-faith mediation under the Lagos State Multi-Door Courthouse (LMDC) or Abuja Multi-Door Courthouse before recourse to litigation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 sm:p-5 border-t border-border/40 bg-surface/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-muted-foreground font-medium text-center sm:text-left">
              Last updated: October 2026 • Compliant with NDPA 2023 regulations
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="pill-button flex-1 sm:flex-initial px-5 py-2.5 rounded-full border border-border text-foreground font-bold hover:bg-surface text-xs transition-colors"
              >
                Close
              </button>
              {onAccept && (
                <button
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  className="pill-button flex-1 sm:flex-initial px-6 py-2.5 rounded-full bg-[#F5C518] hover:bg-[#EAB308] text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accept & Consent
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

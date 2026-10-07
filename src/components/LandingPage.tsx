import React, { useState } from 'react';
import { 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Package, 
  DollarSign, 
  ShieldCheck, 
  WifiOff, 
  Smartphone, 
  ArrowRight,
  BarChart3,
  Menu,
  X,
  Languages
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { ADMIN_EMAIL } from '../config/api';

export type LanguageCode = 'en' | 'pidgin' | 'igbo' | 'yoruba' | 'hausa';

interface LandingPageProps {
  currentUserEmail?: string;
  onLaunchApp: () => void;
  onOpenAdmin?: () => void;
  onOpenLegal?: (type: 'terms' | 'privacy') => void;
}

interface LanguageContent {
  name: string;
  nativeName: string;
  flag: string;
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trust1: string;
    trust2: string;
    trust3: string;
  };
  features: {
    tag: string;
    title: string;
    subtitle: string;
    items: Array<{
      title: string;
      desc: string;
    }>;
  };
  bottomCta: {
    title: string;
    subtitle: string;
    button: string;
  };
  footer: {
    tagline: string;
    terms: string;
    privacy: string;
    admin: string;
    rights: string;
  };
}

const TRANSLATIONS: Record<LanguageCode, LanguageContent> = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    hero: {
      badge: 'Built for Every Shop Owner, Market Trader & Retailer',
      title: 'Stop Guessing Your Real Gain. Know Every Naira Entering & Leaving',
      titleHighlight: 'Your Shop with 100% Truth.',
      subtitle: 'Record customer sales with 1 tap, protect your restock money from getting spent, track generator and shop bills, and work smoothly without internet.',
      ctaPrimary: 'Open marketOS App',
      ctaSecondary: 'Explore Why MarketOS',
      trust1: 'Works Without Internet (Offline)',
      trust2: 'Capital Shield (Never Eat Capital)',
      trust3: 'Cartons into Pieces Calculation',
    },
    features: {
      tag: 'Why Nigerian Merchants Choose MarketOS',
      title: 'Built for Real African Market Realities',
      subtitle: 'No complex accounting grammar. No slow internet buffering. Just plain, honest cash truth.',
      items: [
        {
          title: 'Works Deep in Concrete Markets',
          desc: 'Works inside Balogun, Alaba, Onitsha Main Market, Ariaria, or Wuse without internet. Saves locally and syncs to cloud automatically once online.',
        },
        {
          title: 'Shields Your Seed Capital',
          desc: 'Separates supplier restock money from profit automatically. You will never mistakenly spend capital meant for buying new market.',
        },
        {
          title: 'Syncs Across Multiple Phones',
          desc: 'Use your Android phone, iPhone, or shop laptop on the same account. All records and deletions update concurrently without duplicates.',
        },
        {
          title: 'Carton to Pieces Breakdown',
          desc: 'Buy in cartons, crates, or bags; sell in sachets, bottles, or pieces. marketOS automatically calculates your exact profit on every piece.',
        },
        {
          title: 'Check Any Time Period Instantly',
          desc: 'One master filter at the top lets you inspect Today, This Week, This Month, or All Time with a single tap.',
        },
        {
          title: 'Private & Secure for Your Shop',
          desc: 'Your sales, stock counts, and prices belong to you alone. Fully encrypted and compliant with Nigerian Data Protection laws (NDPA 2023).',
        },
      ],
    },
    bottomCta: {
      title: 'Ready to Know Your Exact Shop Profit Every Evening?',
      subtitle: 'Join hundreds of retail merchants who have dumped messy paper notebooks and know their exact take-home profit without headache.',
      button: 'Start Free on marketOS Now',
    },
    footer: {
      tagline: 'marketOS • Nigeria Retail Operating System',
      terms: 'Terms of Service',
      privacy: 'Privacy & NDPA Policy',
      admin: 'Founder Admin',
      rights: 'All rights reserved.',
    },
  },

  pidgin: {
    name: 'Pidgin',
    nativeName: 'Naija Pidgin',
    flag: '🇳🇬',
    hero: {
      badge: 'Dem Build Am For Every Trader, Shop Owner & Supermarket',
      title: 'Stop To Dey Guess Your Gain. Know Every Kobo Weh Enter & Comot',
      titleHighlight: 'For Your Shop With 100% Truth.',
      subtitle: 'Press 1-tap record sale quick-quick, protect money to buy new market make you no chop capital, write fuel and shop bills, and use am well even if network no dey.',
      ctaPrimary: 'Open marketOS App',
      ctaSecondary: 'See Why MarketOS',
      trust1: 'E Dey Work Without Network',
      trust2: 'No Fit Chop Your Seed Capital',
      trust3: 'Break Down Carton into Pieces',
    },
    features: {
      tag: 'Wetin Make Naija Traders Dey Choose MarketOS',
      title: 'Dem Build Am For Real African Market Reality',
      subtitle: 'No big-big grammar. No slow network buffering. Just plain, honest cash truth.',
      items: [
        {
          title: 'E Dey Work Deep Inside Market Stalls',
          desc: 'E dey work inside Balogun, Alaba, Onitsha Main Market, Ariaria, or Wuse without internet. E go save for phone and sync once network come.',
        },
        {
          title: 'E Dey Protect Your Seed Capital',
          desc: 'E go strictly separate supplier restock money from your gain. You no go ever mistakenly chop capital take buy something else.',
        },
        {
          title: 'Use Am For Many Phones Together',
          desc: 'Use your Android phone, iPhone, or laptop on the same account. Everything dey update concurrently without mistake or duplicate.',
        },
        {
          title: 'Carton to Piece Calculation',
          desc: 'Buy carton, crate, or bag; sell pieces or sachets. marketOS go calculate your exact gain for each single piece automatically.',
        },
        {
          title: 'Check Any Time Period Sharp-Sharp',
          desc: 'One master button for top dey allow you check Today, This Week, This Month, or All Time with just one tap.',
        },
        {
          title: 'Your Money Secret Dey 100% Safe',
          desc: 'Your sales, stock numbers, and prices na your secret alone. Dem lock am well under Nigerian Data Protection Act (NDPA 2023).',
        },
      ],
    },
    bottomCta: {
      title: 'You Ready To Know Your Real Evening Shop Gain?',
      subtitle: 'Join hundreds of smart market traders weh don throway paper book and dey balance their money every evening without headache.',
      button: 'Start Free for marketOS Now',
    },
    footer: {
      tagline: 'marketOS • Nigeria Retail Operating System',
      terms: 'Terms of Service',
      privacy: 'Privacy & NDPA Policy',
      admin: 'Founder Admin',
      rights: 'All rights reserved.',
    },
  },

  igbo: {
    name: 'Igbo',
    nativeName: 'Asụsụ Igbo',
    flag: '🇳🇬',
    hero: {
      badge: 'E mere ya maka ndị na-azụ ahịa, ndị nwe ụlọ ahịa na kanti',
      title: 'Kwụsị ịkọ nkọ uru ahịa gị. Mara ego niile na-abata ma na-apụ',
      titleHighlight: 'na shọọpụ gị n’eziokwu 100%.',
      subtitle: 'Dekọọ ahịa ngwa ngwa site na otu aka, chekwaa ego isi ahịa gị ka ị ghara iri ya, dekọọ ego mmanụ jenereto na njem, jiri ya rụọ ọrụ ọbụna mgbe netwọk na-adịghị.',
      ctaPrimary: 'Meghee marketOS Ugbu A',
      ctaSecondary: 'Hụ Ihe Mere Ị Ga-eji Jiri Ya',
      trust1: 'Ọ na-arụ ọrụ n’enweghị netwọk (Offline)',
      trust2: 'Chekwaa Ego Isi Ahịa (E rila jare)',
      trust3: 'Mgbakọ Katọn n’Otu n’Otu',
    },
    features: {
      tag: 'Ihe Mere Ndị Ahịa Naijiria Ji Hụ MarketOS n’Anya',
      title: 'E Mere Ya Maka Ahịa Anyị n’Afrịka',
      subtitle: 'Enweghị ụtọasụsụ gbara ọkpụrụkpụ. Enweghị nkwụsị netwọk. Naanị eziokwu ego gị dị larịị.',
      items: [
        {
          title: 'Ọ na-arụ Ọrụ n’Ime Ụlọ Ahịa nke Ọma',
          desc: 'Ọ na-arụ ọrụ n’ime ahịa Balogun, Alaba, Onitsha Main Market, Ariaria, ma ọ bụ Wuse n’enweghị netwọk. Ọ na-echekwa na ekwentị ma bulite ya na kọmputa ozugbo netwọk batara.',
        },
        {
          title: 'Ọ na-echekwa Ego Isi Ahịa Gị',
          desc: 'Ọ na-ekewa ego iji zụtaghachi ahịa na uru gị iche. Ị gaghị ejiri aka gị mefuo ego isi ahịa n’amaghị ama ọzọ.',
        },
        {
          title: 'Jiri Ekwentị Dị Iche Iche n’Otu Oge',
          desc: 'Jiri ekwentị Android, iPhone, ma ọ bụ laptọọpụ rụọ ọrụ n’otu akaụntụ. Ihe niile ị gbanwere na-apụta ozugbo n’enweghị mgbagwoju anya.',
        },
        {
          title: 'Mgbakọ Katọn gaa n’Otu n’Otu',
          desc: 'Zụta katọn ma ọ bụ akpa; ree n’otu n’otu ma ọ bụ paki. marketOS na-agbakọ ezigbo uru gị n’otu n’otu ozugbo.',
        },
        {
          title: 'Lelee Oge Ọ Bụla n’Otu Aka',
          desc: 'Otu bọtịnụ dị n’elu na-enyere gị aka ilele Taa, Izu a, Ọnwa a, ma ọ bụ Oge Niile n’otu ntabi anya.',
        },
        {
          title: 'Ihe Nzuzo Ego Gị Dị 100% Nchebe',
          desc: 'Ahịa gị, ọnụahịa gị na ngwaahịa gị bụ naanị nke gị. Echedoro ya nke ọma n’okpuru iwu nchekwa data Naijiria (NDPA 2023).',
        },
      ],
    },
    bottomCta: {
      title: 'Ị Dịla Njikere Ịmata Ezigbo Uru Ahịa Gị Kwa Mgbede?',
      subtitle: 'Sonyere ọtụtụ narị ndị ahịa maara ihe tụfuru akwụkwọ ndekọ ochie ma na-agbakọ ego ha kwa mgbede n’enweghị isi ọwụwa.',
      button: 'Bido n’efu na marketOS Ugbu A',
    },
    footer: {
      tagline: 'marketOS • Nigeria Retail Operating System',
      terms: 'Usoro Ọrụ',
      privacy: 'Iwu Nzuzo & NDPA',
      admin: 'Nlekọta Onye Okike',
      rights: 'Ikike niile echekwabara.',
    },
  },

  yoruba: {
    name: 'Yoruba',
    nativeName: 'Èdè Yorùbá',
    flag: '🇳🇬',
    hero: {
      badge: 'Fun gbogbo oníṣòwò, onílé-ìtajà àti ilé-ìtajà ńlá',
      title: 'Dẹkun láti máa ro èrè rẹ lásán. Mọ gbogbo owó tó ń wọlé àti èyí tó ń jáde',
      titleHighlight: 'nínú ṣọ́ọ̀bù rẹ pẹ̀lú òtítọ́ 100%.',
      subtitle: 'Kọ ọjà títà sílẹ̀ lẹ́ẹ̀kan ṣoṣo, dáàbò bo owó ìpìlẹ̀ rẹ kó má baà jẹ́ jíjẹ, ṣàkọsílẹ̀ owó epo jẹ́nẹ́rẹ́tọ̀ àti owó ọkọ̀, kí o sì lo ètò yìí láìsí intanẹ́ẹ̀tì.',
      ctaPrimary: 'Ṣí marketOS Nísinsìnyí',
      ctaSecondary: 'Wo Ìdí Tí O Fi Yan MarketOS',
      trust1: 'Ó ń ṣiṣẹ́ láìsí intanẹ́ẹ̀tì (Offline)',
      trust2: 'Dáàbò Bo Owó Ìpìlẹ̀ (Má Jẹ Ìpìlẹ̀)',
      trust3: 'Ìṣirò Kátọ́ọ̀nù sí Ẹyọ Kọ̀ọ̀kan',
    },
    features: {
      tag: 'Ìdí Tí Àwọn Oníṣòwò Nàìjíríà Fi Yan MarketOS',
      title: 'A Kọ Ọ́ Fún Àwọn Ọjà Ilẹ̀ Adúláwọ̀ Tòótọ́',
      subtitle: 'Kò sí gírámà tó nira. Kò sí dídúró de intanẹ́ẹ̀tì tó lọ́ra. Òtítọ́ owó tí ó ṣe kedere nìkan.',
      items: [
        {
          title: 'Ó ń Ṣiṣẹ́ Nínú Àwọn Ọjà Nla',
          desc: 'Ó ń ṣiṣẹ́ dáadáa nínú ọjà Balogun, Alaba, Onitsha Main Market, Ariaria, tàbí Wuse láìsí intanẹ́ẹ̀tì. Yóò fi pamọ́ sórí fóònù rẹ, yóò sì gbé e sókè lẹ́yìn tí intanẹ́ẹ̀tì bá dé.',
        },
        {
          title: 'Ó ń Dáàbò Bo Owó Ìpìlẹ̀ Ọjà Rẹ',
          desc: 'Ó ń ya owó àtúnrà ọjà sọ́tọ̀ kúrò nínú èrè rẹ láìsí àṣìṣe. O ò ní jẹ owó ìpìlẹ̀ rẹ mọ́ láé.',
        },
        {
          title: 'Lo Fóònù Púpọ̀ Lẹ́ẹ̀kan Náà',
          desc: 'Lo fóònù Android, iPhone, tàbí laptọ́ọ̀pù lórí àkántì kan náà. Gbogbo àkọsílẹ̀ yóò jẹ́ kíkọ láìsí àṣìṣe tàbí dídàrúdàpọ̀.',
        },
        {
          title: 'Ìṣirò Kátọ́ọ̀nù sí Ẹyọ Kọ̀ọ̀kan',
          desc: 'Ra kátọ́ọ̀nù, kireeti, tàbí àpò; tà á ní ẹyọ tàbí pọ́ọ̀sì. marketOS yóò ṣirò èrè rẹ lórí ẹyọ kọ̀ọ̀kan fún ọ lẹ́sẹ̀kẹsẹ̀.',
        },
        {
          title: 'Wo Àkókò Yòówù Ní Ìṣẹ́jú Kan',
          desc: 'Bọ́tìnì kan lókè ń jẹ́ kí o wo Lónìí, Lọ́sẹ̀ yìí, Lóṣù yìí, tàbí Gbogbo Ìgbà pẹ̀lú fífọwọ́kan ẹ̀ẹ̀kan péré.',
        },
        {
          title: 'Àṣírí Ọjà Rẹ Wà Ní Ìpamọ́ 100%',
          desc: 'Ọjà títà, iye ọjà àti iye owó rẹ jẹ́ àṣírí tìrẹ nìkan. A fi ààbò bò ó lábẹ́ òfin ààbò dátà ti Nàìjíríà (NDPA 2023).',
        },
      ],
    },
    bottomCta: {
      title: 'Ṣé O Ti Ṣe Tán Láti Mọ Èrè Ṣọ́ọ̀bù Rẹ Tòótọ́ Ní Alẹ́?',
      subtitle: 'Dara pọ̀ mọ́ ọgọ́rọ̀ọ̀rún àwọn oníṣòwò ọlọ́gbọ́n tí wọ́n ti ju ìwé àkọsílẹ̀ àtijọ́ nù tí wọ́n sì ń mọ èrè wọn láìsí wàhálà.',
      button: 'Bẹ̀rẹ̀ Lọ́fẹ̀ẹ́ Lórí marketOS Nísinsìnyí',
    },
    footer: {
      tagline: 'marketOS • Nigeria Retail Operating System',
      terms: 'Àwọn Ìlànà Iṣẹ́',
      privacy: 'Ètò Àṣírí & NDPA',
      admin: 'Àkóso Olùdásílẹ̀',
      rights: 'Gbogbo ẹ̀tọ́ wà ní ìpamọ́.',
    },
  },

  hausa: {
    name: 'Hausa',
    nativeName: 'Harshen Hausa',
    flag: '🇳🇬',
    hero: {
      badge: 'An ƙera don ƴan kasuwa, masu shaguna da manyan kanti',
      title: 'Daina ƙiyasi kan ainihin ribarka. San kowane naira da ke shiga da fita',
      titleHighlight: 'a shagonka da gaskiya 100%.',
      subtitle: 'Rubuta ciniki da taɓawa ɗaya, kare jarin sayo kaya don kada ka cinye shi, rubuta kuɗin man janareta da sufuri, kuma yi aiki ba tare da intanet ba.',
      ctaPrimary: 'Bude marketOS App',
      ctaSecondary: 'Duba Amfanin MarketOS',
      trust1: 'Yana Aiki Ba Intanet (Offline)',
      trust2: 'Kare Jarin Saye (Kada Ka Ci Jari)',
      trust3: 'Lissafin Katan zuwa Dai-ɗai',
    },
    features: {
      tag: 'Abin da Ya Sa Ƴan Kasuwar Najeriya Suka Zaɓi MarketOS',
      title: 'An Ƙera Shi Don Yanayin Kasuwancin Afirka',
      subtitle: 'Babu dogon turanci mai wuya. Babu jiran intanet mai jinkiri. Gaskiyar kuɗin shagonka kawai.',
      items: [
        {
          title: 'Yana Aiki Cikin Manyan Kasuwanni',
          desc: 'Yana aiki a cikin kasuwannin Balogun, Alaba, Onitsha Main Market, Ariaria, ko Wuse ba tare da intanet ba. Yana adanawa a wayarka kuma ya daidaita idan an samu intanet.',
        },
        {
          title: 'Yana Kare Jarin Saye Kaya',
          desc: 'Yana ware kuɗin da za a mayar kasuwa daban da ainihin ribarka. Ba za ka taɓa cinye jarin sayo kaya a cikin kuskure ba.',
        },
        {
          title: 'Yi Amfani da Wayoyi Da Yawa Lokaci Ɗaya',
          desc: 'Yi amfani da wayar Android, iPhone, ko kwamfuta a kan asusu ɗaya. Kowane lissafi zai daidaita nan take ba tare da rikici ko maimaici ba.',
        },
        {
          title: 'Lissafin Katan zuwa Dai-ɗaiku',
          desc: 'Sayo katan, kwano, ko buhu; sayar da ɗai-ɗai ko pakiti. marketOS yana lissafa maka ainihin ribarka a kowane guda nan take.',
        },
        {
          title: 'Duba Kowane Lokaci Cikin Sauƙi',
          desc: 'Maballi ɗaya a sama yana ba ka damar bincika cinikin Yau, Wannan Makon, Wannan Watan, ko Duk Lokaci da dannawa ɗaya.',
        },
        {
          title: 'Sirrin Shagonka A Tsare Yake 100%',
          desc: 'Cinikinka, adadin kayanka da farashinka naka ne kai kaɗai. An kare su a ƙarƙashin dokar kare bayanan Najeriya (NDPA 2023).',
        },
      ],
    },
    bottomCta: {
      title: 'Ka Shirya Sanin Ainihin Ribar Shagonka a Kowace Yamma?',
      subtitle: 'Haɗu da ɗaruruwan ƴan kasuwa masu basira waɗanda suka jefar da tsohon littafin takarda kuma suke lissafin kuɗinsu ba tare da ciwon kai ba.',
      button: 'Fara Kyauta a marketOS Yanzu',
    },
    footer: {
      tagline: 'marketOS • Tsarin Gudanar da Kasuwanci a Najeriya',
      terms: 'Sharuɗɗan Sabis',
      privacy: 'Tsarin Tsare Sirri & NDPA',
      admin: 'Gudanarwar Wanda Ya Kafa',
      rights: 'Duk haƙƙoƙi an kiyaye su.',
    },
  },
};

const FEATURE_ICONS = [WifiOff, DollarSign, Smartphone, Package, BarChart3, ShieldCheck];
const FEATURE_TAGS = [
  'OFFLINE FIRST',
  'CAPITAL SHIELD',
  'MULTI-DEVICE',
  'PIECE BREAKDOWN',
  'MASTER FILTER',
  'BANK-GRADE PRIVACY'
];
const FEATURE_METRICS = [
  '100% Offline Capability',
  'Protects Supplier Funds',
  'Live Cloud Concurrency',
  'Instant Piece Profit',
  'One-Tap Recalculation',
  'NDPA 2023 Compliant'
];

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUserEmail,
  onLaunchApp,
  onOpenAdmin,
  onOpenLegal
}) => {
  const isFounder = currentUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Selected Language State (persisted in localStorage)
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('marketos_landing_lang');
      if (saved && ['en', 'pidgin', 'igbo', 'yoruba', 'hausa'].includes(saved)) {
        return saved as LanguageCode;
      }
    } catch {}
    return 'en';
  });

  const handleLanguageChange = (lang: LanguageCode) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem('marketos_landing_lang', lang);
    } catch {}
  };

  const t = TRANSLATIONS[currentLang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      
      {/* TOP NOTIFICATION BAR */}
      <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 px-4 py-2 text-center text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <Sparkles size={14} className="animate-spin text-slate-950" style={{ animationDuration: '3s' }} />
        <span>100% Offline-First • Multi-Device Concurrency • No Jargon • Zero Subscription Fees</span>
      </div>

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#07090E]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
          </div>

          {/* Desktop Right Actions */}
          <nav className="hidden md:flex items-center gap-3">
            <a
              href="#features-section"
              className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-amber-400 transition-colors"
            >
              Why MarketOS
            </a>

            {isFounder && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <ShieldCheck size={14} />
                <span>Mission Control</span>
              </button>
            )}

            <button
              onClick={onLaunchApp}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all duration-200 shadow-lg shadow-amber-500/20 flex items-center gap-1.5 active:scale-95"
            >
              <span>{t.hero.ctaPrimary}</span>
              <ChevronRight size={16} />
            </button>
          </nav>

          {/* Mobile Right Controls: Hamburger Button */}
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
          <div className="md:hidden bg-[#0A0D14]/98 backdrop-blur-2xl border-t border-slate-800/80 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
            <div className="flex flex-col gap-2">
              <a
                href="#features-section"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm text-slate-200 hover:text-amber-400 font-semibold transition-colors"
              >
                Why MarketOS
              </a>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchApp();
              }}
              className="w-full py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98"
            >
              <span>{t.hero.ctaPrimary}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </header>

      {/* LANGUAGE SELECTOR BAR - PLACED DIRECTLY BELOW THE NAV BAR */}
      <div className="bg-[#0B0E17] border-b border-slate-800/80 px-4 sm:px-8 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Languages size={15} className="text-amber-400 shrink-0" />
            <span className="text-amber-400">Language / Èdè / Asụsụ / Harshe:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {(['en', 'pidgin', 'igbo', 'yoruba', 'hausa'] as LanguageCode[]).map((langKey) => {
              const langObj = TRANSLATIONS[langKey];
              const isActive = currentLang === langKey;
              return (
                <button
                  key={langKey}
                  onClick={() => handleLanguageChange(langKey)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                    isActive 
                      ? 'bg-[#F5C518] text-black border-amber-300 shadow-amber-500/20 font-black scale-[1.02]' 
                      : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-white hover:border-amber-400/50 hover:bg-slate-800'
                  }`}
                  title={`Switch language to ${langObj.name}`}
                >
                  <span>{langObj.flag}</span>
                  <span>{langObj.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative px-4 sm:px-8 pt-12 sm:pt-20 pb-16 max-w-6xl mx-auto w-full text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[300px] bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />

        {/* Audience Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles size={13} />
          <span>{t.hero.badge}</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight leading-[1.18] max-w-4xl mx-auto">
          {t.hero.title}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
            {t.hero.titleHighlight}
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t.hero.subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <button
            onClick={onLaunchApp}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-black bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>{t.hero.ctaPrimary}</span>
            <ArrowRight size={16} />
          </button>

          <a
            href="#features-section"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles size={15} className="text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>{t.hero.ctaSecondary}</span>
          </a>
        </div>

        {/* Quick Trust Badges */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">{t.hero.trust1}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">{t.hero.trust2}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">{t.hero.trust3}</span>
          </div>
        </div>
      </section>

      {/* WHY NIGERIAN MERCHANTS CHOOSE MARKETOS - STACKING CARDS ON MOBILE */}
      <section id="features-section" className="px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles size={13} />
            <span>{t.features.tag}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight">
            {t.features.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3 max-w-xl mx-auto leading-relaxed">
            {t.features.subtitle}
          </p>
        </div>

        {/* Mobile Animated Stacking Cards / Desktop 3-Column Grid */}
        <div className="relative flex flex-col gap-6 md:grid md:grid-cols-3 md:gap-6">
          {t.features.items.map((item, index) => {
            const IconComponent = FEATURE_ICONS[index] || Sparkles;
            return (
              <div
                key={index}
                style={{
                  top: `calc(4.5rem + ${index * 18}px)`,
                  zIndex: 10 + index,
                }}
                className="sticky md:static p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#0D111A]/95 backdrop-blur-xl border border-slate-800 border-t-2 border-t-amber-400/90 md:border-t-slate-800 shadow-[0_-12px_35px_rgba(0,0,0,0.85)] md:shadow-lg hover:border-amber-500/50 transition-all duration-300 ease-out group will-change-transform"
              >
                {/* Header row of card: Icon, Badge, and Index */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <IconComponent size={22} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {FEATURE_TAGS[index]}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      0{index + 1}
                    </span>
                  </div>
                </div>

                {/* Card Title & Description */}
                <h3 className="text-base sm:text-lg font-black text-slate-100 mb-2 group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed min-h-[48px]">
                  {item.desc}
                </p>

                {/* Footer metric & badge */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-amber-400/90 font-semibold text-[11px] sm:text-xs">
                    {FEATURE_METRICS[index]}
                  </span>
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="px-4 sm:px-8 py-16 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-t border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-5">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-100">
            {t.bottomCta.title}
          </h2>
          <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t.bottomCta.subtitle}
          </p>
          <div className="pt-2">
            <button
              onClick={onLaunchApp}
              className="px-8 py-4 rounded-xl text-sm sm:text-base font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 hover:scale-105 transition-all"
            >
              {t.bottomCta.button}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-800 bg-[#05070B] px-5 sm:px-8 py-10 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          <BrandLogo size="sm" />
          <span className="text-slate-400 font-semibold">{t.footer.tagline}</span>
        </div>

        {/* Links list */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-xs sm:text-[11px] w-full sm:w-auto">
          {onOpenLegal && (
            <>
              <button
                onClick={() => onOpenLegal('terms')}
                className="hover:text-amber-400 transition-colors py-1 sm:py-0 w-full sm:w-auto font-medium"
              >
                {t.footer.terms}
              </button>
              <button
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-amber-400 transition-colors py-1 sm:py-0 w-full sm:w-auto font-medium"
              >
                {t.footer.privacy}
              </button>
            </>
          )}
          {isFounder && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-amber-400 hover:underline font-bold py-1 sm:py-0 w-full sm:w-auto"
            >
              {t.footer.admin}
            </button>
          )}
          <span className="text-slate-500 pt-1 sm:pt-0">© {new Date().getFullYear()} marketOS. {t.footer.rights}</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

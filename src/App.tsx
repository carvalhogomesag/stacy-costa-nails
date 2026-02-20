import React, { useState, useEffect } from 'react';
import { 
  MapPin, Phone, Clock, Star, 
  Quote, ArrowRight, ChevronRight, ShieldCheck, 
  Heart, Users, Camera, Sparkles, Loader2,
  Instagram, Facebook, Music2
} from 'lucide-react';

// FIREBASE
import { db, auth } from './firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// COMPONENTES
import Navbar from './components/Navbar';
import BookingModal from './components/BookingModal';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

// CONFIGURAÇÃO CENTRALIZADA
import { BUSINESS_INFO, REVIEWS, PLACEHOLDER_IMG, CLIENT_ID } from './constants';
import { COPY } from './copy';
import { Service, SocialLinks } from './types';

const App: React.FC = () => {
  // --- ESTADOS DE CONTROLO ---
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  // --- ESTADOS DE DADOS DINÂMICOS ---
  const [dynamicServices, setDynamicServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  
  const [visualMetadata, setVisualMetadata] = useState<{
    socialLinks?: SocialLinks;
    galleryUrls?: string[];
    mapAddress?: string;
  }>({});

  // 1. SINCRONIZAR ESTADO DE AUTENTICAÇÃO
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setIsDashboardOpen(!!user);
    });
    return () => unsubAuth();
  }, []);

  // 2. ESCUTAR SERVIÇOS (Firestore Path: businesses/{ID}/services)
  useEffect(() => {
    const q = query(
      collection(db, "businesses", CLIENT_ID, "services"), 
      orderBy("name", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Service));
      setDynamicServices(servicesList);
      setLoadingServices(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. ESCUTAR METADADOS (Redes, Galeria, Mapa)
  useEffect(() => {
    const unsubMetadata = onSnapshot(doc(db, "businesses", CLIENT_ID, "config", "metadata"), (snap) => {
      if (snap.exists()) {
        setVisualMetadata(snap.data());
      }
    });
    return () => unsubMetadata();
  }, []);

  // --- HELPERS ---
  const getImg = (index: number) => visualMetadata.galleryUrls?.[index] || PLACEHOLDER_IMG;

  const getMapIframeUrl = () => {
    const address = visualMetadata.mapAddress || `${BUSINESS_INFO.address}, ${BUSINESS_INFO.city}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const getExternalMapUrl = () => {
    if (visualMetadata.mapAddress) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visualMetadata.mapAddress)}`;
    }
    return BUSINESS_INFO.googleMapsUrl;
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary-light selection:text-primary-dark bg-brand-bg font-sans">
      
      <Navbar onAdminClick={() => setIsAdminLoginOpen(true)} />

      {/* COMPONENTES ADMINISTRATIVOS */}
      {isAdminLoginOpen && (
        <AdminLogin 
          isOpen={isAdminLoginOpen} 
          onClose={() => setIsAdminLoginOpen(false)} 
          onLoginSuccess={() => setIsDashboardOpen(true)}
        />
      )}
      
      {isDashboardOpen && (
        <AdminDashboard onLogout={() => setIsDashboardOpen(false)} />
      )}

      {isBookingOpen && (
        <BookingModal 
          isOpen={isBookingOpen} 
          onClose={() => setIsBookingOpen(false)} 
        />
      )}

      {/* HERO SECTION */}
      <section id="inicio" className="relative min-h-[85vh] md:min-h-[95vh] flex items-center justify-center overflow-hidden bg-brand-footer">
        <div className="absolute inset-0 z-0">
          <img 
            src={getImg(0)} 
            alt={BUSINESS_INFO.name} 
            className="w-full h-full object-cover opacity-60 scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-brand-footer/80 to-brand-footer"></div> 
        </div>

        <div className="container mx-auto px-4 relative z-10 pt-28 md:pt-24 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6 md:mb-8 text-primary-light">
              <Star size={12} fill="currentColor" />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">{COPY.hero.badge}</span>
            </div>
            
            <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 leading-[1.1] text-white tracking-tighter uppercase px-2">
              {COPY.hero.title} <br />
              <span className="text-primary italic font-light text-3xl sm:text-4xl md:text-6xl lg:text-7xl">{COPY.hero.subtitle}</span>
            </h2>
            
            <p className="text-stone-300 text-sm sm:text-base md:text-xl lg:text-2xl max-w-2xl mx-auto mb-10 md:mb-12 font-light leading-relaxed px-4">
              {COPY.hero.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-6 sm:px-0 w-full">
              <button 
                onClick={() => setIsBookingOpen(true)}
                className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white px-8 md:px-10 py-4 md:py-5 rounded-full text-base md:text-lg font-bold transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/40 group active:scale-95"
              >
                {COPY.hero.ctaPrimary} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="#servicos" 
                className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-8 md:px-10 py-4 md:py-5 rounded-full text-base md:text-lg font-bold hover:bg-white/10 transition-all text-center flex items-center justify-center"
              >
                {COPY.hero.ctaSecondary}
              </a>
            </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="py-16 md:py-24 bg-brand-card text-center">
        <div className="container mx-auto px-6 md:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-12">
            {COPY.highlights.map((item, index) => {
              const icons = [ShieldCheck, Users, Sparkles];
              const Icon = icons[index];
              return (
                <div key={index} className="flex flex-col items-center group">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-bg border border-stone-200 rounded-full flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform shadow-sm">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold font-serif text-primary-dark mb-2">{item.title}</h3>
                  <p className="text-stone-500 text-sm max-w-[280px] md:max-w-xs leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SERVIÇOS DINÂMICOS */}
      <section id="servicos" className="py-16 md:py-32 bg-brand-bg">
        <div className="container mx-auto px-6 md:px-4 max-w-5xl text-left">
          <div className="text-center mb-12 md:mb-16">
            <h4 className="text-primary text-[10px] md:text-sm font-bold uppercase tracking-[0.5em] mb-3">{COPY.services.badge}</h4>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-primary-dark tracking-tighter">{COPY.services.title}</h2>
          </div>

          {loadingServices ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8 md:gap-y-12">
              {dynamicServices.map((s) => (
                <div 
                  key={s.id} 
                  onClick={() => setIsBookingOpen(true)}
                  className="group border-b border-stone-200 pb-6 md:pb-8 hover:border-primary transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-end mb-3 gap-4">
                    <h3 className="text-xl md:text-2xl font-bold font-serif text-primary-dark group-hover:text-primary transition-colors leading-tight">{s.name}</h3>
                    <span className="text-primary font-bold text-base md:text-lg whitespace-nowrap">{s.price}</span>
                  </div>
                  <p className="text-stone-500 text-xs md:text-sm italic font-light">{s.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-16 md:py-32 bg-brand-card overflow-hidden text-left">
        <div className="container mx-auto px-6 md:px-4 grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="relative z-10 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl aspect-[4/5] md:border-8 md:border-brand-bg">
                <img src={getImg(4)} alt={COPY.about.title} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-4 md:-bottom-8 md:-left-8 bg-primary-dark text-white p-6 md:p-10 rounded-2xl md:rounded-3xl max-w-[250px] md:max-w-xs shadow-2xl z-20 border border-white/10 hidden sm:block">
                <Quote className="text-primary mb-3 md:mb-4 w-6 h-6 md:w-8 md:h-8" />
                <p className="font-medium italic text-sm md:text-lg leading-snug">"{REVIEWS[0].text}"</p>
                <p className="text-primary text-[10px] md:text-xs mt-4 uppercase font-bold tracking-widest">{BUSINESS_INFO.owner}</p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold mb-6 md:mb-8 text-primary-dark leading-tight tracking-tighter">
                {COPY.about.title} <br /><span className="text-primary italic font-light text-3xl sm:text-4xl md:text-6xl">{COPY.about.subtitle}</span>
              </h2>
              <div className="space-y-4 md:space-y-6 text-stone-600 font-light text-base md:text-lg leading-relaxed">
                <p>{COPY.about.p1}</p>
                <p>{COPY.about.p2}</p>
              </div>
              <button 
                onClick={() => setIsBookingOpen(true)}
                className="mt-8 md:mt-10 text-primary font-bold flex items-center gap-2 group border-b border-primary pb-1 active:scale-95 transition-all w-max"
              >
                {COPY.about.cta} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section className="py-16 md:py-24 bg-brand-bg text-center">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
             <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-primary-dark mb-3 italic tracking-tight">{COPY.portfolio.title}</h2>
             <p className="text-stone-500 font-light uppercase tracking-widest text-[10px] md:text-xs">{COPY.portfolio.subtitle}</p>
          </div>
          <div className="columns-2 sm:columns-3 md:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="rounded-xl md:rounded-3xl overflow-hidden group shadow-sm border border-stone-200 bg-brand-card break-inside-avoid">
                <img 
                  src={getImg(idx)} 
                  alt="Portfolio" 
                  loading="lazy" 
                  className="w-full grayscale hover:grayscale-0 transition-all duration-700 hover:scale-110 cursor-pointer" 
                />
              </div>
            ))}

            <div className="bg-primary-dark aspect-square md:aspect-[3/4] rounded-xl md:rounded-3xl flex flex-col items-center justify-center p-4 md:p-8 shadow-xl break-inside-avoid">
              <Camera className="text-primary mb-4 w-6 h-6 md:w-8 md:h-8" />
              <h4 className="text-white font-black text-sm md:text-xl leading-tight mb-4 uppercase tracking-widest">{COPY.portfolio.instagramTag}</h4>
              
              <div className="flex gap-3 md:gap-4 flex-wrap justify-center">
                {visualMetadata.socialLinks?.instagram && (
                  <a href={visualMetadata.socialLinks.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg md:rounded-xl flex items-center justify-center text-white hover:bg-primary-hover transition-all shadow-lg">
                    <Instagram className="w-5 h-5 md:w-6 md:h-6" />
                  </a>
                )}
                {visualMetadata.socialLinks?.tiktok && (
                  <a href={visualMetadata.socialLinks.tiktok} target="_blank" rel="noreferrer" className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg md:rounded-xl flex items-center justify-center text-white hover:bg-primary-hover transition-all shadow-lg">
                    <Music2 className="w-5 h-5 md:w-6 md:h-6" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ESPAÇO */}
      <section className="py-16 md:py-20 bg-brand-card">
        <div className="container mx-auto px-6 md:px-4">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
             <div className="order-2 md:order-1 space-y-6 md:space-y-8 text-left">
                <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl text-primary-dark italic tracking-tight leading-none">{COPY.space.title}</h3>
                <p className="text-stone-500 leading-relaxed text-base md:text-lg font-light">
                  {COPY.space.description}
                </p>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                   <div className="rounded-xl md:rounded-[2rem] overflow-hidden aspect-square md:aspect-auto md:h-44 border border-stone-200">
                      <img src={getImg(5)} alt="Espaço" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                   </div>
                   <div className="rounded-xl md:rounded-[2rem] overflow-hidden aspect-square md:aspect-auto md:h-44 border border-stone-200">
                      <img src={getImg(6)} alt="Detalhes" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                   </div>
                </div>
             </div>
             <div className="order-1 md:order-2 h-64 sm:h-80 md:h-[550px] rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl border-[8px] md:border-[12px] border-brand-bg">
                <img src={getImg(7)} alt="Interior Stacy Costa Nails" className="w-full h-full object-cover" />
             </div>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-16 md:py-32 bg-brand-bg text-left">
        <div className="container mx-auto px-6 md:px-4 grid lg:grid-cols-12 gap-12 md:gap-16">
          <div className="lg:col-span-5 space-y-8 md:space-y-12 text-primary-dark">
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold italic uppercase tracking-tighter leading-none">{COPY.contact.title}</h2>
            <div className="space-y-8 md:space-y-10">
              <div className="flex gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-card border border-stone-200 shadow-sm rounded-xl flex items-center justify-center text-primary shrink-0">
                   <MapPin className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div><h4 className="font-bold text-lg md:text-xl mb-1">{COPY.contact.locationLabel}</h4><p className="text-stone-500 font-light text-sm md:text-base">{BUSINESS_INFO.address}<br/>{BUSINESS_INFO.city}</p></div>
              </div>
              <div className="flex gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-card border border-stone-200 shadow-sm rounded-xl flex items-center justify-center text-primary shrink-0">
                   <Clock className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div><h4 className="font-bold text-lg md:text-xl mb-1">{COPY.contact.hoursLabel}</h4><p className="text-stone-500 font-light text-sm md:text-base">{BUSINESS_INFO.openingHours}</p></div>
              </div>
              <div className="flex gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-card border border-stone-200 shadow-sm rounded-xl flex items-center justify-center text-primary shrink-0">
                   <Phone className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div><h4 className="font-bold text-lg md:text-xl mb-1">{COPY.contact.phoneLabel}</h4><p className="text-primary-dark text-2xl md:text-3xl font-bold tracking-tight">{BUSINESS_INFO.phone}</p></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 h-[350px] md:h-[600px] rounded-[2rem] md:rounded-[4rem] overflow-hidden border-[6px] md:border-[10px] border-brand-card shadow-xl relative group">
            <iframe 
              src={getMapIframeUrl()} 
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: 'grayscale(0.3) contrast(1.1)' }} 
              allowFullScreen={true} 
              loading="lazy" 
              title="Google Maps"
              className="grayscale-[0.3] md:hover:grayscale-0 transition-all duration-700"
            />
            
            <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <a 
                href={getExternalMapUrl()} 
                target="_blank" 
                rel="noreferrer" 
                className="bg-primary text-white px-8 py-4 md:px-10 py-5 rounded-full font-bold shadow-2xl uppercase tracking-widest text-xs md:text-sm active:scale-95 transition-all block whitespace-nowrap"
              >
                {COPY.contact.mapButton}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 md:py-20 bg-brand-footer text-white text-center border-t border-white/5">
        <div className="flex flex-col items-center gap-6 md:gap-8">
          <div className="flex items-center gap-3">
             <Heart className="text-primary w-8 h-8 md:w-9 md:h-9" />
             <div className="text-left uppercase">
                <h1 className="font-serif text-2xl md:text-3xl font-bold leading-none tracking-tighter">{BUSINESS_INFO.name}</h1>
                <p className="text-[9px] md:text-[11px] tracking-[0.4em] text-primary font-black">{BUSINESS_INFO.subName}</p>
             </div>
          </div>
          <div className="flex gap-5">
             {visualMetadata.socialLinks?.instagram && <a href={visualMetadata.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-stone-400 hover:text-primary transition-colors"><Instagram size={24}/></a>}
             {visualMetadata.socialLinks?.facebook && <a href={visualMetadata.socialLinks.facebook} target="_blank" rel="noreferrer" className="text-stone-400 hover:text-primary transition-colors"><Facebook size={24}/></a>}
             {visualMetadata.socialLinks?.tiktok && <a href={visualMetadata.socialLinks.tiktok} target="_blank" rel="noreferrer" className="text-stone-400 hover:text-primary transition-colors"><Music2 size={24}/></a>}
          </div>
          <p className="text-stone-500 text-[9px] md:text-[10px] uppercase tracking-[0.5em] font-medium italic px-4">
            {COPY.footer.copy} • {COPY.footer.devTag}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
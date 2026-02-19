import React, { useState, useEffect } from 'react';
import { 
  Scissors, MapPin, Phone, Clock, Star, 
  CheckCircle2, Quote, ArrowRight, ChevronRight, ShieldCheck, 
  Heart, Users, ExternalLink, Camera, Sparkles, Loader2,
  Instagram, Facebook, Music2
} from 'lucide-react';

// FIREBASE
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';

// COMPONENTES
import Navbar from './components/Navbar';
import BookingModal from './components/BookingModal';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

// DADOS E CONSTANTES
import { BUSINESS_INFO, REVIEWS, PLACEHOLDER_IMG, CLIENT_ID } from './constants';
import { Service, SocialLinks } from './types';

const App: React.FC = () => {
  // --- ESTADOS DE CONTROLO ---
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  // --- ESTADOS DE DADOS DINÂMICOS ---
  const [dynamicServices, setDynamicServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  
  // Metadados Visuais (Redes Sociais, Galeria e Endereço do Mapa)
  const [visualMetadata, setVisualMetadata] = useState<{
    socialLinks?: SocialLinks;
    galleryUrls?: string[];
    mapAddress?: string;
  }>({});

  // 1. ESCUTAR SERVIÇOS DO FIREBASE (Multi-tenant)
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

  // 2. ESCUTAR METADADOS (Redes Sociais, Galeria e Mapa da Nuvem)
  useEffect(() => {
    const unsubMetadata = onSnapshot(doc(db, "businesses", CLIENT_ID, "config", "metadata"), (snap) => {
      if (snap.exists()) {
        setVisualMetadata(snap.data());
      }
    });
    return () => unsubMetadata();
  }, []);

  // Função de imagem dinâmica com Placeholders
  const getImg = (index: number) => {
    if (visualMetadata.galleryUrls && visualMetadata.galleryUrls[index]) {
      return visualMetadata.galleryUrls[index];
    }
    return PLACEHOLDER_IMG;
  };

  // Gerar URL do Iframe do Google Maps
  const getMapIframeUrl = () => {
    const address = visualMetadata.mapAddress || `${BUSINESS_INFO.address}, ${BUSINESS_INFO.city}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  // Gerar Link Externo para o Botão do Maps
  const getExternalMapUrl = () => {
    if (visualMetadata.mapAddress) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visualMetadata.mapAddress)}`;
    }
    return BUSINESS_INFO.googleMapsUrl;
  };

  return (
    // TEMA: Nude, Bege e Champagne (Stacy Costa Nails)
    <div className="min-h-screen flex flex-col selection:bg-[#d4bca9] selection:text-[#4a3f35] bg-[#fdfbf7]">
      
      <Navbar onAdminClick={() => setIsAdminLoginOpen(true)} />

      <AdminLogin 
        isOpen={isAdminLoginOpen} 
        onClose={() => setIsAdminLoginOpen(false)} 
        onLoginSuccess={() => setIsDashboardOpen(true)}
      />
      
      {isDashboardOpen && (
        <AdminDashboard onLogout={() => setIsDashboardOpen(false)} />
      )}

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
      />

      {/* HERO SECTION */}
      <section id="inicio" className="relative min-h-[90vh] md:min-h-[95vh] flex items-center justify-center overflow-hidden bg-[#1a1714]">
        <div className="absolute inset-0 z-0">
          <img 
            src={getImg(0)} 
            alt={BUSINESS_INFO.name} 
            className="w-full h-full object-cover opacity-60 scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#1a1714]/80 to-[#1a1714]"></div> 
        </div>

        <div className="container mx-auto px-4 relative z-10 pt-24 text-center">
            <div className="inline-flex items-center gap-2 bg-[#b5967a]/10 border border-[#b5967a]/20 px-5 py-2 rounded-full mb-8 animate-fade-in text-[#d4bca9]">
              <Star size={14} fill="currentColor" />
              <span className="text-xs font-bold uppercase tracking-[0.3em]">Nail Artist Premium em Algés</span>
            </div>
            
            <h2 className="font-serif text-5xl md:text-8xl font-bold mb-8 leading-[1.1] text-white tracking-tighter uppercase">
              {BUSINESS_INFO.name} <br />
              <span className="text-[#b5967a] italic font-light">{BUSINESS_INFO.subName}</span>
            </h2>
            
            <p className="text-stone-300 text-lg md:text-2xl max-w-2xl mx-auto mb-12 font-light leading-relaxed">
              Onde a técnica encontra a arte. Especialista em unhas de gel com acabamento impecável e brio em cada detalhe.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center px-4">
              <button 
                onClick={() => setIsBookingOpen(true)}
                className="bg-[#b5967a] hover:bg-[#a38569] text-white px-10 py-5 rounded-full text-lg font-bold transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/40 group"
              >
                Marcar Experiência <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#servicos" className="bg-white/5 border border-white/10 text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-white/10 transition-all shadow-sm text-center">Consultar Menu</a>
            </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden text-center">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: ShieldCheck, title: "Rigor & Higiene", text: "Espaço projetado para o teu conforto com os mais altos padrões de esterilização." },
              { icon: Users, title: "Atendimento Exclusivo", text: "Uma experiência personalizada e acolhedora, onde tu és a nossa prioridade." },
              { icon: Sparkles, title: "Durabilidade Surreal", text: "Técnicas avançadas de gel e alongamento para unhas perfeitas por semanas." }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center group">
                <div className="w-20 h-20 bg-[#fdfbf7] border border-[#e5dcd3] rounded-full flex items-center justify-center text-[#b5967a] mb-6 group-hover:scale-110 transition-transform shadow-sm">
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl font-bold font-serif text-[#4a3f35] mb-3">{item.title}</h3>
                <p className="text-stone-500 leading-relaxed text-sm max-w-xs">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS DINÂMICOS */}
      <section id="servicos" className="py-20 md:py-32 bg-[#fdfbf7]">
        <div className="container mx-auto px-4 max-w-5xl text-left">
          <div className="text-center mb-16">
            <h4 className="text-[#b5967a] text-sm font-bold uppercase tracking-[0.5em] mb-4">O Meu Menu</h4>
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-[#4a3f35] tracking-tighter">Serviços & Cuidados</h2>
          </div>

          {loadingServices ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-[#b5967a]" size={40} />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-x-20 gap-y-12">
              {dynamicServices.map((s) => (
                <div 
                  key={s.id} 
                  onClick={() => setIsBookingOpen(true)}
                  className="group border-b border-[#e5dcd3] pb-8 hover:border-[#b5967a] transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-2xl font-bold font-serif text-[#4a3f35] group-hover:text-[#b5967a] transition-colors">{s.name}</h3>
                    <span className="text-[#b5967a] font-bold text-lg">{s.price}</span>
                  </div>
                  <p className="text-stone-500 text-sm italic font-light">{s.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-20 md:py-32 bg-white overflow-hidden text-left">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl aspect-[4/5] border-8 border-[#fdfbf7]">
                <img src={getImg(4)} alt="Stacy Costa" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-[#4a3f35] text-white p-10 rounded-3xl max-w-xs shadow-2xl z-20 hidden md:block border border-white/10">
                <Quote className="text-[#b5967a] mb-4" size={32} />
                <p className="font-medium italic text-lg leading-snug">"O brio e o perfeccionismo são as marcas de cada trabalho que realizo."</p>
                <p className="text-[#b5967a] text-xs mt-6 uppercase font-bold tracking-widest">{BUSINESS_INFO.owner}</p>
              </div>
            </div>
            <div>
              <h2 className="font-serif text-4xl md:text-7xl font-bold mb-8 text-[#4a3f35] leading-tight tracking-tighter">
                Stacy Costa <br /><span className="text-[#b5967a] italic font-light text-5xl md:text-6xl">Paixão pelas Unhas</span>
              </h2>
              <div className="space-y-6 text-stone-600 font-light text-lg leading-relaxed">
                <p>Com anos de dedicação à estética, especializei-me em criar resultados que não apenas duram, mas que elevam a confiança de cada mulher.</p>
                <p>No meu espaço em Algés, utilizo as técnicas mais modernas do mercado internacional para garantir que as tuas unhas são tratadas como joias.</p>
              </div>
              <button 
                onClick={() => setIsBookingOpen(true)}
                className="mt-10 text-[#b5967a] font-bold flex items-center gap-2 group border-b border-[#b5967a] pb-1"
              >
                Marca a tua visita <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section className="py-20 md:py-24 bg-[#fdfbf7] text-center">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
             <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#4a3f35] mb-4 italic tracking-tight">O Meu Portfolio</h2>
             <p className="text-stone-500 font-light uppercase tracking-widest text-xs">Trabalhos reais e brio constante</p>
          </div>
          <div className="columns-2 md:columns-4 gap-6 space-y-4 md:space-y-6">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="rounded-3xl overflow-hidden group shadow-md border border-[#e5dcd3] bg-white">
                <img 
                  src={getImg(idx)} 
                  alt="Portfolio" 
                  loading="lazy" 
                  className="w-full grayscale hover:grayscale-0 transition-all duration-700 hover:scale-110 cursor-pointer" 
                />
              </div>
            ))}

            <div className="bg-[#4a3f35] aspect-[3/4] rounded-3xl flex flex-col items-center justify-center p-8 shadow-xl">
              <Camera size={32} className="text-[#b5967a] mb-6 group-hover:scale-110 transition-transform" />
              <h4 className="text-white font-black text-xl leading-tight mb-6 uppercase">Acompanha-nos</h4>
              
              <div className="flex gap-4">
                {visualMetadata.socialLinks?.instagram && (
                  <a href={visualMetadata.socialLinks.instagram} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[#b5967a] rounded-xl flex items-center justify-center text-white hover:bg-[#a38569] transition-all hover:-translate-y-1 shadow-lg">
                    <Instagram size={24} />
                  </a>
                )}
                {visualMetadata.socialLinks?.tiktok && (
                  <a href={visualMetadata.socialLinks.tiktok} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[#b5967a] rounded-xl flex items-center justify-center text-white hover:bg-[#a38569] transition-all hover:-translate-y-1 shadow-lg">
                    <Music2 size={24} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ESPAÇO */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
             <div className="order-2 md:order-1 space-y-8 text-left">
                <h3 className="font-serif text-3xl md:text-5xl text-[#4a3f35] italic tracking-tight leading-none">O Teu Momento</h3>
                <p className="text-stone-500 leading-relaxed text-lg font-light">
                  Preparamos um ambiente minimalista e relaxante, pensado para que possas desfrutar do teu momento de cuidado com toda a tranquilidade.
                </p>
                <div className="flex gap-4">
                   <div className="rounded-[2rem] overflow-hidden h-44 flex-1 border border-[#e5dcd3] shadow-inner">
                      <img src={getImg(5)} alt="Espaço" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                   </div>
                   <div className="rounded-[2rem] overflow-hidden h-44 flex-1 border border-[#e5dcd3] shadow-inner">
                      <img src={getImg(6)} alt="Detalhes" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                   </div>
                </div>
             </div>
             <div className="order-1 md:order-2 h-80 md:h-[550px] rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-[#fdfbf7]">
                <img src={getImg(7)} alt="Interior" className="w-full h-full object-cover" />
             </div>
          </div>
        </div>
      </section>

      {/* CONTACTO COM MAPA DINÂMICO */}
      <section id="contacto" className="py-20 md:py-32 bg-[#fdfbf7] text-left">
        <div className="container mx-auto px-4 grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5 space-y-12">
            <h2 className="font-serif text-5xl md:text-6xl font-bold text-[#4a3f35] italic uppercase tracking-tighter leading-none">Vem Visitar-nos</h2>
            <div className="space-y-10">
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-white border border-[#e5dcd3] shadow-sm rounded-2xl flex items-center justify-center text-[#b5967a] shrink-0">
                   <MapPin size={28} />
                </div>
                <div><h4 className="text-[#4a3f35] font-bold text-xl mb-1">Localização</h4><p className="text-stone-500 font-light">{BUSINESS_INFO.address}<br/>{BUSINESS_INFO.city}</p></div>
              </div>
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-white border border-[#e5dcd3] shadow-sm rounded-2xl flex items-center justify-center text-[#b5967a] shrink-0">
                   <Clock size={28} />
                </div>
                <div><h4 className="text-[#4a3f35] font-bold text-xl mb-1">Horário</h4><p className="text-stone-500 font-light">{BUSINESS_INFO.openingHours}</p></div>
              </div>
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-white border border-[#e5dcd3] shadow-sm rounded-2xl flex items-center justify-center text-[#b5967a] shrink-0">
                   <Phone size={28} />
                </div>
                <div><h4 className="text-[#4a3f35] font-bold text-xl mb-1">Telemóvel</h4><p className="text-[#4a3f35] text-3xl font-bold tracking-tight">{BUSINESS_INFO.phone}</p></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 h-[500px] md:h-[600px] rounded-[4rem] overflow-hidden border-[10px] border-white shadow-2xl relative group">
            {/* IFRAME INTERATIVO DO GOOGLE MAPS */}
            <iframe 
              src={getMapIframeUrl()} 
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: 'grayscale(0.3) contrast(1.1)' }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps"
              className="grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
            />
            
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <a 
                href={getExternalMapUrl()} 
                target="_blank" 
                rel="noreferrer" 
                className="bg-[#b5967a] text-white px-10 py-5 rounded-full font-bold shadow-2xl uppercase tracking-widest text-sm active:scale-95 transition-all block whitespace-nowrap"
              >
                Abrir no Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 bg-[#1a1714] text-white text-center border-t border-white/5">
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-3">
             <Heart className="text-[#b5967a]" size={36} />
             <div className="text-left uppercase">
                <h1 className="font-serif text-3xl font-bold leading-none tracking-tighter">{BUSINESS_INFO.name}</h1>
                <p className="text-[11px] tracking-[0.4em] text-[#b5967a] font-black">{BUSINESS_INFO.subName}</p>
             </div>
          </div>
          <div className="flex gap-6">
             {visualMetadata.socialLinks?.instagram && <a href={visualMetadata.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-stone-400 hover:text-[#b5967a] transition-colors"><Instagram size={24}/></a>}
             {visualMetadata.socialLinks?.facebook && <a href={visualMetadata.socialLinks.facebook} target="_blank" rel="noreferrer" className="text-stone-400 hover:text-[#b5967a] transition-colors"><Facebook size={24}/></a>}
          </div>
          <p className="text-stone-500 text-[10px] uppercase tracking-[0.5em] font-medium italic">© 2026 {BUSINESS_INFO.name} • Algés, Portugal</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
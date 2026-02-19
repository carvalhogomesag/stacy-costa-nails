import React, { useState, useEffect } from 'react';
import { Scissors, Menu, X, Phone, Heart } from 'lucide-react';
import { BUSINESS_INFO, CLIENT_ID } from '../constants';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Interface para receber a função que abre o login
interface NavbarProps {
  onAdminClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAdminClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dynamicBookingUrl, setDynamicBookingUrl] = useState(BUSINESS_INFO.bookingUrl);
  
  // --- LÓGICA DO CLIQUE SECRETO (EASTER EGG) ---
  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    
    const timer = setTimeout(() => {
      setClickCount(0);
    }, 2000);

    if (clickCount + 1 === 5) {
      clearTimeout(timer);
      onAdminClick(); 
      setClickCount(0);
    }
  };

  // --- ESCUTAR METADADOS PARA LINK DE RESERVA DINÂMICO ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "businesses", CLIENT_ID, "config", "metadata"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.socialLinks?.whatsapp) {
          setDynamicBookingUrl(data.socialLinks.whatsapp);
        } else {
          setDynamicBookingUrl(BUSINESS_INFO.bookingUrl);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Início', href: '#inicio' },
    { name: 'Menu', href: '#servicos' },
    { name: 'Sobre Mim', href: '#sobre' },
    { name: 'Contacto', href: '#contacto' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-[#1a1714]/95 backdrop-blur-md py-4 shadow-xl border-b border-[#b5967a]/20' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        
        {/* LOGO DINÂMICA COM TONS NUDE/GOLD */}
        <div 
          className="flex items-center gap-3 group cursor-pointer select-none" 
          onClick={handleLogoClick}
          title={BUSINESS_INFO.name}
        >
          <div className="w-10 h-10 bg-[#b5967a] rounded-xl flex items-center justify-center text-white group-hover:rotate-12 transition-transform shadow-lg shadow-[#b5967a]/20">
            <Heart size={22} fill="currentColor" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-tight text-white leading-none uppercase">{BUSINESS_INFO.name}</h1>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#d4bca9] font-bold">{BUSINESS_INFO.subName}</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-xs font-bold text-stone-300 hover:text-[#b5967a] transition-colors uppercase tracking-[0.2em]"
            >
              {link.name}
            </a>
          ))}
          <a 
            href={dynamicBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#b5967a] hover:bg-[#a38569] text-white px-8 py-3 rounded-full text-xs font-black transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-[#b5967a]/10 uppercase tracking-widest flex items-center gap-2"
          >
            <Phone size={14} />
            Marcar Agora
          </a>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-[#b5967a]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#1a1714] border-t border-[#b5967a]/20 animate-in slide-in-from-top duration-300 shadow-2xl">
          <div className="flex flex-col p-8 gap-6">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                className="text-lg font-medium text-stone-100 hover:text-[#b5967a] transition-colors uppercase tracking-widest"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <a 
              href={dynamicBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#b5967a] text-white text-center py-5 rounded-2xl font-black shadow-lg uppercase tracking-widest"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Marcar Agora
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { 
  LogOut, Heart, LayoutDashboard, Settings, 
  Briefcase, Palette, Download, Menu, X, Wallet 
} from 'lucide-react';
import { Appointment, Service } from '../types';
import { BUSINESS_INFO, CLIENT_ID } from '../constants';
import { COPY } from '../copy';

// SUB-COMPONENTES ADMINISTRATIVOS
import DashboardAppointments from './admin/DashboardAppointments';
import DashboardServices from './admin/DashboardServices';
import DashboardDesign from './admin/DashboardDesign';
import DashboardSettings from './admin/DashboardSettings';
import DashboardCash from './admin/cash/DashboardCash'; // NOVO: Componente do módulo de caixa
import AdminBookingModal from './AdminBookingModal';

interface AdminDashboardProps {
  onLogout: () => void;
  isInstallable?: boolean;
  onInstallClick?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, isInstallable, onInstallClick }) => {
  // --- NAVEGAÇÃO E UI ---
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'cash' | 'visual' | 'settings'>('appointments');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- ESTADOS COMPARTILHADOS (MODAL & SERVIÇOS) ---
  const [isAdminBookingOpen, setIsAdminBookingOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dbServices, setDbServices] = useState<Service[]>([]);

  // Carregar serviços uma única vez para injetar nos sub-componentes e no modal
  useEffect(() => {
    const q = query(collection(db, "businesses", CLIENT_ID, "services"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setDbServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    if (window.confirm(COPY.admin.dashboard.logoutConfirm)) {
      await auth.signOut();
      onLogout();
    }
  };

  const handleEditAppointment = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setIsAdminBookingOpen(true);
  };

  const handleNewBooking = () => {
    setSelectedAppointment(null);
    setIsAdminBookingOpen(true);
  };

  const handleTabChange = (tab: 'appointments' | 'services' | 'cash' | 'visual' | 'settings') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Fecha o menu ao trocar de aba no mobile
  };

  const menuItems = [
    { id: 'appointments', label: COPY.admin.dashboard.tabs.appointments, icon: <LayoutDashboard size={20} /> },
    { id: 'services', label: COPY.admin.dashboard.tabs.services, icon: <Briefcase size={20} /> },
    { id: 'cash', label: COPY.admin.dashboard.tabs.cash, icon: <Wallet size={20} /> }, // NOVO
    { id: 'visual', label: COPY.admin.dashboard.tabs.design, icon: <Palette size={20} /> },
    { id: 'settings', label: COPY.admin.dashboard.tabs.settings, icon: <Settings size={20} /> },
  ];

  return (
    <div className="fixed inset-0 z-[120] bg-brand-bg flex flex-col text-left overflow-hidden font-sans">
      
      {/* HEADER ADMINISTRATIVO PREMIUM */}
      <header className="bg-brand-card border-b border-stone-200 p-4 md:p-5 z-30 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          
          {/* LOGO E IDENTIDADE */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Heart size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-serif font-bold text-primary-dark uppercase tracking-tight truncate max-w-[150px] md:max-w-none">
                {BUSINESS_INFO.name}
              </h1>
              <p className="text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 italic">
                {COPY.admin.dashboard.headerBadge}
              </p>
            </div>
          </div>

          {/* NAVEGAÇÃO DESKTOP (Pills) */}
          <nav className="hidden lg:flex bg-stone-100 p-1 rounded-2xl border border-stone-200 overflow-x-auto no-scrollbar">
            <div className="flex gap-1">
              {menuItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handleTabChange(item.id as any)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all tracking-wider shrink-0 ${
                    activeTab === item.id 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
          
          {/* AÇÕES (Desktop e Mobile Trigger) */}
          <div className="flex items-center gap-2 md:gap-4">
            {isInstallable && (
              <button 
                onClick={onInstallClick} 
                className="hidden md:flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-primary/20"
              >
                <Download size={15} /> Instalar
              </button>
            )}
            
            <button 
              onClick={handleSignOut} 
              className="hidden md:flex text-stone-400 hover:text-red-600 transition-colors items-center gap-2 font-bold text-sm"
            >
              <LogOut size={18} /> 
              <span className="uppercase tracking-widest text-[11px]">{COPY.admin.dashboard.logout}</span>
            </button>

            {/* HAMBÚRGUER MOBILE TRIGGER */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 bg-primary text-white rounded-xl shadow-lg active:scale-95 transition-all"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* MENU MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-brand-footer/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <nav className="absolute right-4 top-24 left-4 bg-brand-card rounded-[2rem] border border-primary/20 shadow-2xl p-6 space-y-3 animate-in slide-in-from-top-4 duration-300">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-4 ml-2">Navegação</p>
            {menuItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleTabChange(item.id as any)}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === item.id 
                  ? 'bg-primary text-white shadow-xl translate-x-2' 
                  : 'bg-stone-50 text-stone-600 border border-stone-100'
                }`}
              >
                <span className={activeTab === item.id ? 'text-white' : 'text-primary'}>{item.icon}</span>
                <span className="uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
            
            <div className="pt-4 mt-4 border-t border-stone-100 flex flex-col gap-3">
              {isInstallable && (
                <button onClick={onInstallClick} className="w-full flex items-center gap-4 p-5 rounded-2xl bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">
                  <Download size={20} /> Instalar Aplicação
                </button>
              )}
              <button onClick={handleSignOut} className="w-full flex items-center gap-4 p-5 rounded-2xl bg-red-50 text-red-500 text-sm font-bold uppercase tracking-widest">
                <LogOut size={20} /> {COPY.admin.dashboard.logout}
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-brand-bg pb-8">
        <div className="container mx-auto max-w-6xl h-full">
          {activeTab === 'appointments' && (
            <DashboardAppointments 
              onEditAppointment={handleEditAppointment} 
              onNewBooking={handleNewBooking}
            />
          )}
          
          {activeTab === 'services' && (
            <DashboardServices />
          )}

          {activeTab === 'cash' && (
            <DashboardCash />
          )}

          {activeTab === 'visual' && (
            <DashboardDesign />
          )}

          {activeTab === 'settings' && (
            <DashboardSettings />
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="hidden md:flex p-3 text-center text-stone-400 text-[9px] uppercase font-bold tracking-[0.4em] bg-brand-card border-t border-stone-200 justify-center items-center gap-2">
        <span>Sistema de Gestão {BUSINESS_INFO.name} • {COPY.footer.devTag}</span>
      </footer>

      {/* MODAL MANTIDO PELO PAI */}
      <AdminBookingModal 
        isOpen={isAdminBookingOpen} 
        onClose={() => setIsAdminBookingOpen(false)} 
        services={dbServices} 
        initialData={selectedAppointment}
      />
    </div>
  );
};

export default AdminDashboard;
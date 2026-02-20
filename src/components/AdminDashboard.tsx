import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { 
  LogOut, Heart, LayoutDashboard, Settings, 
  Briefcase, Palette, Download 
} from 'lucide-react';
import { Appointment, Service } from '../types';
import { BUSINESS_INFO, CLIENT_ID } from '../constants';
import { COPY } from '../copy';

// SUB-COMPONENTES ADMINISTRATIVOS
import DashboardAppointments from './admin/DashboardAppointments';
import DashboardServices from './admin/DashboardServices';
import DashboardDesign from './admin/DashboardDesign';
import DashboardSettings from './admin/DashboardSettings';
import AdminBookingModal from './AdminBookingModal';

interface AdminDashboardProps {
  onLogout: () => void;
  isInstallable?: boolean;
  onInstallClick?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, isInstallable, onInstallClick }) => {
  // --- NAVEGAÇÃO ---
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'visual' | 'settings'>('appointments');
  
  // --- ESTADOS COMPARTILHADOS (MODAL & SERVIÇOS) ---
  const [isAdminBookingOpen, setIsAdminBookingOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dbServices, setDbServices] = useState<Service[]>([]);

  // Carregar serviços uma única vez no componente pai para injetar nos sub-componentes e no modal
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

  return (
    <div className="fixed inset-0 z-[120] bg-brand-bg flex flex-col text-left overflow-hidden font-sans">
      
      {/* HEADER ADMINISTRATIVO PREMIUM */}
      <header className="bg-brand-card border-b border-stone-200 p-4 md:p-5 z-30 shadow-sm">
        <div className="container mx-auto flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
          
          {/* LOGO E IDENTIDADE DO NEGÓCIO */}
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Heart size={20} className="md:w-6 md:h-6" fill="currentColor" />
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

            {/* Logout & PWA Mobile */}
            <div className="flex items-center gap-3 lg:hidden">
              {isInstallable && (
                <button 
                  onClick={onInstallClick} 
                  className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20"
                >
                  <Download size={18} />
                </button>
              )}
              <button 
                onClick={handleSignOut} 
                className="p-2.5 text-stone-400 hover:text-red-500 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* NAVEGAÇÃO POR ABAS (TAB BAR) */}
          <nav className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex flex-nowrap gap-1">
              <TabButton 
                active={activeTab === 'appointments'} 
                onClick={() => setActiveTab('appointments')} 
                icon={<LayoutDashboard size={14} />} 
                label={COPY.admin.dashboard.tabs.appointments} 
              />
              <TabButton 
                active={activeTab === 'services'} 
                onClick={() => setActiveTab('services')} 
                icon={<Briefcase size={14} />} 
                label={COPY.admin.dashboard.tabs.services} 
              />
              <TabButton 
                active={activeTab === 'visual'} 
                onClick={() => setActiveTab('visual')} 
                icon={<Palette size={14} />} 
                label={COPY.admin.dashboard.tabs.design} 
              />
              <TabButton 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')} 
                icon={<Settings size={14} />} 
                label={COPY.admin.dashboard.tabs.settings} 
              />
            </div>
          </nav>
          
          {/* BOTÕES DE AÇÃO DESKTOP */}
          <div className="hidden lg:flex items-center gap-6">
            {isInstallable && (
              <button 
                onClick={onInstallClick} 
                className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-primary/20"
              >
                <Download size={15} /> Instalar App
              </button>
            )}
            <button 
              onClick={handleSignOut} 
              className="text-stone-400 hover:text-red-600 transition-colors flex items-center gap-2 font-bold text-sm"
            >
              <LogOut size={18} /> 
              <span className="uppercase tracking-widest text-[11px]">{COPY.admin.dashboard.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO DINÂMICO */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-brand-bg pb-24 md:pb-8">
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

          {activeTab === 'visual' && (
            <DashboardDesign />
          )}

          {activeTab === 'settings' && (
            <DashboardSettings />
          )}
        </div>
      </main>

      {/* RODAPÉ DO PAINEL */}
      <footer className="hidden md:flex p-3 text-center text-stone-400 text-[9px] uppercase font-bold tracking-[0.4em] bg-brand-card border-t border-stone-200 justify-center items-center gap-2">
        <span>Sistema de Gestão {BUSINESS_INFO.name} • {COPY.footer.devTag}</span>
        {isInstallable && <span className="text-primary">• PWA Enabled</span>}
      </footer>

      {/* MODAL DE AGENDAMENTO (ADMIN) */}
      <AdminBookingModal 
        isOpen={isAdminBookingOpen} 
        onClose={() => setIsAdminBookingOpen(false)} 
        services={dbServices} 
        initialData={selectedAppointment}
      />
    </div>
  );
};

// COMPONENTE AUXILIAR PARA BOTÕES DA NAVBAR
const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2 rounded-xl text-[10px] md:text-xs font-black transition-all shrink-0 whitespace-nowrap tracking-wider ${
      active 
      ? 'bg-primary text-white shadow-md' 
      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
    }`}
  >
    {icon} {label}
  </button>
);

export default AdminDashboard;
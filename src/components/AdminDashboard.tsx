import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { 
  LogOut, Heart, LayoutDashboard, Settings, 
  Briefcase, Palette, Download 
} from 'lucide-react';
import { Appointment, Service } from '../types';
import { BUSINESS_INFO, CLIENT_ID } from '../constants';

// Sub-componentes
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
  
  // --- ESTADOS COMPARTILHADOS PARA O MODAL ---
  const [isAdminBookingOpen, setIsAdminBookingOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dbServices, setDbServices] = useState<Service[]>([]);

  // Carregar serviços apenas uma vez no pai para compartilhar com o modal
  useEffect(() => {
    const q = query(collection(db, "businesses", CLIENT_ID, "services"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setDbServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    if (window.confirm("Deseja sair do sistema de gestão?")) {
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
    <div className="fixed inset-0 z-[120] bg-stone-950 flex flex-col text-left overflow-hidden font-sans">
      
      {/* HEADER DINÂMICO E RESPONSIVO */}
      <header className="bg-stone-900 border-b border-[#b5967a]/20 p-4 md:p-6 z-30 shadow-2xl">
        <div className="container mx-auto flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
          
          {/* Logo e Nome - Mais compactos no Mobile */}
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#b5967a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#b5967a]/20">
                <Heart size={20} className="md:w-6 md:h-6" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-serif font-bold text-white uppercase tracking-tight truncate max-w-[150px] md:max-w-none">
                  {BUSINESS_INFO.name}
                </h1>
                <p className="text-[#d4bca9] text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Gestão Premium</p>
              </div>
            </div>

            {/* Logout Mobile (só aparece no topo se estiver em ecrã pequeno) */}
            <div className="flex items-center gap-3 lg:hidden">
              {isInstallable && (
                <button onClick={onInstallClick} className="p-2.5 bg-[#b5967a]/10 text-[#b5967a] rounded-xl border border-[#b5967a]/20">
                  <Download size={18} />
                </button>
              )}
              <button onClick={handleSignOut} className="p-2.5 text-stone-500 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Navegação por Abas - Scroll Horizontal no Mobile */}
          <nav className="flex bg-stone-800/40 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex flex-nowrap gap-1">
              <TabButton 
                active={activeTab === 'appointments'} 
                onClick={() => setActiveTab('appointments')} 
                icon={<LayoutDashboard size={14} />} 
                label="MARCAÇÕES" 
              />
              <TabButton 
                active={activeTab === 'services'} 
                onClick={() => setActiveTab('services')} 
                icon={<Briefcase size={14} />} 
                label="SERVIÇOS" 
              />
              <TabButton 
                active={activeTab === 'visual'} 
                onClick={() => setActiveTab('visual')} 
                icon={<Palette size={14} />} 
                label="DESIGN" 
              />
              <TabButton 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')} 
                icon={<Settings size={14} />} 
                label="CONFIG" 
              />
            </div>
          </nav>
          
          {/* Logout Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {isInstallable && (
              <button 
                onClick={onInstallClick} 
                className="flex items-center gap-2 bg-[#b5967a]/20 text-[#b5967a] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#b5967a] hover:text-white transition-all border border-[#b5967a]/30"
              >
                <Download size={16} /> Instalar App
              </button>
            )}
            <button onClick={handleSignOut} className="text-stone-500 hover:text-red-500 transition-colors flex items-center gap-2 font-bold text-sm">
              <LogOut size={18} /> <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO DINÂMICO - Ajuste de padding para Mobile */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-stone-950 pb-20 md:pb-8">
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

      {/* Footer minimalista */}
      <footer className="hidden md:flex p-4 text-center text-stone-800 text-[10px] uppercase font-bold tracking-[0.4em] bg-stone-950 border-t border-white/5 justify-center items-center gap-2">
        <span>Sistema de Gestão Stacy Costa • Allan Dev v3.6</span>
        {isInstallable && <span className="text-[#b5967a]">• PWA Ready</span>}
      </footer>

      {/* MODAL ÚNICO GERENCIADO PELO PAI */}
      <AdminBookingModal 
        isOpen={isAdminBookingOpen} 
        onClose={() => setIsAdminBookingOpen(false)} 
        services={dbServices} 
        initialData={selectedAppointment}
      />
    </div>
  );
};

// Componente auxiliar TabButton com suporte a Touch Targets menores
const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
      active 
      ? 'bg-[#b5967a] text-white shadow-lg' 
      : 'text-stone-400 hover:text-stone-200'
    }`}
  >
    {icon} {label}
  </button>
);

export default AdminDashboard;
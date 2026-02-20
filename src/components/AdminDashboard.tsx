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
    <div className="fixed inset-0 z-[120] bg-[#f9fafb] flex flex-col text-left overflow-hidden font-sans">
      
      {/* HEADER PREMIUM LIGHT */}
      <header className="bg-white border-b border-stone-200 p-4 md:p-5 z-30 shadow-sm">
        <div className="container mx-auto flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
          
          {/* Logo e Nome - Tons Escuros sobre Fundo Branco */}
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#b5967a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#b5967a]/20">
                <Heart size={20} className="md:w-6 md:h-6" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-serif font-bold text-stone-800 uppercase tracking-tight truncate max-w-[150px] md:max-w-none">
                  {BUSINESS_INFO.name}
                </h1>
                <p className="text-[#b5967a] text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 italic">Painel de Gestão</p>
              </div>
            </div>

            {/* Logout Mobile */}
            <div className="flex items-center gap-3 lg:hidden">
              {isInstallable && (
                <button onClick={onInstallClick} className="p-2.5 bg-[#b5967a]/10 text-[#b5967a] rounded-xl border border-[#b5967a]/20">
                  <Download size={18} />
                </button>
              )}
              <button onClick={handleSignOut} className="p-2.5 text-stone-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Navegação por Abas - Estilo Pilulado Light */}
          <nav className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 overflow-x-auto no-scrollbar scroll-smooth">
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
                className="flex items-center gap-2 bg-[#b5967a]/10 text-[#b5967a] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#b5967a] hover:text-white transition-all border border-[#b5967a]/20"
              >
                <Download size={15} /> Instalar App
              </button>
            )}
            <button onClick={handleSignOut} className="text-stone-400 hover:text-red-600 transition-colors flex items-center gap-2 font-bold text-sm">
              <LogOut size={18} /> <span className="uppercase tracking-widest text-[11px]">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO DINÂMICO - Fundo Claro */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f9fafb] pb-24 md:pb-8">
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

      {/* Footer minimalista Light */}
      <footer className="hidden md:flex p-3 text-center text-stone-400 text-[9px] uppercase font-bold tracking-[0.4em] bg-white border-t border-stone-200 justify-center items-center gap-2">
        <span>Sistema de Gestão Stacy Costa • Allan Dev v3.7</span>
        {isInstallable && <span className="text-[#b5967a]">• PWA Enabled</span>}
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

// Componente auxiliar TabButton Light Mode
const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2 rounded-xl text-[10px] md:text-xs font-black transition-all shrink-0 whitespace-nowrap tracking-wider ${
      active 
      ? 'bg-[#b5967a] text-white shadow-md' 
      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
    }`}
  >
    {icon} {label}
  </button>
);

export default AdminDashboard;
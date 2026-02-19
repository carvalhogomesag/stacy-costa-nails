import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { 
  LogOut, Scissors, LayoutDashboard, Settings, 
  Briefcase, Palette, Loader2 
} from 'lucide-react';
import { Appointment, Service } from '../types';
import { BUSINESS_INFO, CLIENT_ID } from '../constants';

// Sub-componentes (Vamos criar a seguir)
import DashboardAppointments from './admin/DashboardAppointments';
import DashboardServices from './admin/DashboardServices';
import DashboardDesign from './admin/DashboardDesign';
import DashboardSettings from './admin/DashboardSettings';
import AdminBookingModal from './AdminBookingModal';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
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
    if (window.confirm("Deseja sair do sistema?")) {
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
      
      {/* HEADER SLIM */}
      <header className="bg-stone-900 border-b border-emerald-900/20 p-6 z-30 shadow-2xl">
        <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Scissors size={24} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white uppercase tracking-tight">{BUSINESS_INFO.name}</h2>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest leading-none mt-1">Gestão WaaS</p>
            </div>
          </div>

          <nav className="flex bg-stone-800/40 p-1 rounded-2xl border border-white/5 overflow-x-auto max-w-full no-scrollbar">
            <TabButton 
              active={activeTab === 'appointments'} 
              onClick={() => setActiveTab('appointments')} 
              icon={<LayoutDashboard size={16} />} 
              label="MARCAÇÕES" 
            />
            <TabButton 
              active={activeTab === 'services'} 
              onClick={() => setActiveTab('services')} 
              icon={<Briefcase size={16} />} 
              label="SERVIÇOS" 
            />
            <TabButton 
              active={activeTab === 'visual'} 
              onClick={() => setActiveTab('visual')} 
              icon={<Palette size={16} />} 
              label="DESIGN" 
            />
            <TabButton 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
              icon={<Settings size={16} />} 
              label="CONFIG" 
            />
          </nav>
          
          <button onClick={handleSignOut} className="text-stone-500 hover:text-red-500 transition-colors flex items-center gap-2 font-bold text-sm">
            <LogOut size={18} /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* CONTEÚDO DINÂMICO */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-stone-950">
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

      <footer className="p-4 text-center text-stone-800 text-[10px] uppercase font-bold tracking-[0.4em] bg-stone-950 border-t border-white/5">
        Powered by Allan Dev • SaaS Multi-tenant
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

// Componente auxiliar para os botões da Tab
const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
      active ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-400 hover:text-stone-200'
    }`}
  >
    {icon} {label}
  </button>
);

export default AdminDashboard;
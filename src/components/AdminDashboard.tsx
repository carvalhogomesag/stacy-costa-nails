// src/components/AdminDashboard.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase';
import { onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { 
  LogOut, Heart, LayoutDashboard, Settings, 
  Briefcase, Palette, Download, Menu, X, Wallet,
  Users, UserCog, ShieldCheck
} from 'lucide-react';
import { Appointment, Service, UserRole } from '../types';
import { BUSINESS_INFO, CLIENT_ID } from '../constants';
import { COPY } from '../copy';
import { useAuth } from '../context/AuthContext'; // Importação do motor de segurança

// SUB-COMPONENTES ADMINISTRATIVOS
import DashboardAppointments from './admin/DashboardAppointments';
import DashboardServices from './admin/DashboardServices';
import DashboardDesign from './admin/DashboardDesign';
import DashboardSettings from './admin/DashboardSettings';
import DashboardCash from './admin/cash/DashboardCash';
import CustomerDashboard from './admin/crm/CustomerDashboard';
import DashboardTeam from './admin/DashboardTeam'; // Módulo de Equipa Integrado (Fase 2)
import AdminBookingModal from './AdminBookingModal';

interface AdminDashboardProps {
  onLogout: () => void;
  isInstallable?: boolean;
  onInstallClick?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, isInstallable, onInstallClick }) => {
  // --- SEGURANÇA E PERMISSÕES (Fase 1) ---
  const { userData, role, isAdmin, logout } = useAuth();

  // --- NAVEGAÇÃO E UI ---
  const [activeTab, setActiveTab] = useState<string>('appointments');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- ESTADOS COMPARTILHADOS ---
  const [isAdminBookingOpen, setIsAdminBookingOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dbServices, setDbServices] = useState<Service[]>([]);

  // Carregar serviços para o modal e sub-componentes
  useEffect(() => {
    const q = query(collection(db, "businesses", CLIENT_ID, "services"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setDbServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    if (window.confirm(COPY.admin.dashboard.logoutConfirm)) {
      await logout();
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // --- LÓGICA DE FILTRAGEM DE MENU (RBAC) ---
  const menuItems = useMemo(() => {
    const allItems = [
      { id: 'appointments', label: COPY.admin.dashboard.tabs.appointments, icon: <LayoutDashboard size={20} />, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.PROFESSIONAL, UserRole.RECEPTION] },
      { id: 'crm', label: COPY.admin.dashboard.tabs.crm, icon: <Users size={20} />, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION, UserRole.PROFESSIONAL] },
      { id: 'cash', label: COPY.admin.dashboard.tabs.cash, icon: <Wallet size={20} />, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION] },
      { id: 'team', label: COPY.admin.dashboard.tabs.team, icon: <ShieldCheck size={20} />, roles: [UserRole.OWNER, UserRole.MANAGER] },
      { id: 'services', label: COPY.admin.dashboard.tabs.services, icon: <Briefcase size={20} />, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION] },
      { id: 'visual', label: COPY.admin.dashboard.tabs.design, icon: <Palette size={20} />, roles: [UserRole.OWNER, UserRole.MANAGER] },
      { id: 'settings', label: COPY.admin.dashboard.tabs.settings, icon: <Settings size={20} />, roles: [UserRole.OWNER, UserRole.MANAGER] },
    ];

    // Filtra itens que a Role atual não tem permissão para ver
    return allItems.filter(item => role && item.roles.includes(role));
  }, [role]);

  return (
    <div className="fixed inset-0 z-[120] bg-brand-bg flex flex-col text-left overflow-hidden font-sans">
      
      {/* HEADER ADMINISTRATIVO PREMIUM */}
      <header className="bg-brand-card border-b border-stone-200 p-4 md:p-5 z-30 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          
          {/* LOGO E IDENTIDADE DO UTILIZADOR */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              {isAdmin ? <ShieldCheck size={20} fill="currentColor" /> : <Heart size={20} fill="currentColor" />}
            </div>
            <div>
              <h1 className="text-sm md:text-lg font-serif font-bold text-primary-dark uppercase tracking-tight truncate max-w-[120px] md:max-w-none">
                {userData?.fullName || BUSINESS_INFO.name}
              </h1>
              <p className="text-primary text-[8px] md:text-[9px] font-black uppercase tracking-widest leading-none mt-0.5 italic">
                {role ? role : COPY.admin.dashboard.headerBadge}
              </p>
            </div>
          </div>

          {/* NAVEGAÇÃO DESKTOP DINÂMICA */}
          <nav className="hidden lg:flex bg-stone-100 p-1 rounded-2xl border border-stone-200 overflow-x-auto no-scrollbar">
            <div className="flex gap-1">
              {menuItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all tracking-wider shrink-0 ${
                    activeTab === item.id 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
          
          {/* AÇÕES DE SISTEMA */}
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

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 bg-primary text-white rounded-xl shadow-lg active:scale-95 transition-all"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* MENU MOBILE OVERLAY DINÂMICO */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-brand-footer/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <nav className="absolute right-4 top-24 left-4 bg-brand-card rounded-[2rem] border border-primary/20 shadow-2xl p-6 space-y-3 animate-in slide-in-from-top-4 duration-300">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-4 ml-2">Painel {role}</p>
            {menuItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleTabChange(item.id)}
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
              <button onClick={handleSignOut} className="w-full flex items-center gap-4 p-5 rounded-2xl bg-red-50 text-red-500 text-sm font-bold uppercase tracking-widest">
                <LogOut size={20} /> {COPY.admin.dashboard.logout}
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ÁREA DE CONTEÚDO DINÂMICO PROTEGIDA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-brand-bg pb-8">
        <div className="container mx-auto max-w-6xl h-full">
          
          {/* Acesso: Todos */}
          {activeTab === 'appointments' && (
            <DashboardAppointments 
              onEditAppointment={handleEditAppointment} 
              onNewBooking={handleNewBooking}
            />
          )}
          
          {/* Acesso: Todos */}
          {activeTab === 'crm' && (
            <CustomerDashboard />
          )}

          {/* Acesso: OWNER, MANAGER, RECEPTION */}
          {activeTab === 'cash' && (role !== UserRole.PROFESSIONAL) && (
            <DashboardCash />
          )}

          {/* Acesso: OWNER, MANAGER, RECEPTION */}
          {activeTab === 'services' && (role !== UserRole.PROFESSIONAL) && (
            <DashboardServices />
          )}

          {/* Acesso: OWNER, MANAGER (Módulo de Equipa Real) */}
          {activeTab === 'team' && isAdmin && (
            <DashboardTeam />
          )}

          {/* Acesso: OWNER, MANAGER */}
          {activeTab === 'visual' && isAdmin && (
            <DashboardDesign />
          )}

          {/* Acesso: OWNER, MANAGER */}
          {activeTab === 'settings' && isAdmin && (
            <DashboardSettings />
          )}
        </div>
      </main>

      {/* RODAPÉ DO PAINEL */}
      <footer className="hidden md:flex p-3 text-center text-stone-400 text-[9px] uppercase font-bold tracking-[0.4em] bg-brand-card border-t border-stone-200 justify-center items-center gap-2">
        <span>SISTEMA DE GESTÃO • {userData?.fullName} • {role}</span>
      </footer>

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
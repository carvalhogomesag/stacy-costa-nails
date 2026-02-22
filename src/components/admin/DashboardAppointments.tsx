// src/components/admin/DashboardAppointments.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, QueryConstraint } from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, Clock, Loader2, 
  Plus, LayoutList, CalendarDays, Trash2, Filter, Users 
} from 'lucide-react';
import { Appointment, TimeBlock, Service, UserRole, AppUser } from '../../types';
import AdminCalendar from '../AdminCalendar';
import { CLIENT_ID } from '../../constants';
import { COPY } from '../../copy';
import { useAuth } from '../../context/AuthContext';
import { listActiveProfessionals } from '../../services/authService';

interface DashboardAppointmentsProps {
  onEditAppointment: (appt: Appointment) => void;
  onNewBooking: () => void;
}

const DashboardAppointments: React.FC<DashboardAppointmentsProps> = ({ 
  onEditAppointment, 
  onNewBooking 
}) => {
  // --- SEGURANÇA E CONTEXTO ---
  const { userData, role, isAdmin } = useAuth();
  const isReception = role === UserRole.RECEPTION;
  const isOnlyProfessional = role === UserRole.PROFESSIONAL;

  // --- ESTADOS DE UI E FILTROS ---
  const [appointmentsMode, setAppointmentsMode] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState(true);
  
  // Filtro de Profissional (Fase 1: Multi-utilizador)
  // Se for Profissional, o filtro é fixo no seu UID. Se for Admin/Receção, pode filtrar por 'all' ou UID.
  const [selectedProfessional, setSelectedProfessional] = useState<string | 'all'>(
    isOnlyProfessional ? userData?.uid || '' : 'all'
  );
  const [professionals, setProfessionals] = useState<AppUser[]>([]);

  // --- ESTADOS DE DADOS ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [dbServices, setDbServices] = useState<Service[]>([]);

  // Helper para data local YYYY-MM-DD
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. CARREGAR LISTA DE PROFISSIONAIS (Para o seletor de Admin/Receção)
  useEffect(() => {
    if (!isOnlyProfessional) {
      const fetchTeam = async () => {
        const team = await listActiveProfessionals();
        setProfessionals(team);
      };
      fetchTeam();
    }
  }, [isOnlyProfessional]);

  // 2. ESCUTAR AGENDAMENTOS E BLOQUEIOS (Respeitando a Role e o Filtro)
  useEffect(() => {
    setLoading(true);
    const todayStr = formatDateLocal(new Date());
    
    // --- QUERY DINÂMICA DE AGENDAMENTOS ---
    const apptConstraints: QueryConstraint[] = [
      where("date", ">=", todayStr),
      orderBy("date", "asc")
    ];

    // Aplicar filtro de profissional se não estiver em visão global ('all')
    if (selectedProfessional !== 'all') {
      apptConstraints.push(where("professionalId", "==", selectedProfessional));
    }

    const qApp = query(
      collection(db, "businesses", CLIENT_ID, "appointments"), 
      ...apptConstraints
    );

    const unsubApp = onSnapshot(qApp, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      setLoading(false);
    });

    // --- QUERY DINÂMICA DE BLOQUEIOS ---
    const blockConstraints: QueryConstraint[] = [];
    if (selectedProfessional !== 'all') {
      // Mostra bloqueios do profissional + bloqueios globais (sem professionalId)
      // Nota: Firestore não faz OR complexo facilmente, simplificamos para o filtro selecionado
      blockConstraints.push(where("professionalId", "==", selectedProfessional));
    }

    const unsubBlocks = onSnapshot(
      query(collection(db, "businesses", CLIENT_ID, "timeBlocks"), ...blockConstraints), 
      (snap) => {
        setTimeBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeBlock)));
      }
    );

    // 3. ESCUTAR SERVIÇOS (Legenda)
    const unsubServices = onSnapshot(collection(db, "businesses", CLIENT_ID, "services"), (snap) => {
      setDbServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    });

    return () => { unsubApp(); unsubBlocks(); unsubServices(); };
  }, [selectedProfessional]);

  const handleDeleteApp = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(COPY.admin.appointments.deleteConfirm)) {
      try {
        await deleteDoc(doc(db, "businesses", CLIENT_ID, "appointments", id));
      } catch (error) {
        alert("Erro ao eliminar marcação.");
      }
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-primary">
        <Loader2 className="animate-spin mb-4" size={24} />
        <p className="text-stone-500 font-medium tracking-widest uppercase text-[8px]">A carregar agenda...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col overflow-hidden">
      
      {/* CABEÇALHO DA AGENDA COM FILTROS DE EQUIPA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 px-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-primary w-5 h-5 md:w-6 md:h-6"/> 
            <h3 className="text-primary-dark font-bold text-base md:text-lg uppercase tracking-tight">
              {COPY.admin.appointments.title}
            </h3>
          </div>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest ml-1">
            {selectedProfessional === 'all' ? 'Vista Global da Equipa' : `Agenda: ${professionals.find(p => p.uid === selectedProfessional)?.fullName || 'Profissional'}`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          
          {/* SELETOR DE PROFISSIONAL (Apenas para Admin/Receção) */}
          {!isOnlyProfessional && (
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-1.5 shadow-sm">
              <Users size={14} className="text-stone-400" />
              <select 
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase tracking-tight outline-none text-primary-dark cursor-pointer"
              >
                <option value="all">Toda a Equipa</option>
                {professionals.map(p => (
                  <option key={p.uid} value={p.uid}>{p.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Botão Nova Marcação */}
          <button 
            onClick={onNewBooking}
            className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all shadow-lg active:scale-95 uppercase tracking-wider"
          >
            <Plus size={16} strokeWidth={3} /> {COPY.admin.appointments.newBtn}
          </button>

          {/* Selector de Vista (Calendário / Lista) */}
          <div className="flex bg-stone-100 border border-stone-200 p-1 rounded-xl shadow-inner">
            <button 
              onClick={() => setAppointmentsMode('calendar')} 
              className={`p-2 rounded-lg transition-all ${appointmentsMode === 'calendar' ? 'bg-white text-primary shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
              title="Vista de Calendário"
            >
              <CalendarDays size={18}/>
            </button>
            <button 
              onClick={() => setAppointmentsMode('list')} 
              className={`p-2 rounded-lg transition-all ${appointmentsMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
              title="Vista de Lista"
            >
              <LayoutList size={18}/>
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className="flex-1 min-h-0">
        {appointmentsMode === 'calendar' ? (
          <AdminCalendar 
            appointments={appointments} 
            timeBlocks={timeBlocks} 
            services={dbServices}
            onEditAppointment={onEditAppointment} 
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto h-full pr-1 pb-10">
            {appointments.length === 0 ? (
              <div className="col-span-full bg-white border border-dashed border-stone-200 rounded-[2rem] py-20 text-center px-6">
                <p className="text-stone-400 italic text-sm font-light">{COPY.admin.appointments.empty}</p>
                <button onClick={onNewBooking} className="mt-4 text-primary font-bold uppercase text-[10px] tracking-widest hover:underline">+ Criar primeira marcação</button>
              </div>
            ) : (
              appointments.map(app => (
                <div 
                  key={app.id} 
                  onClick={() => onEditAppointment(app)}
                  className="bg-brand-card border border-stone-100 p-5 rounded-[2rem] relative group shadow-sm hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                      <span 
                        className="w-max px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-black/5"
                        style={{ backgroundColor: app.serviceColor || '#f5f5f4', color: 'rgba(0,0,0,0.6)' }}
                      >
                        {app.serviceName}
                      </span>
                      {selectedProfessional === 'all' && (
                        <span className="text-[8px] font-bold text-stone-400 uppercase italic ml-1">
                          Prof: {app.professionalName}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => handleDeleteApp(e, app.id!)} 
                      className="text-stone-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                  
                  <div className="text-primary-dark font-bold text-base leading-tight mb-2">{app.clientName}</div>
                  
                  <div className="flex items-center justify-between border-t border-stone-50 pt-3">
                    <div className="text-stone-400 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-tighter">
                      <Clock size={12} className="text-primary" />
                      {new Date(app.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} • {app.startTime}
                    </div>
                    {app.isPaid && (
                      <span className="bg-green-50 text-green-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-green-100 uppercase">Pago</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAppointments;
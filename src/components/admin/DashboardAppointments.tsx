import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, Clock, Loader2, 
  Plus, LayoutList, CalendarDays, Trash2 
} from 'lucide-react';
import { Appointment, TimeBlock } from '../../types';
import AdminCalendar from '../AdminCalendar';
import { CLIENT_ID } from '../../constants';
import { COPY } from '../../copy';

interface DashboardAppointmentsProps {
  onEditAppointment: (appt: Appointment) => void;
  onNewBooking: () => void;
}

const DashboardAppointments: React.FC<DashboardAppointmentsProps> = ({ 
  onEditAppointment, 
  onNewBooking 
}) => {
  const [appointmentsMode, setAppointmentsMode] = useState<'calendar' | 'list'>('calendar');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Escutar Agendamentos (Multi-tenant)
    const qApp = query(
      collection(db, "businesses", CLIENT_ID, "appointments"), 
      where("date", ">=", today), 
      orderBy("date", "asc")
    );
    const unsubApp = onSnapshot(qApp, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      setLoading(false);
    });

    // 2. Escutar Bloqueios
    const unsubBlocks = onSnapshot(collection(db, "businesses", CLIENT_ID, "timeBlocks"), (snap) => {
      setTimeBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeBlock)));
    });

    return () => { unsubApp(); unsubBlocks(); };
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-primary">
        <Loader2 className="animate-spin mb-4" size={24} />
        <p className="text-stone-500 font-medium tracking-widest uppercase text-[8px]">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col overflow-hidden">
      
      {/* Cabeçalho da Aba - COMPACTAÇÃO EXTREMA */}
      <div className="flex items-center justify-between mb-2 md:mb-5 gap-2 px-1">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-primary w-4 h-4 md:w-6 md:h-6"/> 
          <h3 className="text-primary-dark font-bold text-sm md:text-lg uppercase tracking-tight">
            {COPY.admin.appointments.title}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão Nova Marcação */}
          <button 
            onClick={onNewBooking}
            className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all shadow-lg active:scale-95 uppercase tracking-wider"
          >
            <Plus size={14} strokeWidth={3} /> <span className="hidden xs:inline">{COPY.admin.appointments.newBtn}</span>
          </button>

          {/* Selector de Vista */}
          <div className="flex bg-stone-100 border border-stone-200 p-0.5 md:p-1 rounded-lg md:rounded-xl">
            <button 
              onClick={() => setAppointmentsMode('calendar')} 
              className={`p-1.5 md:p-2 rounded-md transition-all ${appointmentsMode === 'calendar' ? 'bg-white text-primary shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <CalendarDays size={16}/>
            </button>
            <button 
              onClick={() => setAppointmentsMode('list')} 
              className={`p-1.5 md:p-2 rounded-md transition-all ${appointmentsMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <LayoutList size={16}/>
            </button>
          </div>
        </div>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 min-h-0">
        {appointmentsMode === 'calendar' ? (
          <AdminCalendar 
            appointments={appointments} 
            timeBlocks={timeBlocks} 
            onEditAppointment={onEditAppointment} 
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto h-full pr-1">
            {appointments.length === 0 ? (
              <div className="col-span-full bg-white border border-dashed border-stone-200 rounded-2xl py-10 text-center px-6">
                <p className="text-stone-400 italic text-xs font-light">{COPY.admin.appointments.empty}</p>
              </div>
            ) : (
              appointments.map(app => (
                <div 
                  key={app.id} 
                  onClick={() => onEditAppointment(app)}
                  className="bg-brand-footer/90 border border-white/5 p-4 rounded-2xl relative group shadow-lg hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-primary/10 text-primary-light px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-primary/20">
                      {app.serviceName}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteApp(e, app.id!)} 
                      className="text-stone-500 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                  <div className="text-white font-bold text-sm leading-tight mb-1">{app.clientName}</div>
                  <div className="text-stone-400 text-[10px] font-medium flex items-center gap-1.5">
                    <Clock size={10} className="text-primary" />
                    {app.startTime} - {app.endTime}
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
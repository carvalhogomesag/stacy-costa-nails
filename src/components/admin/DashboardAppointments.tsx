import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, Phone, Clock, Loader2, 
  Plus, LayoutList, CalendarDays, Trash2 
} from 'lucide-react';
import { Appointment, TimeBlock } from '../../types';
import AdminCalendar from '../AdminCalendar';
import { CLIENT_ID } from '../../constants';

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
    
    // 1. Escutar Agendamentos
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
    if (window.confirm("Eliminar esta marcação definitivamente?")) {
      try {
        await deleteDoc(doc(db, "businesses", CLIENT_ID, "appointments", id));
      } catch (error) {
        alert("Erro ao eliminar marcação.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#b5967a]">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-stone-500 font-medium tracking-widest uppercase text-[10px]">A carregar agenda...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      
      {/* Cabeçalho da Aba - Otimizado para Mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-[#b5967a] w-5 h-5 md:w-6 md:h-6"/> 
          <h3 className="text-white font-bold text-base md:text-lg uppercase tracking-tight">
            Agenda de Reservas
          </h3>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Botão Nova Marcação mais compacto */}
          <button 
            onClick={onNewBooking}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#b5967a] hover:bg-[#a38569] text-white px-4 py-2.5 rounded-xl text-[11px] font-black transition-all shadow-lg active:scale-95 uppercase tracking-wider"
          >
            <Plus size={14} /> MARCAÇÃO
          </button>

          {/* Selector de Vista compacto */}
          <div className="flex bg-stone-900 border border-white/5 p-1 rounded-xl">
            <button 
              onClick={() => setAppointmentsMode('calendar')} 
              className={`p-2 rounded-lg transition-all ${appointmentsMode === 'calendar' ? 'bg-stone-800 text-[#b5967a]' : 'text-stone-600'}`}
              title="Vista de Calendário"
            >
              <CalendarDays size={18}/>
            </button>
            <button 
              onClick={() => setAppointmentsMode('list')} 
              className={`p-2 rounded-lg transition-all ${appointmentsMode === 'list' ? 'bg-stone-800 text-[#b5967a]' : 'text-stone-600'}`}
              title="Vista de Lista"
            >
              <LayoutList size={18}/>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Dinâmico */}
      {appointmentsMode === 'calendar' ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <AdminCalendar 
            appointments={appointments} 
            timeBlocks={timeBlocks} 
            onEditAppointment={onEditAppointment} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.length === 0 ? (
            <div className="col-span-full bg-stone-900/50 border border-dashed border-white/10 rounded-2xl py-12 text-center px-6">
              <p className="text-stone-600 italic text-sm font-light">Sem marcações registadas para os próximos dias.</p>
            </div>
          ) : (
            appointments.map(app => (
              <div 
                key={app.id} 
                onClick={() => onEditAppointment(app)}
                className="bg-stone-900 border border-white/5 p-4 md:p-5 rounded-2xl relative group shadow-lg hover:border-[#b5967a]/30 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-[#b5967a]/10 text-[#b5967a] px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#b5967a]/20">
                    {app.serviceName}
                  </span>
                  <button 
                    onClick={(e) => handleDeleteApp(e, app.id!)} 
                    className="text-stone-700 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
                
                <div className="text-white font-bold text-base leading-tight mb-2">{app.clientName}</div>
                
                <div className="flex flex-col gap-1.5">
                  <div className="text-stone-400 text-[11px] font-medium flex items-center gap-2">
                    <Clock size={12} className="text-[#b5967a]" />
                    {new Date(app.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} • {app.startTime} - {app.endTime}
                  </div>
                  <div className="flex items-center gap-2 text-[#d4bca9] font-bold text-[11px]">
                    <Phone size={12} className="text-[#b5967a]" /> {app.clientPhone}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardAppointments;
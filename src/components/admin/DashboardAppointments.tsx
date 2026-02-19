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
      <div className="flex flex-col items-center justify-center h-64 text-emerald-500">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-stone-500 font-medium">A carregar agenda...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      {/* Cabeçalho da Aba */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h3 className="text-white font-bold flex items-center gap-3 text-lg">
          <CalendarIcon className="text-emerald-500" size={24}/> 
          Agenda de Reservas
        </h3>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={onNewBooking}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            <Plus size={16} /> NOVA MARCAÇÃO
          </button>

          <div className="flex bg-stone-900 border border-white/5 p-1 rounded-xl">
            <button 
              onClick={() => setAppointmentsMode('calendar')} 
              className={`p-2 rounded-lg transition-all ${appointmentsMode === 'calendar' ? 'bg-stone-800 text-emerald-500' : 'text-stone-600 hover:text-stone-400'}`}
              title="Vista de Calendário"
            >
              <CalendarDays size={20}/>
            </button>
            <button 
              onClick={() => setAppointmentsMode('list')} 
              className={`p-2 rounded-lg transition-all ${appointmentsMode === 'list' ? 'bg-stone-800 text-emerald-500' : 'text-stone-600 hover:text-stone-400'}`}
              title="Vista de Lista"
            >
              <LayoutList size={20}/>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Dinâmico: Calendário ou Lista */}
      {appointmentsMode === 'calendar' ? (
        <AdminCalendar 
          appointments={appointments} 
          timeBlocks={timeBlocks} 
          onEditAppointment={onEditAppointment} 
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.length === 0 ? (
            <div className="col-span-full bg-stone-900/50 border border-dashed border-white/10 rounded-[2.5rem] py-20 text-center">
              <p className="text-stone-600 italic">Sem marcações registadas para os próximos dias.</p>
            </div>
          ) : (
            appointments.map(app => (
              <div 
                key={app.id} 
                onClick={() => onEditAppointment(app)}
                className="bg-stone-900 border border-white/5 p-6 rounded-[2.5rem] relative group shadow-lg hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <span className="bg-emerald-600/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {app.serviceName}
                </span>
                <div className="mt-4 text-white font-bold text-lg leading-tight">{app.clientName}</div>
                <div className="text-stone-400 text-sm mt-2 font-medium">
                  {new Date(app.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} • {app.startTime} - {app.endTime}
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Phone size={14}/> {app.clientPhone}
                </div>
                <button 
                  onClick={(e) => handleDeleteApp(e, app.id!)} 
                  className="absolute top-6 right-6 text-stone-700 hover:text-red-500 transition-colors"
                  title="Eliminar Marcação"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardAppointments;
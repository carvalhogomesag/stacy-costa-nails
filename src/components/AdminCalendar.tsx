import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Heart,
  Settings // Ícone que estava a faltar na importação
} from 'lucide-react';
import { Appointment, TimeBlock } from '../types';

interface AdminCalendarProps {
  appointments: Appointment[];
  timeBlocks: TimeBlock[];
  onEditAppointment: (appt: Appointment) => void;
}

const AdminCalendar: React.FC<AdminCalendarProps> = ({ appointments, timeBlocks, onEditAppointment }) => {
  const [viewDate, setViewDate] = useState(new Date());

  // --- CONFIGURAÇÃO DA GRADE ESTILO FRESHA ---
  const HOUR_HEIGHT = 65; 
  const START_HOUR = 8;   
  const END_HOUR = 21;    
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  // Mapeamento de cores para os cards (Estilo Fresha - Tons Pastéis)
  const getServiceColor = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('gel')) return 'bg-rose-100 border-rose-200 text-rose-700';
    if (name.includes('alongamento')) return 'bg-amber-100 border-amber-200 text-amber-700';
    if (name.includes('pedi')) return 'bg-emerald-100 border-emerald-200 text-emerald-700';
    return 'bg-stone-100 border-stone-200 text-stone-700';
  };

  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(viewDate);
  const weekRangeLabel = `${weekDays[0].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} - ${weekDays[5].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`;

  const changeWeek = (offset: number) => {
    const next = new Date(viewDate);
    next.setDate(viewDate.getDate() + (offset * 7));
    setViewDate(next);
  };

  const getTimeData = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = (h * 60 + m) - (START_HOUR * 60);
    return { top: (totalMinutes / 60) * HOUR_HEIGHT };
  };

  const calculateHeight = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    return (duration / 60) * HOUR_HEIGHT;
  };

  const isBlockActiveOnDay = (block: TimeBlock, targetDate: Date) => {
    const blockDate = new Date(block.date);
    blockDate.setHours(0,0,0,0);
    const target = new Date(targetDate);
    target.setHours(0,0,0,0);
    if (target.getTime() === blockDate.getTime()) return true;
    if (!block.isRecurring || target < blockDate) return false;
    const diffDays = Math.round((target.getTime() - blockDate.getTime()) / (1000 * 60 * 60 * 24));
    const repeats = block.repeatCount || 0;
    switch (block.recurringType) {
      case 'daily': return diffDays <= repeats;
      case 'weekly': return diffDays % 7 === 0 && diffDays / 7 <= repeats;
      case 'monthly': return target.getDate() === blockDate.getDate() && (target.getMonth() - blockDate.getMonth() + (12 * (target.getFullYear() - blockDate.getFullYear()))) <= repeats;
      default: return false;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500 overflow-hidden font-sans">
      
      {/* HEADER ULTRA CLEAN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b border-stone-100 bg-white gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setViewDate(new Date())} 
            className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg transition-colors"
          >
            Hoje
          </button>
          <div className="flex items-center bg-stone-50 rounded-lg border border-stone-100">
            <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-stone-200 rounded-l-lg text-stone-500 transition-colors border-r border-stone-100"><ChevronLeft size={16}/></button>
            <span className="px-4 text-[11px] font-bold text-stone-600 uppercase tracking-wider">{weekRangeLabel}</span>
            <button onClick={() => changeWeek(1)} className="p-2 hover:bg-stone-200 rounded-r-lg text-stone-500 transition-colors"><ChevronRight size={16}/></button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
           <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-3 border-r border-stone-100">Vista Semanal</span>
           <Settings size={16} className="text-stone-400 cursor-pointer hover:text-stone-600" />
        </div>
      </div>

      {/* ÁREA DA GRADE EXPANDIDA */}
      <div className="flex-1 overflow-auto bg-[#F9FAFB] relative scrollbar-thin scrollbar-thumb-stone-200">
        <div className="min-w-[800px] md:min-w-[1100px] relative bg-white">
          
          {/* CABEÇALHO DOS DIAS - STICKY TOP */}
          <div className="sticky top-0 z-30 grid grid-cols-[70px_1fr_1fr_1fr_1fr_1fr_1fr] bg-white border-b border-stone-100">
            <div className="bg-stone-50/50 border-r border-stone-100"></div>
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`py-4 text-center border-r border-stone-100 last:border-0 ${isToday ? 'bg-stone-50' : ''}`}>
                  <p className={`text-[10px] font-bold uppercase mb-1 ${isToday ? 'text-[#b5967a]' : 'text-stone-400'}`}>
                    {day.toLocaleDateString('pt-PT', { weekday: 'short' })}
                  </p>
                  <p className={`text-xl font-medium ${isToday ? 'text-white bg-[#b5967a] w-9 h-9 flex items-center justify-center rounded-full mx-auto' : 'text-stone-700'}`}>
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="relative grid grid-cols-[70px_1fr_1fr_1fr_1fr_1fr_1fr]">
            
            {/* HORAS LATERAIS - STICKY LEFT */}
            <div className="bg-white border-r border-stone-100 sticky left-0 z-20 shadow-[5px_0_15px_rgba(0,0,0,0.02)]">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="text-right pr-3 text-[10px] font-medium text-stone-400 border-b border-stone-50" 
                  style={{ height: `${HOUR_HEIGHT}px`, lineHeight: `${HOUR_HEIGHT}px` }}
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* COLUNAS DOS DIAS */}
            {weekDays.map((day, colIdx) => {
              const dateStr = day.toISOString().split('T')[0];
              const dayAppointments = appointments.filter(a => a.date === dateStr);
              const dayBlocks = timeBlocks.filter(b => isBlockActiveOnDay(b, day));

              return (
                <div key={colIdx} className="relative border-r border-stone-100 last:border-0 bg-white group">
                  {/* Linhas horizontais de fundo */}
                  {hours.map(h => (
                    <div key={h} className="border-b border-stone-50" style={{ height: `${HOUR_HEIGHT}px` }} />
                  ))}

                  {/* BLOQUEIOS (CAMADA INFERIOR) */}
                  {dayBlocks.map(block => {
                    const { top } = getTimeData(block.startTime);
                    const height = calculateHeight(block.startTime, block.endTime);
                    return (
                      <div
                        key={block.id}
                        className="absolute left-0 right-0 z-10 bg-stone-50/80 border-y border-stone-100 flex items-center justify-center overflow-hidden pointer-events-none"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <Lock size={12} className="text-stone-300" />
                      </div>
                    );
                  })}

                  {/* AGENDAMENTOS (ESTILO FRESHA) */}
                  {dayAppointments.map(app => {
                    const { top } = getTimeData(app.startTime);
                    const height = calculateHeight(app.startTime, app.endTime);
                    const colorClasses = getServiceColor(app.serviceName);

                    return (
                      <div
                        key={app.id}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditAppointment(app); }}
                        className={`absolute left-1 right-1 z-40 rounded-md border-l-[4px] p-2 shadow-sm transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-95 group overflow-hidden ${colorClasses}`}
                        style={{ top: `${top + 2}px`, height: `${height - 4}px` }}
                      >
                        <div className="flex flex-col h-full pointer-events-none">
                          <div className="flex justify-between items-start">
                             <p className="text-[11px] font-bold truncate leading-tight">{app.clientName}</p>
                             <p className="text-[9px] font-medium opacity-70 whitespace-nowrap">{app.startTime}</p>
                          </div>
                          <p className="text-[9px] font-medium truncate mt-0.5 opacity-80">{app.serviceName}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LEGENDA SLIM NO RODAPÉ */}
      <div className="p-3 bg-white border-t border-stone-100 flex gap-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-3 h-3 rounded bg-rose-100 border border-rose-200"></div>
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">Manicure Gel</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">Alongamento</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div>
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">Pedicure</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;
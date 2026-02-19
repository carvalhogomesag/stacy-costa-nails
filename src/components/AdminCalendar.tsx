import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Scissors, 
  Lock, 
  Calendar as CalendarIcon,
  Heart
} from 'lucide-react';
import { Appointment, TimeBlock } from '../types';

interface AdminCalendarProps {
  appointments: Appointment[];
  timeBlocks: TimeBlock[];
  onEditAppointment: (appt: Appointment) => void;
}

const AdminCalendar: React.FC<AdminCalendarProps> = ({ appointments, timeBlocks, onEditAppointment }) => {
  const [viewDate, setViewDate] = useState(new Date());

  // --- CONFIGURAÇÃO DA GRADE ---
  const HOUR_HEIGHT = 80; // pixels por hora
  const START_HOUR = 8;   // 08:00
  const END_HOUR = 21;    // 21:00
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  // --- LÓGICA DE DATAS (SEMANA) ---
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Segunda como primeiro dia
    start.setDate(diff);
    
    return Array.from({ length: 6 }, (_, i) => { // Segunda a Sábado
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(viewDate);
  const weekRangeLabel = `${weekDays[0].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} - ${weekDays[5].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const changeWeek = (offset: number) => {
    const next = new Date(viewDate);
    next.setDate(viewDate.getDate() + (offset * 7));
    setViewDate(next);
  };

  // --- AUXILIARES DE POSICIONAMENTO ---
  const getTimeData = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = (h * 60 + m) - (START_HOUR * 60);
    return {
      top: (totalMinutes / 60) * HOUR_HEIGHT,
      minutes: totalMinutes
    };
  };

  const calculateHeight = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    return (duration / 60) * HOUR_HEIGHT;
  };

  // --- VERIFICAÇÃO DE BLOQUEIOS RECORRENTES ---
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
      case 'daily':
        return diffDays <= repeats;
      case 'weekly':
        return diffDays % 7 === 0 && diffDays / 7 <= repeats;
      case 'monthly':
        return target.getDate() === blockDate.getDate() && 
               (target.getMonth() - blockDate.getMonth() + (12 * (target.getFullYear() - blockDate.getFullYear()))) <= repeats;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700">
      
      {/* CABEÇALHO DA AGENDA - PALETA NUDE/BRONZE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#b5967a] p-2.5 rounded-xl shadow-lg shadow-[#b5967a]/20 text-white">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight uppercase tracking-tight">Vista Semanal</h3>
            <p className="text-[#d4bca9] text-[10px] font-black uppercase tracking-[0.2em]">{weekRangeLabel}</p>
          </div>
        </div>

        <div className="flex items-center bg-stone-900 border border-white/5 p-1 rounded-2xl">
          <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-all">
            <ChevronLeft size={20}/>
          </button>
          <button 
            onClick={() => setViewDate(new Date())} 
            className="px-4 py-2 text-[10px] font-black text-stone-300 hover:text-[#b5967a] transition-colors uppercase tracking-widest"
          >
            HOJE
          </button>
          <button onClick={() => changeWeek(1)} className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-all">
            <ChevronRight size={20}/>
          </button>
        </div>
      </div>

      {/* ÁREA DA GRADE */}
      <div className="flex-1 overflow-x-auto rounded-[2.5rem] border border-white/5 bg-stone-950/50 shadow-2xl">
        <div className="min-w-[850px] relative">
          
          {/* DIAS DA SEMANA */}
          <div className="sticky top-0 z-30 grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr] bg-stone-900 border-b border-white/10">
            <div className="p-4 border-r border-white/5"></div>
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`p-4 text-center border-r border-white/5 last:border-0 ${isToday ? 'bg-[#b5967a]/5' : ''}`}>
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] mb-1">
                    {day.toLocaleDateString('pt-PT', { weekday: 'short' })}
                  </p>
                  <p className={`text-xl font-serif font-bold ${isToday ? 'text-[#b5967a]' : 'text-white'}`}>
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CORPO DA GRADE */}
          <div className="relative grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr]">
            
            {/* HORAS LATERAIS */}
            <div className="bg-stone-900/30 border-r border-white/5 shadow-inner">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="text-right pr-4 text-[10px] font-bold text-stone-600 border-b border-white/[0.03]"
                  style={{ height: `${HOUR_HEIGHT}px`, paddingTop: '6px' }}
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
                <div key={colIdx} className="relative border-r border-white/[0.05] last:border-0 pointer-events-auto group">
                  {/* Linhas de fundo */}
                  {hours.map(h => (
                    <div key={h} className="border-b border-white/[0.02]" style={{ height: `${HOUR_HEIGHT}px` }} />
                  ))}

                  {/* BLOQUEIOS (BACKGROUND) */}
                  {dayBlocks.map(block => {
                    const { top } = getTimeData(block.startTime);
                    const height = calculateHeight(block.startTime, block.endTime);
                    return (
                      <div
                        key={block.id}
                        className="absolute left-0 right-0 z-10 bg-stone-800/40 backdrop-blur-[1px] border-y border-white/5 flex items-center justify-center overflow-hidden pointer-events-none"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="flex items-center gap-1.5 opacity-20 rotate-[-5deg]">
                          <Lock size={12} className="text-white" />
                          <span className="text-[9px] font-black text-white uppercase tracking-tighter">Bloqueado</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* AGENDAMENTOS (BRONZE THEME) */}
                  {dayAppointments.map(app => {
                    const { top } = getTimeData(app.startTime);
                    const height = calculateHeight(app.startTime, app.endTime);
                    return (
                      <div
                        key={app.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation(); 
                          onEditAppointment(app);
                        }}
                        className="absolute left-1.5 right-1.5 z-40 rounded-2xl bg-stone-900 border-l-4 border-[#b5967a] p-2.5 shadow-2xl ring-1 ring-white/5 hover:ring-[#b5967a]/50 hover:bg-stone-800 hover:scale-[1.02] hover:z-50 transition-all cursor-pointer group/card select-none"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="flex flex-col h-full overflow-hidden pointer-events-none">
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-[9px] font-black text-[#b5967a] uppercase leading-none tracking-widest truncate pr-1">
                              {app.startTime}
                            </span>
                            <Heart size={10} className="text-stone-700 group-hover/card:text-[#b5967a] transition-colors shrink-0" />
                          </div>
                          <p className="text-xs font-bold text-white truncate leading-tight group-hover/card:text-[#d4bca9] transition-colors">
                            {app.clientName}
                          </p>
                          {height > 45 && (
                            <p className="text-[10px] text-stone-500 font-medium truncate mt-1">
                              {app.serviceName}
                            </p>
                          )}
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

      {/* LEGENDA - ATUALIZADA */}
      <div className="mt-6 flex gap-6 px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#b5967a] shadow-lg shadow-[#b5967a]/40"></div>
          <span className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em]">Marcações (Clicar p/ Editar)</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-stone-800 border border-white/5"></div>
          <span className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em]">Bloqueios</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;
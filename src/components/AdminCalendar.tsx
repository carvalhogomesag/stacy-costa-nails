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

  // --- CONFIGURAÇÃO DA GRADE COMPACTA ---
  const HOUR_HEIGHT = 60; // Reduzido de 80 para 60 para ver mais horas
  const START_HOUR = 8;   
  const END_HOUR = 21;    
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  // --- LÓGICA DE DATAS ---
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

  // --- AUXILIARES DE POSICIONAMENTO ---
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
    <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-hidden">
      
      {/* CABEÇALHO DA AGENDA ULTRA COMPACTO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 md:mb-4 gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="bg-[#b5967a] p-1.5 rounded-md text-white shadow-sm">
            <CalendarIcon size={14} />
          </div>
          <div>
            <h3 className="text-white font-bold text-xs md:text-base uppercase tracking-tight leading-none">Vista Semanal</h3>
            <p className="text-[#d4bca9] text-[8px] md:text-[10px] font-black uppercase tracking-widest">{weekRangeLabel}</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start bg-stone-900 border border-white/5 p-0.5 rounded-lg w-full sm:w-auto">
          <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-stone-800 rounded-md text-stone-400"><ChevronLeft size={16}/></button>
          <button onClick={() => setViewDate(new Date())} className="px-3 py-1 text-[8px] font-black text-stone-300 hover:text-[#b5967a] uppercase tracking-tighter">HOJE</button>
          <button onClick={() => changeWeek(1)} className="p-1.5 hover:bg-stone-800 rounded-md text-stone-400"><ChevronRight size={16}/></button>
        </div>
      </div>

      {/* ÁREA DA GRADE EXPANDIDA */}
      <div className="flex-1 overflow-auto rounded-xl border border-white/5 bg-stone-950 shadow-2xl relative scrollbar-thin scrollbar-thumb-stone-800">
        <div className="min-w-[650px] md:min-w-[900px] relative">
          
          {/* DIAS DA SEMANA - MAIS CURTOS */}
          <div className="sticky top-0 z-30 grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr] md:grid-cols-[70px_1fr_1fr_1fr_1fr_1fr_1fr] bg-stone-900 border-b border-white/10">
            <div className="p-1 border-r border-white/5 bg-stone-900"></div>
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`p-1.5 md:p-3 text-center border-r border-white/5 last:border-0 ${isToday ? 'bg-[#b5967a]/5' : ''}`}>
                  <p className="text-[7px] md:text-[9px] font-black text-stone-500 uppercase mb-0">{day.toLocaleDateString('pt-PT', { weekday: 'short' })}</p>
                  <p className={`text-sm md:text-lg font-serif font-bold ${isToday ? 'text-[#b5967a]' : 'text-white'}`}>{day.getDate()}</p>
                </div>
              );
            })}
          </div>

          <div className="relative grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr] md:grid-cols-[70px_1fr_1fr_1fr_1fr_1fr_1fr]">
            
            {/* HORAS LATERAIS - STICKY */}
            <div className="bg-stone-900/90 border-r border-white/5 sticky left-0 z-20 backdrop-blur-sm shadow-xl">
              {hours.map(hour => (
                <div key={hour} className="text-right pr-2 text-[8px] md:text-[9px] font-bold text-stone-600 border-b border-white/[0.03]" style={{ height: `${HOUR_HEIGHT}px`, lineHeight: `${HOUR_HEIGHT}px` }}>
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
                <div key={colIdx} className="relative border-r border-white/[0.05] last:border-0">
                  {hours.map(h => (
                    <div key={h} className="border-b border-white/[0.02]" style={{ height: `${HOUR_HEIGHT}px` }} />
                  ))}

                  {/* BLOQUEIOS COMPACTOS */}
                  {dayBlocks.map(block => {
                    const { top } = getTimeData(block.startTime);
                    const height = calculateHeight(block.startTime, block.endTime);
                    return (
                      <div key={block.id} className="absolute left-0 right-0 z-10 bg-stone-800/40 border-y border-white/5 flex items-center justify-center overflow-hidden pointer-events-none" style={{ top: `${top}px`, height: `${height}px` }}>
                        <Lock size={8} className="text-white opacity-10" />
                      </div>
                    );
                  })}

                  {/* AGENDAMENTOS COMPACTOS */}
                  {dayAppointments.map(app => {
                    const { top } = getTimeData(app.startTime);
                    const height = calculateHeight(app.startTime, app.endTime);
                    return (
                      <div
                        key={app.id}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditAppointment(app); }}
                        className="absolute left-0.5 right-0.5 z-40 rounded-lg bg-stone-900 border-l-[3px] border-[#b5967a] p-1 shadow-xl ring-1 ring-white/5 hover:bg-stone-800 transition-all cursor-pointer group/card select-none"
                        style={{ top: `${top + 1}px`, height: `${height - 2}px` }}
                      >
                        <div className="flex flex-col h-full overflow-hidden pointer-events-none">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[7px] md:text-[8px] font-black text-[#b5967a] uppercase leading-none tracking-tighter">{app.startTime}</span>
                            <Heart size={7} className="text-stone-700 shrink-0" />
                          </div>
                          <p className="text-[9px] md:text-[11px] font-bold text-white truncate leading-none mb-0.5">{app.clientName}</p>
                          {height > 35 && (
                            <p className="text-[7px] md:text-[9px] text-stone-500 font-medium truncate leading-none uppercase">{app.serviceName}</p>
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

      {/* LEGENDA SLIM */}
      <div className="mt-2 flex gap-4 px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#b5967a]"></div>
          <span className="text-[8px] font-black text-stone-600 uppercase">Marcações</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-stone-800"></div>
          <span className="text-[8px] font-black text-stone-600 uppercase tracking-tighter">Bloqueios</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;
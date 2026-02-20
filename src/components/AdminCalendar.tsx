import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Settings
} from 'lucide-react';
import { Appointment, TimeBlock, Service } from '../types';
import { THEME } from '../theme';

interface AdminCalendarProps {
  appointments: Appointment[];
  timeBlocks: TimeBlock[];
  services: Service[]; // Adicionado para gerar a legenda dinâmica
  onEditAppointment: (appt: Appointment) => void;
}

const AdminCalendar: React.FC<AdminCalendarProps> = ({ appointments, timeBlocks, services, onEditAppointment }) => {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  // --- CONFIGURAÇÃO DA GRADE ---
  const HOUR_HEIGHT = 65; 
  const START_HOUR = 8;   
  const END_HOUR = 21;    
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekDays = (startDate: Date) => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(viewDate);
  const weekRangeLabel = `${weekDays[0].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} - ${weekDays[6].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`;

  const changeDays = (offset: number) => {
    const next = new Date(viewDate);
    next.setDate(viewDate.getDate() + offset);
    setViewDate(next);
  };

  const handleGoToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setViewDate(today);
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
      case 'weekly': return diffDays % 7 === 0 && (diffDays / 7) <= repeats;
      case 'monthly': 
        const monthDiff = (target.getFullYear() - blockDate.getFullYear()) * 12 + (target.getMonth() - blockDate.getMonth());
        return target.getDate() === blockDate.getDate() && monthDiff <= repeats;
      default: return false;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500 overflow-hidden font-sans">
      
      {/* HEADER DA AGENDA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b border-stone-100 bg-white gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGoToToday} 
            className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg transition-colors shadow-sm active:scale-95"
          >
            Hoje
          </button>
          <div className="flex items-center bg-stone-50 rounded-lg border border-stone-100">
            <button onClick={() => changeDays(-7)} className="p-2 hover:bg-stone-200 rounded-l-lg text-stone-500 transition-colors border-r border-stone-100">
              <ChevronLeft size={16}/>
            </button>
            <span className="px-4 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
              {weekRangeLabel}
            </span>
            <button onClick={() => changeDays(7)} className="p-2 hover:bg-stone-200 rounded-r-lg text-stone-500 transition-colors">
              <ChevronRight size={16}/>
            </button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
           <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-3 border-r border-stone-100">Vista de 7 Dias</span>
           <Settings size={16} className="text-stone-400 cursor-pointer hover:text-stone-600" />
        </div>
      </div>

      {/* ÁREA DA GRADE */}
      <div className="flex-1 overflow-auto bg-[#F9FAFB] relative scrollbar-thin scrollbar-thumb-stone-200">
        <div className="inline-grid sm:grid grid-cols-[70px_repeat(7,75vw)] sm:grid-cols-[70px_repeat(7,1fr)] relative bg-white min-h-full">
          
          {/* CABEÇALHO DOS DIAS */}
          <div className="sticky top-0 z-30 col-span-full grid grid-cols-[70px_repeat(7,75vw)] sm:grid-cols-[70px_repeat(7,1fr)] bg-white border-b border-stone-100">
            <div className="bg-stone-50/50 border-r border-stone-100 sticky left-0 z-40"></div>
            {weekDays.map((day, i) => {
              const isToday = formatDateLocal(day) === formatDateLocal(new Date());
              const isFirstColumn = i === 0;
              return (
                <div key={i} className={`py-4 text-center border-r border-stone-100 last:border-0 ${isFirstColumn ? 'bg-primary/[0.03]' : ''} ${isToday ? 'bg-primary/[0.03]' : ''}`}>
                  <p className={`text-[10px] font-bold uppercase mb-1 ${isToday ? 'text-primary' : 'text-stone-400'}`}>
                    {day.toLocaleDateString('pt-PT', { weekday: 'short' })}
                  </p>
                  <p className={`text-xl font-medium ${isToday ? 'text-white bg-primary w-9 h-9 flex items-center justify-center rounded-full mx-auto shadow-lg shadow-primary/20' : 'text-stone-700'}`}>
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* HORAS LATERAIS */}
          <div className="bg-white border-r border-stone-100 sticky left-0 z-20 shadow-[4px_0_10px_rgba(0,0,0,0.03)]">
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
            const dateStr = formatDateLocal(day);
            const dayAppointments = appointments.filter(a => a.date === dateStr);
            const dayBlocks = timeBlocks.filter(b => isBlockActiveOnDay(b, day));
            const isFirstColumn = colIdx === 0;

            return (
              <div key={colIdx} className={`relative border-r border-stone-100 last:border-0 bg-white group ${isFirstColumn ? 'bg-primary/[0.02]' : ''}`}>
                {hours.map(h => (
                  <div key={h} className="border-b border-stone-50" style={{ height: `${HOUR_HEIGHT}px` }} />
                ))}

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

                {dayAppointments.map(app => {
                  const { top } = getTimeData(app.startTime);
                  const height = calculateHeight(app.startTime, app.endTime);
                  
                  // CORREÇÃO: Usa apenas a cor guardada na base de dados
                  const bgColor = app.serviceColor || '#f5f5f4';

                  return (
                    <div
                      key={app.id}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditAppointment(app); }}
                      className="absolute left-1.5 right-1.5 z-40 rounded-xl border-l-[5px] p-3 shadow-sm transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-95 group overflow-hidden"
                      style={{ 
                        top: `${top + 3}px`, 
                        height: `${height - 6}px`,
                        backgroundColor: bgColor,
                        borderLeftColor: 'rgba(0,0,0,0.1)'
                      }}
                    >
                      <div className="flex flex-col h-full pointer-events-none">
                        <div className="flex justify-between items-start mb-1">
                           <p className="text-xs font-bold truncate leading-tight text-primary-dark">{app.clientName}</p>
                           <p className="text-[10px] font-bold opacity-60 text-primary-dark whitespace-nowrap">{app.startTime}</p>
                        </div>
                        <p className="text-[10px] font-medium truncate opacity-80 text-primary-dark uppercase tracking-tighter">{app.serviceName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* LEGENDA DINÂMICA (Baseada nos serviços criados) */}
      <div className="p-3 bg-white border-t border-stone-100 flex gap-6 overflow-x-auto no-scrollbar">
        {services.length === 0 ? (
           <span className="text-[10px] text-stone-400 italic">Crie serviços para ver a legenda.</span>
        ) : (
          services.map((s) => (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <div 
                className="w-3 h-3 rounded border border-black/5" 
                style={{ backgroundColor: s.color || '#f5f5f4' }}
              ></div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">{s.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCalendar;
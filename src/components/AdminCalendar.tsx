// src/components/AdminCalendar.tsx

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Settings,
  User as UserIcon
} from 'lucide-react';
import { Appointment, TimeBlock, Service, UserRole } from '../types';
import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';

interface AdminCalendarProps {
  appointments: Appointment[];
  timeBlocks: TimeBlock[];
  services: Service[];
  onEditAppointment: (appt: Appointment) => void;
}

const AdminCalendar: React.FC<AdminCalendarProps> = ({ 
  appointments, 
  timeBlocks, 
  services, 
  onEditAppointment 
}) => {
  const { userData, role } = useAuth();
  const isOnlyProfessional = role === UserRole.PROFESSIONAL;

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
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500 overflow-hidden font-sans border border-stone-100 rounded-t-[2rem]">
      
      {/* HEADER DA AGENDA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-stone-100 bg-white gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGoToToday} 
            className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
          >
            Hoje
          </button>
          <div className="flex items-center bg-stone-50 rounded-xl border border-stone-100 p-0.5">
            <button onClick={() => changeDays(-7)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-stone-500 transition-all">
              <ChevronLeft size={18}/>
            </button>
            <span className="px-4 text-[10px] font-black text-primary-dark uppercase tracking-widest min-w-[140px] text-center">
              {weekRangeLabel}
            </span>
            <button onClick={() => changeDays(7)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-stone-500 transition-all">
              <ChevronRight size={18}/>
            </button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
           <div className="bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
             <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
               {isOnlyProfessional ? 'A minha Agenda' : 'Vista de Equipa'}
             </span>
           </div>
           <Settings size={16} className="text-stone-300 cursor-pointer hover:text-primary transition-colors" />
        </div>
      </div>

      {/* ÁREA DA GRADE */}
      <div className="flex-1 overflow-auto bg-stone-50/30 relative scrollbar-thin scrollbar-thumb-stone-200">
        <div className="inline-grid sm:grid grid-cols-[70px_repeat(7,75vw)] sm:grid-cols-[70px_repeat(7,1fr)] relative bg-white min-h-full">
          
          {/* CABEÇALHO DOS DIAS (Sticky) */}
          <div className="sticky top-0 z-30 col-span-full grid grid-cols-[70px_repeat(7,75vw)] sm:grid-cols-[70px_repeat(7,1fr)] bg-white border-b border-stone-100 shadow-sm">
            <div className="bg-stone-50/50 border-r border-stone-100 sticky left-0 z-40"></div>
            {weekDays.map((day, i) => {
              const isToday = formatDateLocal(day) === formatDateLocal(new Date());
              return (
                <div key={i} className={`py-4 text-center border-r border-stone-100 last:border-0 ${isToday ? 'bg-primary/[0.03]' : ''}`}>
                  <p className={`text-[10px] font-black uppercase mb-1 ${isToday ? 'text-primary' : 'text-stone-400'}`}>
                    {day.toLocaleDateString('pt-PT', { weekday: 'short' })}
                  </p>
                  <p className={`text-xl font-medium ${isToday ? 'text-white bg-primary w-9 h-9 flex items-center justify-center rounded-full mx-auto shadow-lg shadow-primary/20' : 'text-primary-dark'}`}>
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* HORAS LATERAIS (Sticky) */}
          <div className="bg-white border-r border-stone-100 sticky left-0 z-20 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
            {hours.map(hour => (
              <div 
                key={hour} 
                className="relative border-b border-stone-50" 
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="absolute top-0 right-3 -translate-y-1/2 text-[9px] font-black text-stone-300 bg-white px-1 z-10 uppercase">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* COLUNAS DOS DIAS */}
          {weekDays.map((day, colIdx) => {
            const dateStr = formatDateLocal(day);
            const dayAppointments = appointments.filter(a => a.date === dateStr);
            const dayBlocks = timeBlocks.filter(b => isBlockActiveOnDay(b, day));

            return (
              <div key={colIdx} className="relative border-r border-stone-100 last:border-0 bg-white group hover:bg-stone-50/20 transition-colors">
                {hours.map(h => (
                  <div key={h} className="border-b border-stone-50" style={{ height: `${HOUR_HEIGHT}px` }} />
                ))}

                {/* CAMADA 1: BLOQUEIOS (Fundo) */}
                {dayBlocks.map(block => {
                  const { top } = getTimeData(block.startTime);
                  const height = calculateHeight(block.startTime, block.endTime);
                  return (
                    <div
                      key={block.id}
                      className="absolute left-0 right-0 z-10 bg-stone-100/60 border-y border-stone-200/50 flex items-center justify-center overflow-hidden pointer-events-none backdrop-blur-[1px]"
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <Lock size={12} className="text-stone-300" />
                    </div>
                  );
                })}

                {/* CAMADA 2: AGENDAMENTOS (Interativos) */}
                {dayAppointments.map(app => {
                  const { top } = getTimeData(app.startTime);
                  const height = calculateHeight(app.startTime, app.endTime);
                  const bgColor = app.serviceColor || '#f5f5f4';

                  return (
                    <div
                      key={app.id}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditAppointment(app); }}
                      className="absolute left-1.5 right-1.5 z-40 rounded-xl border-l-[5px] p-2.5 shadow-sm transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 group overflow-hidden"
                      style={{ 
                        top: `${top + 2}px`, 
                        height: `${height - 4}px`,
                        backgroundColor: bgColor,
                        borderLeftColor: 'rgba(0,0,0,0.1)'
                      }}
                    >
                      <div className="flex flex-col h-full pointer-events-none">
                        <div className="flex justify-between items-start mb-0.5">
                           <p className="text-[11px] font-black truncate leading-tight text-primary-dark uppercase tracking-tight">
                             {app.clientName}
                           </p>
                           <p className="text-[9px] font-bold opacity-50 text-primary-dark whitespace-nowrap">
                             {app.startTime}
                           </p>
                        </div>
                        
                        <div className="flex-1 min-h-0">
                          <p className="text-[9px] font-bold truncate opacity-70 text-primary-dark uppercase tracking-tighter">
                            {app.serviceName}
                          </p>
                        </div>

                        {/* INDICADOR DE PROFISSIONAL (Apenas se não for vista individual) */}
                        {!isOnlyProfessional && app.professionalName && (
                          <div className="mt-1 flex items-center gap-1 opacity-60">
                             <UserIcon size={8} className="text-primary-dark" />
                             <span className="text-[8px] font-black text-primary-dark uppercase truncate">
                               {app.professionalName.split(' ')[0]}
                             </span>
                          </div>
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

      {/* LEGENDA DINÂMICA PREMIUM */}
      <div className="p-4 bg-white border-t border-stone-100 flex items-center gap-6 overflow-x-auto no-scrollbar shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <span className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] whitespace-nowrap border-r border-stone-100 pr-6">Legenda de Serviços</span>
        <div className="flex gap-6">
          {services.length === 0 ? (
            <span className="text-[10px] text-stone-400 italic">Configure serviços para ver a legenda.</span>
          ) : (
            services.map((s) => (
              <div key={s.id} className="flex items-center gap-2 shrink-0">
                <div 
                  className="w-2.5 h-2.5 rounded-full border border-black/5 shadow-inner" 
                  style={{ backgroundColor: s.color || '#f5f5f4' }}
                ></div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">{s.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;
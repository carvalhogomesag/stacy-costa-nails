import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, CheckCircle2, ChevronRight, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { Service, Appointment, WorkConfig, TimeBlock } from '../types';
// Importação da conexão e das constantes multi-tenant
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';
import { CLIENT_ID, BUSINESS_INFO } from '../constants';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  // --- ESTADOS DE UI ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // --- ESTADOS DE DADOS ---
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [workConfig, setWorkConfig] = useState<WorkConfig | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<{start: number, end: number}[]>([]);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState({ name: '', phone: '' });

  // 1. Resetar ao fechar (Segurança para não prender o estado)
  useEffect(() => {
    if (!isOpen) {
      setStep(1); 
      setSelectedService(null); 
      setSelectedDate("");
      setSelectedTime(""); 
      setFormData({ name: '', phone: '' });
    }
  }, [isOpen]);

  // 2. Escutar Dados Globais (Multi-tenant)
  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      
      const unsubServ = onSnapshot(query(collection(db, "businesses", CLIENT_ID, "services"), orderBy("name", "asc")), (snap) => {
        setDbServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
      });

      const unsubConfig = onSnapshot(doc(db, "businesses", CLIENT_ID, "config", "work-schedule"), (snap) => {
        if (snap.exists()) setWorkConfig(snap.data() as WorkConfig);
      });

      const unsubBlocks = onSnapshot(collection(db, "businesses", CLIENT_ID, "timeBlocks"), (snap) => {
        setTimeBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeBlock)));
      });

      setLoadingData(false);
      return () => { unsubServ(); unsubConfig(); unsubBlocks(); };
    }
  }, [isOpen]);

  // 3. Buscar Agendamentos Ocupados
  useEffect(() => {
    if (selectedDate && isOpen) {
      const fetchBookings = async () => {
        setLoading(true);
        try {
          const q = query(collection(db, "businesses", CLIENT_ID, "appointments"), where("date", "==", selectedDate));
          const snapshot = await getDocs(q);
          const busy = snapshot.docs.map(doc => {
            const data = doc.data();
            const [sh, sm] = data.startTime.split(':').map(Number);
            const [eh, em] = data.endTime.split(':').map(Number);
            return { start: sh * 60 + sm, end: eh * 60 + em };
          });
          setOccupiedSlots(busy);
        } catch (e) { console.error(e); }
        setLoading(false);
      };
      fetchBookings();
    }
  }, [selectedDate, isOpen]);

  // REGRA DE OURO: Se não estiver aberto, o componente é destruído para libertar o ecrã
  if (!isOpen) return null;

  // --- MOTOR LÓGICO DE FILTRAGEM ---
  const generateAvailableTimes = () => {
    if (!workConfig || !selectedService) return [];
    
    const slots = [];
    const [startH, startM] = workConfig.startHour.split(':').map(Number);
    const [endH, endM] = workConfig.endHour.split(':').map(Number);
    
    let currentMin = startH * 60 + startM;
    const dayEndMin = endH * 60 + endM;
    const interval = 30;

    const breakStart = workConfig.breakStart ? workConfig.breakStart.split(':').map(Number).reduce((h, m) => h * 60 + m) : null;
    const breakEnd = workConfig.breakEnd ? workConfig.breakEnd.split(':').map(Number).reduce((h, m) => h * 60 + m) : null;

    const selectedDayObj = new Date(selectedDate);

    while (currentMin + selectedService.duration <= dayEndMin) {
      const slotEnd = currentMin + selectedService.duration;
      const timeStr = `${Math.floor(currentMin/60).toString().padStart(2,'0')}:${(currentMin%60).toString().padStart(2,'0')}`;

      let isBlocked = false;

      if (breakStart !== null && breakEnd !== null) {
        if (currentMin < breakEnd && slotEnd > breakStart) isBlocked = true;
      }

      if (!isBlocked) {
        isBlocked = occupiedSlots.some(busy => currentMin < busy.end && slotEnd > busy.start);
      }

      if (!isBlocked) {
        isBlocked = timeBlocks.some(block => {
          const [bsh, bsm] = block.startTime.split(':').map(Number);
          const [beh, bem] = block.endTime.split(':').map(Number);
          const bStart = bsh * 60 + bsm;
          const bEnd = beh * 60 + bem;
          const blockStartDate = new Date(block.date);
          const diffTime = selectedDayObj.getTime() - blockStartDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (block.date === selectedDate) return currentMin < bEnd && slotEnd > bStart;

          if (block.isRecurring && diffDays > 0) {
            const repeats = block.repeatCount || 1;
            if (block.recurringType === 'daily' && diffDays < repeats) return currentMin < bEnd && slotEnd > bStart;
            if (block.recurringType === 'weekly' && diffDays % 7 === 0 && (diffDays / 7) < repeats) return currentMin < bEnd && slotEnd > bStart;
            if (block.recurringType === 'monthly') {
               const monthDiff = (selectedDayObj.getFullYear() - blockStartDate.getFullYear()) * 12 + (selectedDayObj.getMonth() - blockStartDate.getMonth());
               if (selectedDayObj.getDate() === blockStartDate.getDate() && monthDiff > 0 && monthDiff < repeats) return currentMin < bEnd && slotEnd > bStart;
            }
          }
          return false;
        });
      }

      if (!isBlocked) slots.push(timeStr);
      currentMin += interval;
    }
    return slots;
  };

  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayOfWeek = d.getDay();
      if (workConfig && !workConfig.daysOff.includes(dayOfWeek)) {
        days.push(d.toISOString().split('T')[0]);
      }
    }
    return days;
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setLoading(true);
    try {
      const [h, m] = selectedTime.split(':').map(Number);
      const endTotal = (h * 60) + m + selectedService.duration;
      const endTimeStr = `${Math.floor(endTotal/60).toString().padStart(2,'0')}:${(endTotal%60).toString().padStart(2,'0')}`;

      await addDoc(collection(db, "businesses", CLIENT_ID, "appointments"), {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        clientName: formData.name,
        clientPhone: formData.phone,
        date: selectedDate,
        startTime: selectedTime,
        endTime: endTimeStr,
        createdAt: serverTimestamp()
      });
      setStep(5);
    } catch (e) { alert("Erro ao realizar a marcação."); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 text-left font-sans">
      {/* OVERLAY ESFUMADO FIXO */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-stone-900 border border-[#b5967a]/30 w-full max-w-lg overflow-hidden rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 z-[160]">
        
        {/* Header - Nude & Gold Style */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-stone-900/50">
          <div>
            <h2 className="text-xl font-bold text-white font-serif tracking-tight uppercase">Marcar Atendimento</h2>
            <p className="text-[#b5967a] text-[10px] uppercase tracking-[0.3em] font-black">{BUSINESS_INFO.name} {BUSINESS_INFO.subName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-stone-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800">
          
          {/* STEP 1: Seleção de Serviços */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <p className="text-stone-400 text-sm mb-4 font-light">Selecione o serviço pretendido:</p>
              
              {loadingData ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#b5967a]" size={32} /></div>
              ) : dbServices.length === 0 ? (
                <p className="text-stone-500 italic text-center py-10">Não existem serviços disponíveis no momento.</p>
              ) : (
                dbServices.map((s) => (
                  <button key={s.id} onClick={() => { setSelectedService(s); setStep(2); }} className="w-full flex justify-between items-center p-5 rounded-2xl bg-stone-950 border border-white/5 hover:border-[#b5967a]/50 group transition-all text-left shadow-lg">
                    <div className="flex-1 pr-4">
                      <h3 className="text-white font-bold group-hover:text-[#d4bca9] transition-colors">{s.name}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-stone-500 text-xs font-medium uppercase tracking-tighter">
                        <Clock size={12} className="text-[#b5967a]"/> {s.duration} min | <span className="text-[#b5967a] font-black">{s.price}</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-stone-700 group-hover:text-[#b5967a] transition-all" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* STEP 2: Seleção de Data */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep(1)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-[#b5967a] transition-colors uppercase tracking-widest font-bold"><ChevronLeft size={14}/> Voltar</button>
              <h3 className="text-white font-bold flex items-center gap-2 text-lg"><Calendar size={18} className="text-[#b5967a]"/> Escolha o melhor dia</h3>
              <div className="grid grid-cols-3 gap-3">
                {getNextDays().map((d) => (
                  <button key={d} onClick={() => { setSelectedDate(d); setStep(3); }} className={`p-4 rounded-2xl border transition-all text-center ${selectedDate === d ? 'bg-[#b5967a] border-[#b5967a] text-white shadow-xl shadow-[#b5967a]/20' : 'bg-stone-950 border-white/5 text-stone-400 hover:border-[#b5967a]/50'}`}>
                    <span className="block text-[10px] uppercase font-black opacity-60 tracking-widest mb-1">{new Date(d).toLocaleDateString('pt-PT', { weekday: 'short' })}</span>
                    <span className="block text-xl font-black">{new Date(d).getDate()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Seleção de Horário */}
          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep(2)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-[#b5967a] transition-colors uppercase tracking-widest font-bold"><ChevronLeft size={14}/> Calendário</button>
              <h3 className="text-white font-bold flex items-center gap-2 text-lg"><Clock size={18} className="text-[#b5967a]"/> Horários para {selectedService?.name}</h3>
              
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#b5967a]" size={32} /></div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {generateAvailableTimes().map((t) => (
                    <button key={t} onClick={() => { setSelectedTime(t); setStep(4); }} className={`p-3 rounded-xl border text-sm font-black transition-all ${selectedTime === t ? 'bg-[#b5967a] border-[#b5967a] text-white shadow-lg' : 'bg-stone-950 border-white/5 text-stone-400 hover:border-[#b5967a] hover:text-white'}`}>{t}</button>
                  ))}
                  {generateAvailableTimes().length === 0 && (
                    <div className="col-span-4 bg-[#b5967a]/5 p-8 rounded-2xl text-[#b5967a] text-xs flex flex-col items-center gap-3 border border-[#b5967a]/10">
                      <AlertCircle size={24}/>
                      <p className="text-center font-bold uppercase tracking-widest">Sem horários para este dia.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Dados Pessoais */}
          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep(3)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-[#b5967a] transition-colors uppercase tracking-widest font-bold"><ChevronLeft size={14}/> Horários</button>
              <h3 className="text-white font-bold flex items-center gap-2 text-lg"><User size={18} className="text-[#b5967a]"/> Confirmação dos teus dados</h3>
              <div className="space-y-4">
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                   <input type="text" placeholder="Teu Nome" className="w-full bg-stone-950 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white outline-none focus:border-[#b5967a]/50 transition-all font-bold placeholder:text-stone-700" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                   <input type="tel" placeholder="Teu Telemóvel" className="w-full bg-stone-950 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white outline-none focus:border-[#b5967a]/50 transition-all font-bold placeholder:text-stone-700" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <button disabled={loading || !formData.name || !formData.phone} onClick={handleBooking} className="w-full py-5 bg-[#b5967a] hover:bg-[#a38569] text-white font-black rounded-2xl transition-all flex justify-center items-center gap-2 shadow-2xl shadow-[#b5967a]/20 active:scale-95 uppercase tracking-widest text-sm">
                {loading ? <Loader2 className="animate-spin" /> : "Finalizar Marcação"}
              </button>
            </div>
          )}

          {/* STEP 5: Sucesso */}
          {step === 5 && (
            <div className="py-12 text-center space-y-6 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-[#b5967a]/10 rounded-full flex items-center justify-center mx-auto text-[#b5967a] shadow-inner border border-[#b5967a]/20">
                <CheckCircle2 size={56} />
              </div>
              <div className="px-4">
                <h3 className="text-3xl font-serif text-white font-bold tracking-tight uppercase">Tudo Pronto!</h3>
                <p className="text-stone-400 mt-4 leading-relaxed font-light">Obrigada <b>{formData.name.split(' ')[0]}</b>! Reservámos o teu momento para dia <b>{new Date(selectedDate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}</b> às <b>{selectedTime}</b>.</p>
              </div>
              <button onClick={onClose} className="w-full py-5 bg-stone-800 hover:bg-stone-700 text-[#d4bca9] font-black rounded-2xl transition-all uppercase tracking-widest text-xs border border-white/5">Fechar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

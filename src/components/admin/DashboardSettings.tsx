import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, doc, onSnapshot, setDoc, 
  addDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Clock, Ban, Save, Repeat, Hash, Trash2, 
  Loader2, LayoutList, AlertCircle
} from 'lucide-react';
import { WorkConfig, TimeBlock } from '../../types';
import { CLIENT_ID } from '../../constants';
import { COPY } from '../../copy';

const DashboardSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  // --- ESTADO DA JORNADA ---
  const [workConfig, setWorkConfig] = useState<WorkConfig>({
    startHour: '09:00', 
    endHour: '19:00', 
    breakStart: '13:00', 
    breakEnd: '14:00', 
    daysOff: [0] 
  });

  // --- ESTADO DOS BLOQUEIOS ---
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [newBlock, setNewBlock] = useState<Partial<TimeBlock>>({
    title: '', 
    date: new Date().toISOString().split('T')[0], 
    startTime: '11:00', 
    endTime: '12:00', 
    isRecurring: false, 
    recurringType: 'weekly', 
    repeatCount: 1 
  });

  const hoursOptions = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${h.toString().padStart(2, '0')}:${m}`;
  });

  useEffect(() => {
    // Escuta Configuração de Horários
    const unsubConfig = onSnapshot(doc(db, "businesses", CLIENT_ID, "config", "work-schedule"), (snap) => {
      if (snap.exists()) {
        setWorkConfig(snap.data() as WorkConfig);
      }
      setLoading(false);
    });

    // Escuta Bloqueios Ativos
    const unsubBlocks = onSnapshot(collection(db, "businesses", CLIENT_ID, "timeBlocks"), (snap) => {
      setTimeBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeBlock)));
    });

    return () => { unsubConfig(); unsubBlocks(); };
  }, []);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await setDoc(doc(db, "businesses", CLIENT_ID, "config", "work-schedule"), {
        ...workConfig,
        updatedAt: serverTimestamp()
      });
      alert("Configuração de horários atualizada!");
    } catch (e) {
      alert("Erro ao salvar configuração.");
    }
    setIsSavingConfig(false);
  };

  const handleAddTimeBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlock.title) return;

    setIsAddingBlock(true);
    try {
      await addDoc(collection(db, "businesses", CLIENT_ID, "timeBlocks"), {
        ...newBlock,
        createdAt: serverTimestamp()
      });
      setNewBlock({ 
        title: '', date: new Date().toISOString().split('T')[0], 
        startTime: '11:00', endTime: '12:00', 
        isRecurring: false, recurringType: 'weekly', repeatCount: 1 
      });
    } catch (e) {
      alert("Erro ao aplicar bloqueio.");
    }
    setIsAddingBlock(false);
  };

  const handleDeleteBlock = async (id: string) => {
    if (window.confirm("Remover este bloqueio da agenda?")) {
      await deleteDoc(doc(db, "businesses", CLIENT_ID, "timeBlocks", id));
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="space-y-8 md:space-y-12 animate-in slide-in-from-bottom-4 pb-20 md:pb-24 font-sans">
      
      {/* SEÇÃO 1: JORNADA DE TRABALHO */}
      <div className="bg-brand-footer/90 border border-primary/20 p-5 md:p-8 rounded-2xl md:rounded-[3rem] shadow-2xl">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
            <Clock size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base md:text-lg uppercase tracking-tight">
              {COPY.admin.settings.workSchedule}
            </h3>
            <p className="text-primary-light text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black">
              {COPY.admin.settings.workSubtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Abertura', key: 'startHour' },
            { label: 'Fecho', key: 'endHour' },
            { label: 'Início Pausa', key: 'breakStart' },
            { label: 'Fim Pausa', key: 'breakEnd' },
          ].map((item) => (
            <div key={item.key} className="space-y-1.5">
              <label className="text-[9px] md:text-[10px] text-stone-500 uppercase font-black ml-1 tracking-widest">{item.label}</label>
              <select 
                value={(workConfig as any)[item.key]} 
                onChange={e => setWorkConfig({...workConfig, [item.key]: e.target.value})}
                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 md:p-4 text-white text-sm outline-none focus:border-primary appearance-none font-bold transition-all shadow-inner"
              >
                {hoursOptions.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 md:pt-8 border-t border-white/5">
          <h4 className="text-stone-400 text-xs font-bold mb-4 flex items-center gap-2">
            <AlertCircle size={14} className="text-primary" /> {COPY.admin.settings.daysOff}:
          </h4>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
              <button 
                key={day} 
                onClick={() => {
                  const newDays = workConfig.daysOff.includes(idx) 
                    ? workConfig.daysOff.filter(d => d !== idx) 
                    : [...workConfig.daysOff, idx];
                  setWorkConfig({...workConfig, daysOff: newDays});
                }} 
                className={`flex-1 min-w-[65px] py-3 rounded-xl text-[10px] font-black transition-all border ${
                  workConfig.daysOff.includes(idx) 
                  ? 'bg-primary border-primary text-white shadow-lg' 
                  : 'bg-black/40 border-white/5 text-stone-600 hover:text-primary-light'
                }`}
              >
                {day.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSaveConfig} 
          disabled={isSavingConfig}
          className="mt-8 md:mt-10 w-full sm:w-auto flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover text-white px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-black shadow-xl transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
        >
          {isSavingConfig ? <Loader2 className="animate-spin" size={18} /> : <Save size={18}/>}
          {COPY.admin.settings.saveBtn}
        </button>
      </div>

      {/* SEÇÃO 2: BLOQUEIOS DE AGENDA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Formulário de Bloqueio */}
        <div className="bg-brand-footer/90 border border-white/5 p-5 md:p-8 rounded-2xl md:rounded-[3rem] shadow-xl space-y-6">
           <div className="flex items-center gap-2">
             <Ban className="text-primary w-5 h-5"/> 
             <h3 className="text-white font-bold text-base md:text-lg uppercase tracking-tight">
               {COPY.admin.settings.blockTitle}
             </h3>
           </div>
           
           <form onSubmit={handleAddTimeBlock} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] md:text-[10px] uppercase text-stone-500 font-bold ml-1 tracking-widest">Motivo</label>
                <input 
                  required 
                  placeholder="Ex: Formação ou Pausa" 
                  value={newBlock.title} 
                  onChange={e => setNewBlock({...newBlock, title: e.target.value})} 
                  className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm text-white outline-none focus:border-primary transition-all" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] md:text-[10px] uppercase text-stone-500 font-bold ml-1 tracking-widest">Data do Bloqueio</label>
                <input 
                  required 
                  type="date" 
                  value={newBlock.date} 
                  onChange={e => setNewBlock({...newBlock, date: e.target.value})} 
                  className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm text-white outline-none focus:border-primary transition-all [color-scheme:dark]" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[9px] md:text-[10px] uppercase text-stone-500 font-bold ml-1 tracking-widest">Início</label>
                   <select value={newBlock.startTime} onChange={e => setNewBlock({...newBlock, startTime: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm text-white font-bold outline-none focus:border-primary">
                      {hoursOptions.map(h => <option key={h} value={h}>{h}</option>)}
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] md:text-[10px] uppercase text-stone-500 font-bold ml-1 tracking-widest">Fim</label>
                   <select value={newBlock.endTime} onChange={e => setNewBlock({...newBlock, endTime: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm text-white font-bold outline-none focus:border-primary">
                      {hoursOptions.map(h => <option key={h} value={h}>{h}</option>)}
                   </select>
                </div>
              </div>

              {/* Recorrência */}
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-4 shadow-inner">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-stone-300 font-bold text-xs uppercase tracking-wider">
                     <Repeat size={16} className="text-primary"/> Recorrência
                   </div>
                   <input 
                    type="checkbox" 
                    checked={newBlock.isRecurring} 
                    onChange={e => setNewBlock({...newBlock, isRecurring: e.target.checked})} 
                    className="w-5 h-5 accent-primary cursor-pointer" 
                   />
                </div>
                {newBlock.isRecurring && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                     <div className="flex gap-1.5">
                       {['daily', 'weekly', 'monthly'].map(type => (
                         <button 
                          key={type} 
                          type="button" 
                          onClick={() => setNewBlock({...newBlock, recurringType: type as any})} 
                          className={`flex-1 py-2.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase border transition-all ${
                            newBlock.recurringType === type 
                            ? 'bg-primary border-primary text-white' 
                            : 'text-stone-500 border-white/5'
                          }`}
                         >
                           {type === 'daily' ? 'Diário' : type === 'weekly' ? 'Semanal' : 'Mensal'}
                         </button>
                       ))}
                     </div>
                     <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                        <span className="text-stone-400 font-bold text-[10px] flex items-center gap-2 uppercase">
                          <Hash size={14} className="text-primary"/> Repetições:
                        </span>
                        <input 
                          type="number" min="1" max="52" 
                          value={newBlock.repeatCount} 
                          onChange={e => setNewBlock({...newBlock, repeatCount: parseInt(e.target.value)})} 
                          className="w-12 bg-black/40 border border-white/5 rounded-md p-1.5 text-white text-center font-bold text-xs outline-none focus:border-primary" 
                        />
                     </div>
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                disabled={isAddingBlock}
                className="w-full py-4 bg-white text-primary-dark font-black rounded-xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-[11px]"
              >
                {isAddingBlock ? <Loader2 className="animate-spin text-primary" size={18} /> : COPY.admin.settings.blockTitle}
              </button>
           </form>
        </div>

        {/* Lista de Bloqueios */}
        <div className="bg-brand-footer/90 border border-white/5 p-5 md:p-8 rounded-2xl md:rounded-[3rem] shadow-xl flex flex-col">
           <div className="flex items-center gap-2 mb-6">
             <LayoutList className="text-primary w-5 h-5"/> 
             <h3 className="text-white font-bold text-base md:text-lg uppercase tracking-tight">
               {COPY.admin.settings.activeBlocks}
             </h3>
           </div>
           
           <div className="space-y-3 overflow-y-auto max-h-[450px] pr-1 scrollbar-thin scrollbar-thumb-stone-800">
              {timeBlocks.length === 0 ? (
                <div className="text-center py-12 text-stone-600 italic font-light text-sm">Nenhum bloqueio ativo.</div>
              ) : (
                timeBlocks.map(block => (
                  <div key={block.id} className="bg-black/40 border border-white/5 p-4 rounded-xl flex justify-between items-center group hover:border-primary/20 transition-all">
                     <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-stone-200 font-bold text-sm truncate">{block.title}</h4>
                          {block.isRecurring && <Repeat size={12} className="text-primary shrink-0"/>}
                        </div>
                        <p className="text-stone-500 text-[10px] uppercase font-black tracking-widest">
                          {new Date(block.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} • {block.startTime}-{block.endTime}
                        </p>
                     </div>
                     <button 
                      onClick={() => handleDeleteBlock(block.id!)} 
                      className="text-stone-700 hover:text-red-500 p-2 transition-colors shrink-0"
                     >
                       <Trash2 size={18}/>
                     </button>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;
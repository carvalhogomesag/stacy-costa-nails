import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, doc, onSnapshot, setDoc, 
  addDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Clock, Ban, Save, Repeat, Hash, Trash2, 
  Loader2, Calendar, LayoutList, AlertCircle
} from 'lucide-react';
import { WorkConfig, TimeBlock } from '../../types';
import { CLIENT_ID } from '../../constants';

const DashboardSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  // --- ESTADO DA JORNADA ---
  const [workConfig, setWorkConfig] = useState<WorkConfig>({
    startHour: '09:00', 
    endHour: '20:00', 
    breakStart: '13:00', 
    breakEnd: '14:00', 
    daysOff: [0] // Domingo por padrão
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

  // Auxiliar para gerar opções de horário
  const hoursOptions = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${h.toString().padStart(2, '0')}:${m}`;
  });

  useEffect(() => {
    // 1. Escutar Configuração de Jornada
    const unsubConfig = onSnapshot(doc(db, "businesses", CLIENT_ID, "config", "work-schedule"), (snap) => {
      if (snap.exists()) {
        setWorkConfig(snap.data() as WorkConfig);
      }
      setLoading(false);
    });

    // 2. Escutar Bloqueios Ativos
    const unsubBlocks = onSnapshot(collection(db, "businesses", CLIENT_ID, "timeBlocks"), (snap) => {
      setTimeBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeBlock)));
    });

    return () => { unsubConfig(); unsubBlocks(); };
  }, []);

  // --- AÇÕES ---
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await setDoc(doc(db, "businesses", CLIENT_ID, "config", "work-schedule"), {
        ...workConfig,
        updatedAt: serverTimestamp()
      });
      alert("Jornada de trabalho atualizada!");
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
      // Resetar formulário de bloqueio
      setNewBlock({ 
        title: '', date: new Date().toISOString().split('T')[0], 
        startTime: '11:00', endTime: '12:00', 
        isRecurring: false, recurringType: 'weekly', repeatCount: 1 
      });
      alert("Horário bloqueado com sucesso.");
    } catch (e) {
      alert("Erro ao aplicar bloqueio.");
    }
    setIsAddingBlock(false);
  };

  const handleDeleteBlock = async (id: string) => {
    if (window.confirm("Remover este bloqueio de agenda?")) {
      await deleteDoc(doc(db, "businesses", CLIENT_ID, "timeBlocks", id));
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 pb-24">
      
      {/* SEÇÃO 1: JORNADA DE TRABALHO */}
      <div className="bg-stone-900 border border-white/5 p-8 rounded-[3rem] shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-500">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Jornada de Trabalho</h3>
            <p className="text-stone-500 text-xs uppercase tracking-widest font-black">Horários de Funcionamento</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Abertura', key: 'startHour' },
            { label: 'Encerramento', key: 'endHour' },
            { label: 'Início Pausa', key: 'breakStart' },
            { label: 'Fim Pausa', key: 'breakEnd' },
          ].map((item) => (
            <div key={item.key}>
              <label className="text-[10px] text-stone-500 uppercase font-black mb-2 block ml-1">{item.label}</label>
              <select 
                value={(workConfig as any)[item.key]} 
                onChange={e => setWorkConfig({...workConfig, [item.key]: e.target.value})}
                className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 appearance-none font-bold transition-all shadow-inner"
              >
                {hoursOptions.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-white/5">
          <h4 className="text-stone-400 text-sm font-bold mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-emerald-500" /> Dias de Encerramento:
          </h4>
          <div className="flex flex-wrap gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
              <button 
                key={day} 
                onClick={() => {
                  const newDays = workConfig.daysOff.includes(idx) 
                    ? workConfig.daysOff.filter(d => d !== idx) 
                    : [...workConfig.daysOff, idx];
                  setWorkConfig({...workConfig, daysOff: newDays});
                }} 
                className={`px-5 py-3 rounded-xl text-xs font-black transition-all border ${
                  workConfig.daysOff.includes(idx) 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                  : 'bg-stone-950 border-white/5 text-stone-600 hover:text-stone-400'
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
          className="mt-10 flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-emerald-900/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSavingConfig ? <Loader2 className="animate-spin" /> : <Save size={20}/>}
          Guardar Configuração
        </button>
      </div>

      {/* SEÇÃO 2: BLOQUEIOS DE AGENDA */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Formulário de Bloqueio */}
        <div className="bg-stone-900 border border-white/5 p-8 rounded-[3rem] shadow-xl">
           <h3 className="text-white font-bold mb-6 flex items-center gap-3 text-lg">
             <Ban className="text-emerald-500"/> Bloquear Horário
           </h3>
           <form onSubmit={handleAddTimeBlock} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-stone-500 font-bold ml-1">Motivo do Bloqueio</label>
                <input 
                  required 
                  placeholder="Ex: Consulta Médica, Almoço Externo..." 
                  value={newBlock.title} 
                  onChange={e => setNewBlock({...newBlock, title: e.target.value})} 
                  className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-stone-500 font-bold ml-1">Data</label>
                <input 
                  required 
                  type="date" 
                  value={newBlock.date} 
                  onChange={e => setNewBlock({...newBlock, date: e.target.value})} 
                  className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 color-scheme-dark transition-all" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] uppercase text-stone-500 font-bold ml-1">Desde as</label>
                   <select value={newBlock.startTime} onChange={e => setNewBlock({...newBlock, startTime: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500 transition-all">
                      {hoursOptions.map(h => <option key={h} value={h}>{h}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] uppercase text-stone-500 font-bold ml-1">Até às</label>
                   <select value={newBlock.endTime} onChange={e => setNewBlock({...newBlock, endTime: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500 transition-all">
                      {hoursOptions.map(h => <option key={h} value={h}>{h}</option>)}
                   </select>
                </div>
              </div>

              {/* Recorrência */}
              <div className="bg-stone-950 border border-white/5 p-5 rounded-2xl space-y-4 shadow-inner">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3 text-stone-300 font-bold text-sm">
                     <Repeat size={18} className="text-emerald-500"/> Tornar Recorrente
                   </div>
                   <input 
                    type="checkbox" 
                    checked={newBlock.isRecurring} 
                    onChange={e => setNewBlock({...newBlock, isRecurring: e.target.checked})} 
                    className="w-6 h-6 accent-emerald-500 cursor-pointer" 
                   />
                </div>
                {newBlock.isRecurring && (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                     <div className="flex gap-2">
                       {['daily', 'weekly', 'monthly'].map(type => (
                         <button 
                          key={type} 
                          type="button" 
                          onClick={() => setNewBlock({...newBlock, recurringType: type as any})} 
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${
                            newBlock.recurringType === type 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'text-stone-500 border-white/5 hover:text-stone-300'
                          }`}
                         >
                           {type === 'daily' ? 'Diário' : type === 'weekly' ? 'Semanal' : 'Mensual'}
                         </button>
                       ))}
                     </div>
                     <div className="flex items-center justify-between bg-stone-900 p-4 rounded-2xl border border-white/5">
                        <span className="text-stone-400 font-bold text-xs flex items-center gap-2">
                          <Hash size={16} className="text-emerald-500"/> Repetir quantas vezes?
                        </span>
                        <input 
                          type="number" min="1" max="52" 
                          value={newBlock.repeatCount} 
                          onChange={e => setNewBlock({...newBlock, repeatCount: parseInt(e.target.value)})} 
                          className="w-16 bg-stone-950 border border-white/5 rounded-lg p-2 text-white text-center font-black outline-none focus:border-emerald-500" 
                        />
                     </div>
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                disabled={isAddingBlock}
                className="w-full py-5 bg-white text-stone-950 font-black rounded-2xl shadow-xl active:scale-95 transition-all hover:bg-emerald-50"
              >
                {isAddingBlock ? <Loader2 className="animate-spin" /> : "Aplicar Bloqueio"}
              </button>
           </form>
        </div>

        {/* Lista de Bloqueios */}
        <div className="bg-stone-900 border border-white/5 p-8 rounded-[3rem] shadow-xl flex flex-col">
           <h3 className="text-white font-bold mb-6 flex items-center gap-3 text-lg">
             <LayoutList className="text-emerald-500"/> Bloqueios Ativos
           </h3>
           <div className="space-y-3 overflow-y-auto max-h-[550px] pr-2 scrollbar-thin scrollbar-thumb-stone-800 text-left">
              {timeBlocks.length === 0 ? (
                <div className="text-center py-10 text-stone-600 italic">Sem bloqueios ativos na agenda.</div>
              ) : (
                timeBlocks.map(block => (
                  <div key={block.id} className="bg-stone-950 border border-white/5 p-5 rounded-2xl flex justify-between items-center animate-in zoom-in-95 hover:border-emerald-900/20 transition-all shadow-md">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-stone-200 font-bold text-sm">{block.title}</h4>
                          {block.isRecurring && <Repeat size={12} className="text-emerald-500"/>}
                        </div>
                        <p className="text-stone-500 text-[10px] uppercase font-black tracking-widest">
                          {block.date} • {block.startTime}-{block.endTime}
                        </p>
                        {block.isRecurring && (
                          <p className="text-emerald-600/60 text-[9px] font-black uppercase mt-1">
                            {block.recurringType} ({block.repeatCount}x)
                          </p>
                        )}
                     </div>
                     <button 
                      onClick={() => handleDeleteBlock(block.id!)} 
                      className="text-stone-800 hover:text-red-500 p-2 transition-colors rounded-full"
                      title="Remover Bloqueio"
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
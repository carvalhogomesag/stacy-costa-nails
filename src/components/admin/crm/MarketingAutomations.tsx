import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Clock, 
  Play, 
  Pause, 
  Trash2, 
  Loader2, 
  X,
  Settings2,
  MessageSquare,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { 
  getCrmAutomations, 
  createCrmAutomation, 
  toggleCrmAutomation,
  getCrmTemplates
} from '../../../services/crmMarketingService';
import { COPY } from '../../../copy';
import { CrmAutomation, CrmAutomationTrigger, CrmTemplate } from '../../../types';

const MarketingAutomations: React.FC = () => {
  const [automations, setAutomations] = useState<CrmAutomation[]>([]);
  const [templates, setTemplates] = useState<CrmTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado do Formulário
  const [newAuto, setNewAuto] = useState({
    title: '',
    trigger: CrmAutomationTrigger.AfterService,
    delayDays: 1,
    templateId: '',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [autosData, templatesData] = await Promise.all([
        getCrmAutomations(),
        getCrmTemplates()
      ]);
      setAutomations(autosData);
      setTemplates(templatesData);
    } catch (error) {
      console.error("Erro ao carregar dados de automação:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuto.title || !newAuto.templateId) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      await createCrmAutomation(newAuto);
      setIsModalOpen(false);
      setNewAuto({ 
        title: '', 
        trigger: CrmAutomationTrigger.AfterService, 
        delayDays: 1, 
        templateId: '', 
        isActive: true 
      });
      loadData();
    } catch (error) {
      alert("Erro ao criar automação.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleCrmAutomation(id, !currentStatus);
      loadData();
    } catch (error) {
      alert("Erro ao alterar estado.");
    }
  };

  const getTriggerLabel = (trigger: CrmAutomationTrigger) => {
    return (COPY.admin.crm.automations.triggers as any)[trigger] || trigger;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-brand-card p-6 rounded-[2rem] border border-stone-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <h3 className="text-primary-dark font-bold text-lg uppercase tracking-tight">
              {COPY.admin.crm.automations.title}
            </h3>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Fluxos de Retenção Ativa</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <Plus size={14} strokeWidth={3} /> {COPY.admin.crm.automations.btnNew}
        </button>
      </div>

      {/* LISTAGEM DE REGRAS */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : automations.length === 0 ? (
          <div className="bg-brand-card border border-dashed border-stone-200 rounded-[2rem] py-16 text-center">
            <p className="text-stone-400 italic text-sm">{COPY.admin.crm.automations.empty}</p>
          </div>
        ) : (
          automations.map((auto) => (
            <div key={auto.id} className={`bg-brand-card border p-6 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${!auto.isActive ? 'opacity-60 grayscale' : 'hover:border-primary/30 shadow-sm'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${auto.isActive ? 'bg-primary text-white' : 'bg-stone-200 text-stone-400'}`}>
                  <Zap size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-primary-dark uppercase tracking-tight text-base mb-1">{auto.title}</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1">
                      <Settings2 size={10} /> {getTriggerLabel(auto.trigger)}
                    </span>
                    <span className="bg-primary/5 text-primary px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1">
                      <Clock size={10} /> {auto.delayDays} Dias de Janela
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="flex flex-col items-end mr-2">
                   <span className="text-[10px] font-black text-stone-400 uppercase">{auto.isActive ? COPY.admin.crm.automations.statusActive : COPY.admin.crm.automations.statusInactive}</span>
                   <p className="text-[9px] text-stone-300 italic">ID Template: {auto.templateId.slice(-6)}</p>
                </div>
                <button 
                  onClick={() => auto.id && handleToggle(auto.id, auto.isActive)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${auto.isActive ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                >
                  {auto.isActive ? <Pause size={20} /> : <Play size={20} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE CONFIGURAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-footer/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form 
            onSubmit={handleSave}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
               <h3 className="text-lg font-bold text-primary-dark uppercase tracking-tight">{COPY.admin.crm.automations.btnNew}</h3>
               <button type="button" onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-primary-dark transition-colors"><X size={24}/></button>
            </div>

            <div className="p-8 space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.automations.form.title}</label>
                  <input required value={newAuto.title} onChange={e => setNewAuto({...newAuto, title: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary" placeholder="Ex: Agradecimento de Manicure" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.automations.form.trigger}</label>
                    <select value={newAuto.trigger} onChange={e => setNewAuto({...newAuto, trigger: e.target.value as any})} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary appearance-none">
                       {Object.values(CrmAutomationTrigger).map(t => (
                         <option key={t} value={t}>{getTriggerLabel(t)}</option>
                       ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.automations.form.delay}</label>
                    <input type="number" min="0" value={newAuto.delayDays} onChange={e => setNewAuto({...newAuto, delayDays: parseInt(e.target.value)})} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary" />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.automations.form.template}</label>
                  {templates.length === 0 ? (
                    <div className="bg-amber-50 p-4 rounded-xl flex items-center gap-3 text-amber-700 text-xs">
                       <AlertCircle size={18} />
                       <p>Precisa de criar um modelo primeiro na aba "Templates".</p>
                    </div>
                  ) : (
                    <select required value={newAuto.templateId} onChange={e => setNewAuto({...newAuto, templateId: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary appearance-none">
                       <option value="">Selecione um modelo...</option>
                       {templates.map(t => (
                         <option key={t.id} value={t.id}>{t.title} ({t.channel})</option>
                       ))}
                    </select>
                  )}
               </div>
            </div>

            <div className="p-6 bg-stone-50 border-t border-stone-100">
              <button type="submit" disabled={templates.length === 0} className="w-full py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all disabled:opacity-50">
                 {COPY.admin.crm.automations.form.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MarketingAutomations;
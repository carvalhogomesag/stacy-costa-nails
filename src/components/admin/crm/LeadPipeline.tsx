import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  ChevronRight, 
  UserCheck, 
  TrendingUp, 
  MessageSquare, 
  MoreHorizontal,
  Loader2,
  X,
  Instagram,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { 
  getLeads, 
  updateLead, 
  createLead, 
  convertLeadToCustomer 
} from '../../../services/crmService';
import { auth } from '../../../firebase';
import { COPY } from '../../../copy';
import { Lead, LeadStage, LeadSource } from '../../../types';
import { formatCurrency } from '../../../utils/cashCalculations';

const LeadPipeline: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Estado para novo Lead
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    source: LeadSource.Instagram,
    stage: LeadStage.New,
    potentialValue: 0,
    probability: 50,
    notes: ''
  });

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      // Filtramos Convertidos e Perdidos para manter o Kanban focado no que está "quente"
      setLeads(data.filter(l => l.stage !== LeadStage.Converted && l.stage !== LeadStage.Lost));
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !newLead.name) return;

    try {
      await createLead({
        ...newLead,
        createdBy: user.uid
      });
      setIsModalOpen(false);
      setNewLead({ name: '', phone: '', whatsapp: '', source: LeadSource.Instagram, stage: LeadStage.New, potentialValue: 0, probability: 50, notes: '' });
      loadLeads();
    } catch (error) {
      alert("Erro ao criar lead.");
    }
  };

  const handleMoveStage = async (leadId: string, nextStage: LeadStage) => {
    try {
      await updateLead(leadId, { stage: nextStage });
      loadLeads();
    } catch (error) {
      alert("Erro ao mover lead.");
    }
  };

  const handleConvert = async (leadId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    if (!window.confirm(COPY.admin.crm.leads.form.btnConvert + "?")) return;

    setProcessingId(leadId);
    try {
      await convertLeadToCustomer(leadId, user.uid);
      alert("Sucesso! O lead foi convertido em cliente e já pode ver o seu perfil no CRM.");
      loadLeads();
    } catch (error) {
      alert("Erro na conversão.");
    } finally {
      setProcessingId(null);
    }
  };

  const stages = [LeadStage.New, LeadStage.Contacted, LeadStage.Interested, LeadStage.Scheduled];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER PIPELINE */}
      <div className="flex justify-between items-center bg-brand-card p-6 rounded-[2rem] border border-stone-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
            <Target size={24} />
          </div>
          <div>
            <h3 className="text-primary-dark font-bold text-lg uppercase tracking-tight">{COPY.admin.crm.leads.title}</h3>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{COPY.admin.crm.leads.subtitle}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg active:scale-95 flex items-center gap-2"
        >
          <Plus size={14} strokeWidth={3} /> {COPY.admin.crm.leads.btnNew}
        </button>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 min-h-[500px]">
        {loading ? (
          <div className="w-full flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : (
          stages.map((stage) => (
            <div key={stage} className="flex-shrink-0 w-[280px] md:w-[320px] space-y-4">
              {/* Título da Coluna */}
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                  {(COPY.admin.crm.leads.kanban.stages as any)[stage]}
                </h4>
                <span className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full text-[9px] font-bold">
                  {leads.filter(l => l.stage === stage).length}
                </span>
              </div>

              {/* Lista de Cards */}
              <div className="space-y-3">
                {leads.filter(l => l.stage === stage).map((lead) => (
                  <div 
                    key={lead.id}
                    className="bg-brand-card border border-stone-100 p-5 rounded-[2rem] shadow-sm hover:border-primary/30 transition-all group animate-in slide-in-from-bottom-2"
                  >
                    <div className="flex justify-between items-start mb-3">
                       <span className="text-[8px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full uppercase">
                         {(COPY.admin.crm.leads.sources as any)[lead.source]}
                       </span>
                       <button className="text-stone-300 hover:text-stone-500 transition-colors"><MoreHorizontal size={16}/></button>
                    </div>

                    <h5 className="font-bold text-primary-dark text-sm mb-1">{lead.name}</h5>
                    <p className="text-[10px] text-stone-400 font-bold mb-4">{lead.phone}</p>

                    <div className="flex items-center justify-between py-3 border-t border-stone-50">
                       <div className="text-left">
                          <p className="text-[8px] font-black text-stone-300 uppercase">Potencial</p>
                          <p className="text-xs font-black text-emerald-600">{formatCurrency(lead.potentialValue || 0)}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black text-stone-300 uppercase">Probabilidade</p>
                          <p className="text-xs font-black text-primary">{lead.probability}%</p>
                       </div>
                    </div>

                    {/* Ações Rápidas do Card */}
                    <div className="flex gap-2 pt-3 border-t border-stone-50">
                       {stage === LeadStage.Scheduled ? (
                         <button 
                          onClick={() => handleConvert(lead.id!)}
                          disabled={processingId === lead.id}
                          className="flex-1 bg-green-500 text-white py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 hover:bg-green-600 transition-all"
                         >
                           {processingId === lead.id ? <Loader2 size={10} className="animate-spin" /> : <><UserCheck size={12}/> Converter</>}
                         </button>
                       ) : (
                         <button 
                          onClick={() => handleMoveStage(lead.id!, stages[stages.indexOf(stage) + 1])}
                          className="flex-1 bg-stone-50 text-stone-600 py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 hover:bg-stone-100 transition-all"
                         >
                           Avançar <ArrowRight size={12}/>
                         </button>
                       )}
                    </div>
                  </div>
                ))}
                
                {leads.filter(l => l.stage === stage).length === 0 && (
                  <div className="border border-dashed border-stone-200 rounded-[2rem] py-10 text-center">
                    <p className="text-stone-300 text-[10px] uppercase font-bold italic">Vazio</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE CRIAÇÃO DE LEAD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-footer/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleCreateLead} className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-primary-dark uppercase tracking-tight">{COPY.admin.crm.leads.btnNew}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-stone-400"><X size={24}/></button>
             </div>
             
             <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.form.name}</label>
                   <input required value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.form.phone}</label>
                    <input required value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value, whatsapp: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.leads.form.source}</label>
                    <select value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value as any})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary appearance-none">
                       {Object.values(LeadSource).map(s => <option key={s} value={s}>{(COPY.admin.crm.leads.sources as any)[s] || s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.leads.form.potential}</label>
                    <input type="number" value={newLead.potentialValue} onChange={e => setNewLead({...newLead, potentialValue: parseFloat(e.target.value)})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.leads.form.probability}</label>
                    <input type="range" min="0" max="100" value={newLead.probability} onChange={e => setNewLead({...newLead, probability: parseInt(e.target.value)})} className="w-full accent-primary" />
                    <p className="text-right text-[10px] font-bold text-primary">{newLead.probability}% de probabilidade</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.form.notes}</label>
                   <textarea value={newLead.notes} onChange={e => setNewLead({...newLead, notes: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm outline-none focus:border-primary resize-none" rows={2} />
                </div>
             </div>

             <div className="p-6 bg-stone-50 border-t border-stone-100">
               <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                  Guardar Oportunidade
               </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LeadPipeline;
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, 
  Plus, 
  Target, 
  Users, 
  BarChart3, 
  Trash2, 
  Loader2, 
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { 
  getCrmCampaigns, 
  createCrmCampaign, 
  getCrmTemplates 
} from '../../../services/crmMarketingService';
import { getAllCustomers, recordCrmEvent } from '../../../services/crmService';
import { auth } from '../../../firebase';
import { COPY } from '../../../copy';
import { CrmCampaign, CrmTemplate, Customer, CustomerTag, CrmEventType } from '../../../types';

const MarketingCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);
  const [templates, setTemplates] = useState<CrmTemplate[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado do Formulário
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    templateId: '',
    targetTag: 'ALL' as CustomerTag | 'ALL'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campData, tempData, custData] = await Promise.all([
        getCrmCampaigns(),
        getCrmTemplates(),
        getAllCustomers()
      ]);
      setCampaigns(campData);
      setTemplates(tempData);
      setAllCustomers(custData);
    } catch (error) {
      console.error("Erro ao carregar dados de campanhas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculo do público-alvo em tempo real
  const targetCount = useMemo(() => {
    if (newCampaign.targetTag === 'ALL') return allCustomers.length;
    return allCustomers.filter(c => c.tags.includes(newCampaign.targetTag as CustomerTag)).length;
  }, [newCampaign.targetTag, allCustomers]);

  const selectedTemplate = useMemo(() => {
    return templates.find(t => t.id === newCampaign.templateId);
  }, [newCampaign.templateId, templates]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !newCampaign.title || !newCampaign.templateId) return;

    if (targetCount === 0) {
      alert("O público selecionado não tem clientes.");
      return;
    }

    setLoading(true);
    try {
      // 1. Criar o registo da campanha
      const campId = await createCrmCampaign({
        title: newCampaign.title,
        templateId: newCampaign.templateId,
        targetTag: newCampaign.targetTag,
        createdBy: user.uid
      }, targetCount);

      // 2. Registar na Timeline de cada cliente (Simulação de envio e Auditoria)
      const targetList = newCampaign.targetTag === 'ALL' 
        ? allCustomers 
        : allCustomers.filter(c => c.tags.includes(newCampaign.targetTag as CustomerTag));

      // Em produção real aqui dispararíamos a API do WhatsApp/SMS
      for (const customer of targetList) {
        await recordCrmEvent({
          customerId: customer.id!,
          type: CrmEventType.CampaignSent,
          title: "Campanha Recebida",
          description: `Recebeu a campanha: ${newCampaign.title}`,
          relatedId: campId,
          createdBy: user.uid
        });
      }

      setIsModalOpen(false);
      setNewCampaign({ title: '', templateId: '', targetTag: 'ALL' });
      loadData();
    } catch (error) {
      alert("Erro ao disparar campanha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-brand-card p-6 rounded-[2rem] border border-stone-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
            <Send size={24} fill="currentColor" className="-rotate-12" />
          </div>
          <div>
            <h3 className="text-primary-dark font-bold text-lg uppercase tracking-tight">
              {COPY.admin.crm.campaigns.title}
            </h3>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Envios Estratégicos em Massa</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <Plus size={14} strokeWidth={3} /> {COPY.admin.crm.campaigns.btnNew}
        </button>
      </div>

      {/* LISTAGEM DE HISTÓRICO DE CAMPANHAS */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : campaigns.length === 0 ? (
          <div className="bg-brand-card border border-dashed border-stone-200 rounded-[2rem] py-16 text-center">
            <p className="text-stone-400 italic text-sm">{COPY.admin.crm.campaigns.empty}</p>
          </div>
        ) : (
          campaigns.map((camp) => (
            <div key={camp.id} className="bg-brand-card border border-stone-100 p-6 rounded-[2.5rem] hover:border-primary/30 transition-all shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400">
                    <Target size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-dark uppercase text-sm">{camp.title}</h4>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">
                      Público: {camp.targetTag === 'ALL' ? 'Todos os Clientes' : camp.targetTag} • {new Date(camp.createdAt?.seconds * 1000).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8 px-4 py-2 bg-stone-50 rounded-2xl">
                   <div className="text-center">
                      <p className="text-[8px] font-black text-stone-400 uppercase">{COPY.admin.crm.campaigns.stats.target}</p>
                      <p className="text-sm font-black text-primary-dark">{camp.stats.totalTargeted}</p>
                   </div>
                   <div className="text-center border-l border-stone-200 pl-8">
                      <p className="text-[8px] font-black text-stone-400 uppercase">{COPY.admin.crm.campaigns.stats.sent}</p>
                      <p className="text-sm font-black text-green-600">{camp.stats.sentCount}</p>
                   </div>
                   <div className="text-center border-l border-stone-200 pl-8">
                      <p className="text-[8px] font-black text-stone-400 uppercase">Estado</p>
                      <span className="text-[10px] font-black text-primary uppercase">{camp.status}</span>
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE DISPARO DE CAMPANHA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-footer/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form 
            onSubmit={handleSend}
            className="relative bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/30">
               <h3 className="text-lg font-bold text-primary-dark uppercase tracking-tight">{COPY.admin.crm.campaigns.btnNew}</h3>
               <button type="button" onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-primary-dark transition-colors"><X size={24}/></button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
               {/* Título Interno */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.campaigns.form.title}</label>
                  <input required value={newCampaign.title} onChange={e => setNewCampaign({...newCampaign, title: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary" placeholder="Ex: Promoção de Primavera 2026" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Público-alvo */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.campaigns.form.target}</label>
                    <select value={newCampaign.targetTag} onChange={e => setNewCampaign({...newCampaign, targetTag: e.target.value as any})} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary appearance-none">
                       <option value="ALL">Todos os Clientes</option>
                       {Object.values(CustomerTag).map(tag => (
                         <option key={tag} value={tag}>{(COPY.admin.crm.tags as any)[tag] || tag}</option>
                       ))}
                    </select>
                    <p className="text-[9px] text-primary font-bold uppercase mt-1 ml-1 flex items-center gap-1">
                      <Users size={10}/> {targetCount} clientes selecionados
                    </p>
                  </div>

                  {/* Template */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.campaigns.form.template}</label>
                    <select required value={newCampaign.templateId} onChange={e => setNewCampaign({...newCampaign, templateId: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary appearance-none">
                       <option value="">Selecione um modelo...</option>
                       {templates.map(t => (
                         <option key={t.id} value={t.id}>{t.title} ({t.channel})</option>
                       ))}
                    </select>
                  </div>
               </div>

               {/* PRÉ-VISUALIZAÇÃO */}
               {selectedTemplate && (
                 <div className="space-y-3 pt-4 border-t border-stone-100">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <Eye size={14} /> {COPY.admin.crm.campaigns.form.preview}
                    </label>
                    <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                       <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap italic">
                         {selectedTemplate.body.replace(/{{nome}}/g, 'Nome da Cliente')}
                       </p>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-6 bg-stone-50 border-t border-stone-100">
              <button 
                type="submit" 
                disabled={loading || !newCampaign.title || !newCampaign.templateId || targetCount === 0}
                className="w-full py-5 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-3"
              >
                 {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> {COPY.admin.crm.campaigns.form.submit}</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MarketingCampaigns;
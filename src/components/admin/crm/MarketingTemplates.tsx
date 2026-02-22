import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  MessageCircle, 
  Smartphone, 
  Mail, 
  Trash2, 
  Loader2, 
  X,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  getCrmTemplates, 
  createCrmTemplate, 
  deleteCrmTemplate 
} from '../../../services/crmMarketingService';
import { COPY } from '../../../copy';
import { CrmTemplate, CrmChannel } from '../../../types';

const MarketingTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<CrmTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado do Formulário
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    body: '',
    channel: CrmChannel.WhatsApp
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getCrmTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.title || !newTemplate.body) return;

    setLoading(true);
    try {
      await createCrmTemplate(newTemplate);
      setIsModalOpen(false);
      setNewTemplate({ title: '', body: '', channel: CrmChannel.WhatsApp });
      loadTemplates();
    } catch (error) {
      alert("Erro ao guardar modelo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja eliminar este modelo permanentemente?")) {
      try {
        await deleteCrmTemplate(id);
        loadTemplates();
      } catch (error) {
        alert("Erro ao eliminar.");
      }
    }
  };

  // Helper para inserir variáveis no texto
  const insertVariable = (variable: string) => {
    setNewTemplate(prev => ({
      ...prev,
      body: prev.body + ` {{${variable}}}`
    }));
  };

  const getChannelIcon = (channel: CrmChannel) => {
    switch (channel) {
      case CrmChannel.WhatsApp: return <MessageCircle size={18} className="text-green-500" />;
      case CrmChannel.SMS: return <Smartphone size={18} className="text-blue-500" />;
      case CrmChannel.Email: return <Mail size={18} className="text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER DE SECÇÃO */}
      <div className="flex justify-between items-center bg-brand-card p-6 rounded-[2rem] border border-stone-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-primary-dark font-bold text-lg uppercase tracking-tight">
              {COPY.admin.crm.templates.title}
            </h3>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Modelos Padronizados</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <Plus size={14} strokeWidth={3} /> {COPY.admin.crm.templates.btnNew}
        </button>
      </div>

      {/* LISTAGEM DE TEMPLATES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : templates.length === 0 ? (
          <div className="col-span-full bg-brand-card border border-dashed border-stone-200 rounded-[2rem] py-16 text-center">
            <p className="text-stone-400 italic text-sm">{COPY.admin.crm.templates.empty}</p>
          </div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="bg-brand-card border border-stone-100 p-6 rounded-[2rem] hover:border-primary/30 transition-all group flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(t.channel)}
                    <h4 className="font-bold text-primary-dark uppercase tracking-tight text-sm">{t.title}</h4>
                  </div>
                  <button onClick={() => t.id && handleDelete(t.id)} className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                </div>
                <p className="text-stone-500 text-xs leading-relaxed italic line-clamp-3">"{t.body}"</p>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-50 flex justify-between items-center">
                <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Criado em {new Date(t.createdAt?.seconds * 1000).toLocaleDateString('pt-PT')}</span>
                <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Editar</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-footer/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form 
            onSubmit={handleSave}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
               <h3 className="text-lg font-bold text-primary-dark uppercase tracking-tight">{COPY.admin.crm.templates.btnNew}</h3>
               <button type="button" onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-primary-dark transition-colors"><X size={24}/></button>
            </div>

            <div className="p-8 space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.templates.form.title}</label>
                  <input required value={newTemplate.title} onChange={e => setNewTemplate({...newTemplate, title: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary" placeholder="Ex: Lembrete de Manutenção 21 dias" />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{COPY.admin.crm.templates.form.channel}</label>
                  <select value={newTemplate.channel} onChange={e => setNewTemplate({...newTemplate, channel: e.target.value as CrmChannel})} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary appearance-none">
                     {Object.values(CrmChannel).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               
               <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{COPY.admin.crm.templates.form.body}</label>
                    <div className="flex gap-1">
                      {['nome', 'servico', 'data'].map(v => (
                        <button key={v} type="button" onClick={() => insertVariable(v)} className="bg-primary/5 text-primary border border-primary/20 px-2 py-1 rounded-lg text-[8px] font-black uppercase hover:bg-primary hover:text-white transition-all">
                          +{v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea required rows={5} value={newTemplate.body} onChange={e => setNewTemplate({...newTemplate, body: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm outline-none focus:border-primary resize-none shadow-inner" placeholder={COPY.admin.crm.templates.form.bodyHint} />
               </div>
            </div>

            <div className="p-6 bg-stone-50 border-t border-stone-100">
              <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">
                 {COPY.admin.crm.templates.form.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MarketingTemplates;
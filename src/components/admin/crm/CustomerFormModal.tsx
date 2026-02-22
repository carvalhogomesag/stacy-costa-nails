import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Tag, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { auth } from '../../../firebase';
import { upsertCustomer } from '../../../services/crmService';
import { COPY } from '../../../copy';
import { Customer, CustomerTag } from '../../../types';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Customer | null;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do Formulário
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    birthday: '',
    gender: '',
    notes: '',
    marketingConsent: false,
    tags: [] as CustomerTag[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        phone: initialData.phone,
        whatsapp: initialData.whatsapp,
        email: initialData.email || '',
        birthday: initialData.birthday || '',
        gender: initialData.gender || '',
        notes: initialData.notes || '',
        marketingConsent: initialData.marketingConsent,
        tags: initialData.tags
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        whatsapp: '',
        email: '',
        birthday: '',
        gender: '',
        notes: '',
        marketingConsent: true,
        tags: [CustomerTag.New]
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const toggleTag = (tag: CustomerTag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag) 
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const user = auth.currentUser;
    if (!user) return;

    try {
      await upsertCustomer(formData, user.uid);
      onClose();
    } catch (err: any) {
      setError(COPY.admin.crm.form.errorDuplicate);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-[260]">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 bg-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-primary-dark font-bold text-lg leading-tight uppercase tracking-tight">
                {initialData ? COPY.admin.crm.form.titleEdit : COPY.admin.crm.form.titleNew}
              </h2>
              <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-0.5">
                {COPY.admin.crm.subtitle}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-xl text-center font-bold animate-in shake">
              <AlertCircle className="inline mr-2" size={14} />
              {error}
            </div>
          )}

          {/* DADOS PESSOAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 tracking-widest">{COPY.admin.crm.form.name}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary-dark outline-none focus:border-primary transition-all" placeholder="Nome do cliente" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 tracking-widest">{COPY.admin.crm.form.phone}</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value, whatsapp: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary-dark outline-none focus:border-primary transition-all" placeholder="Ex: 912 345 678" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 tracking-widest">{COPY.admin.crm.form.email}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary-dark outline-none focus:border-primary transition-all" placeholder="cliente@email.com" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 tracking-widest">{COPY.admin.crm.form.birthday}</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <input value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary-dark outline-none focus:border-primary transition-all" placeholder="DD/MM" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 tracking-widest">{COPY.admin.crm.form.gender}</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 px-4 text-sm font-bold text-primary-dark outline-none focus:border-primary appearance-none">
                <option value="">Selecione...</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* TAGS DE PERFIL */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 tracking-widest">{COPY.admin.crm.form.tags}</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(CustomerTag).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                    formData.tags.includes(tag)
                    ? 'bg-primary border-primary text-white shadow-md'
                    : 'bg-stone-50 border-stone-100 text-stone-400 hover:border-primary/30'
                  }`}
                >
                  {(COPY.admin.crm.tags as any)[tag] || tag}
                </button>
              ))}
            </div>
          </div>

          {/* OBSERVAÇÕES E CONSENTIMENTO */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 tracking-widest">{COPY.admin.crm.form.notes}</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 text-primary" size={18} />
                <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-primary-dark outline-none focus:border-primary transition-all resize-none" placeholder="Notas internas sobre o cliente..." />
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={formData.marketingConsent}
                onChange={e => setFormData({...formData, marketingConsent: e.target.checked})}
                className="w-5 h-5 accent-primary" 
              />
              <span className="text-xs font-bold text-primary-dark group-hover:text-primary transition-colors">
                {COPY.admin.crm.form.consent}
              </span>
            </label>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-xs active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> {COPY.admin.crm.form.save}</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
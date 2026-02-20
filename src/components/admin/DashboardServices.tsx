import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  deleteDoc, doc, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { Plus, Briefcase, Trash2, Loader2 } from 'lucide-react';
import { Service } from '../../types';
import { CLIENT_ID } from '../../constants';
import { COPY } from '../../copy';

const DashboardServices: React.FC = () => {
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ESTADO PARA NOVO SERVIÇO
  const [newService, setNewService] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    duration: 30 
  });

  // ESCUTAR SERVIÇOS DO FIRESTORE (Multi-tenant)
  useEffect(() => {
    const q = query(
      collection(db, "businesses", CLIENT_ID, "services"), 
      orderBy("name", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Service));
      setDbServices(servicesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "businesses", CLIENT_ID, "services"), { 
        ...newService, 
        createdAt: serverTimestamp() 
      });
      setNewService({ name: '', description: '', price: '', duration: 30 });
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      alert("Erro ao criar serviço.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm(COPY.admin.services.deleteConfirm)) {
      try {
        await deleteDoc(doc(db, "businesses", CLIENT_ID, "services", id));
      } catch (error) {
        alert("Erro ao eliminar serviço.");
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* FORMULÁRIO DE CRIAÇÃO - ESTILO CLEAN CARD */}
      <form 
        onSubmit={handleAddService} 
        className="bg-brand-card border border-stone-100 p-6 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm space-y-6"
      >
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Plus className="text-primary w-5 h-5"/> 
          </div>
          <h3 className="text-primary-dark font-bold text-base md:text-lg uppercase tracking-tight">
            {COPY.admin.services.title}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          <div className="space-y-1.5">
             <label className="text-[10px] uppercase font-bold text-stone-400 ml-1 tracking-widest">
               {COPY.admin.services.form.name}
             </label>
             <input 
                required 
                value={newService.name} 
                onChange={e => setNewService({...newService, name: e.target.value})} 
                className="w-full bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl p-3.5 md:p-4 text-sm text-primary-dark outline-none focus:border-primary focus:bg-white transition-all font-medium" 
                placeholder="Ex: Manicure Gel"
             />
          </div>
          <div className="space-y-1.5">
             <label className="text-[10px] uppercase font-bold text-stone-400 ml-1 tracking-widest">
               {COPY.admin.services.form.price}
             </label>
             <input 
                required 
                value={newService.price} 
                onChange={e => setNewService({...newService, price: e.target.value})} 
                className="w-full bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl p-3.5 md:p-4 text-sm text-primary-dark outline-none focus:border-primary focus:bg-white transition-all font-medium" 
                placeholder="Ex: 25€" 
             />
          </div>
          <div className="space-y-1.5">
             <label className="text-[10px] uppercase font-bold text-stone-400 ml-1 tracking-widest">
               {COPY.admin.services.form.duration}
             </label>
             <input 
                required 
                type="number" 
                value={newService.duration} 
                onChange={e => setNewService({...newService, duration: parseInt(e.target.value)})} 
                className="w-full bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl p-3.5 md:p-4 text-sm text-primary-dark outline-none focus:border-primary focus:bg-white transition-all font-medium" 
             />
          </div>
        </div>

        <div className="space-y-1.5">
           <label className="text-[10px] uppercase font-bold text-stone-400 ml-1 tracking-widest">
             {COPY.admin.services.form.desc}
           </label>
           <input 
              value={newService.description} 
              onChange={e => setNewService({...newService, description: e.target.value})} 
              className="w-full bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl p-3.5 md:p-4 text-sm text-primary-dark outline-none focus:border-primary focus:bg-white transition-all font-medium" 
              placeholder="Ex: Inclui hidratação final..."
           />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-4 md:py-5 bg-primary hover:bg-primary-hover text-white font-black rounded-xl md:rounded-2xl shadow-md transition-all flex justify-center items-center gap-2 active:scale-95 uppercase tracking-widest text-xs"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : COPY.admin.services.form.submit}
        </button>
      </form>

      {/* LISTA DE SERVIÇOS - ESTILO CLEAN LIST */}
      <div className="space-y-4">
        <h4 className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.3em] ml-2 mb-2">
          {COPY.admin.services.listTitle}
        </h4>
        
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : dbServices.length === 0 ? (
          <div className="bg-brand-card border border-dashed border-stone-200 rounded-2xl p-12 text-center">
            <p className="text-stone-400 italic text-sm font-light">
              {COPY.services.empty}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {dbServices.map(s => (
              <div 
                key={s.id} 
                className="bg-brand-card border border-stone-100 p-4 md:p-6 rounded-xl md:rounded-2xl flex justify-between items-center group transition-all hover:border-primary/30 shadow-sm"
              >
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-50 border border-stone-100 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <Briefcase size={18} className="md:w-5 md:h-5"/>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-primary-dark font-bold text-sm md:text-lg truncate leading-tight">{s.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-primary text-[11px] md:text-sm font-black whitespace-nowrap uppercase tracking-tighter">{s.price}</p>
                      <span className="text-stone-200">•</span>
                      <p className="text-stone-400 text-[10px] md:text-xs font-medium uppercase tracking-tighter">
                        {s.duration} min
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteService(s.id!)} 
                  className="text-stone-300 hover:text-red-500 p-2 md:p-3 transition-colors rounded-full hover:bg-red-50"
                >
                  <Trash2 size={18} className="md:w-5 md:h-5"/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardServices;
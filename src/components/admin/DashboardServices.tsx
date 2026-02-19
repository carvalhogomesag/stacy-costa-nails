import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  deleteDoc, doc, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { Plus, Briefcase, Trash2, Loader2 } from 'lucide-react';
import { Service } from '../../types';
import { CLIENT_ID } from '../../constants';

const DashboardServices: React.FC = () => {
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para novo serviço
  const [newService, setNewService] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    duration: 30 
  });

  // Escutar Serviços do Firestore
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
      // Resetar formulário
      setNewService({ name: '', description: '', price: '', duration: 30 });
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      alert("Erro ao criar serviço.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm("Deseja eliminar este serviço? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, "businesses", CLIENT_ID, "services", id));
      } catch (error) {
        alert("Erro ao eliminar serviço.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Formulário de Criação */}
      <form 
        onSubmit={handleAddService} 
        className="bg-stone-900 border border-emerald-900/20 p-8 rounded-[3rem] shadow-2xl space-y-6"
      >
        <h3 className="text-white font-bold flex items-center gap-2 text-lg">
          <Plus className="text-emerald-500"/> Novo Serviço
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
             <label className="text-[10px] uppercase font-black text-stone-500 ml-1 tracking-widest">Nome do Serviço</label>
             <input 
                required 
                value={newService.name} 
                onChange={e => setNewService({...newService, name: e.target.value})} 
                className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all" 
                placeholder="Ex: Corte Clássico"
             />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] uppercase font-black text-stone-500 ml-1 tracking-widest">Preço</label>
             <input 
                required 
                value={newService.price} 
                onChange={e => setNewService({...newService, price: e.target.value})} 
                className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all" 
                placeholder="Ex: 15€" 
             />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] uppercase font-black text-stone-500 ml-1 tracking-widest">Duração (Mins)</label>
             <input 
                required 
                type="number" 
                value={newService.duration} 
                onChange={e => setNewService({...newService, duration: parseInt(e.target.value)})} 
                className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all" 
             />
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-[10px] uppercase font-black text-stone-500 ml-1 tracking-widest">Descrição (Opcional)</label>
           <input 
              value={newService.description} 
              onChange={e => setNewService({...newService, description: e.target.value})} 
              className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all" 
              placeholder="Breve descrição do serviço..."
           />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Criar Serviço"}
        </button>
      </form>

      {/* Lista de Serviços Ativos */}
      <div className="grid gap-4">
        <h4 className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] ml-6 mb-2">Serviços Ativos</h4>
        
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="animate-spin text-emerald-500" />
          </div>
        ) : dbServices.length === 0 ? (
          <div className="bg-stone-900/50 border border-dashed border-white/10 rounded-3xl p-10 text-center">
            <p className="text-stone-600 italic">Nenhum serviço cadastrado.</p>
          </div>
        ) : (
          dbServices.map(s => (
            <div 
              key={s.id} 
              className="bg-stone-900 border border-white/5 p-6 rounded-3xl flex justify-between items-center group transition-all hover:border-emerald-500/20 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-stone-950 rounded-xl flex items-center justify-center text-emerald-500 shadow-inner">
                  <Briefcase size={20}/>
                </div>
                <div>
                  <h4 className="text-white font-bold">{s.name}</h4>
                  <p className="text-stone-500 text-xs">
                    {s.duration} min • <span className="text-emerald-500 font-bold">{s.price}</span>
                  </p>
                  {s.description && (
                    <p className="text-stone-600 text-[10px] mt-1 italic">{s.description}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => handleDeleteService(s.id!)} 
                className="text-stone-700 hover:text-red-500 p-3 transition-colors rounded-full hover:bg-red-500/5"
                title="Remover Serviço"
              >
                <Trash2 size={20}/>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardServices;
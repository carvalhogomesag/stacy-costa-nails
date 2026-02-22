import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  AlertCircle, 
  Trash2, 
  CheckCircle2, 
  Calendar,
  User,
  Filter,
  Loader2,
  X
} from 'lucide-react';
import { 
  getCrmTasks, 
  updateCrmTask, 
  deleteCrmTask, 
  createCrmTask 
} from '../../../services/crmService';
import { auth } from '../../../firebase';
import { COPY } from '../../../copy';
import { CrmTask, CrmTaskStatus, CrmTaskPriority } from '../../../types';

const CrmTasks: React.FC = () => {
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<CrmTaskStatus | 'ALL'>(CrmTaskStatus.Pending);
  
  // Estados para nova tarefa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState<CrmTaskPriority>(CrmTaskPriority.Medium);

  useEffect(() => {
    loadTasks();
  }, [filterStatus]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getCrmTasks(filterStatus === 'ALL' ? undefined : filterStatus);
      setTasks(data);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !newTitle) return;

    try {
      await createCrmTask({
        title: newTitle,
        description: newDesc,
        dueDate: newDate,
        priority: newPriority,
        status: CrmTaskStatus.Pending,
        assignedTo: user.uid,
        createdBy: user.uid
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      loadTasks();
    } catch (error) {
      alert("Erro ao criar tarefa.");
    }
  };

  const handleToggleStatus = async (task: CrmTask) => {
    const newStatus = task.status === CrmTaskStatus.Completed ? CrmTaskStatus.Pending : CrmTaskStatus.Completed;
    try {
      await updateCrmTask(task.id!, { status: newStatus });
      loadTasks();
    } catch (error) {
      alert("Erro ao atualizar tarefa.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Eliminar esta tarefa permanentemente?")) {
      try {
        await deleteCrmTask(id);
        loadTasks();
      } catch (error) {
        alert("Erro ao eliminar.");
      }
    }
  };

  const getPriorityColor = (p: CrmTaskPriority) => {
    switch (p) {
      case CrmTaskPriority.High: return 'text-red-500 bg-red-50 border-red-100';
      case CrmTaskPriority.Medium: return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-blue-500 bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* BARRA DE FILTROS E AÇÃO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card p-4 rounded-3xl border border-stone-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <Filter size={14} className="text-stone-400 ml-1" />
          {['ALL', ...Object.values(CrmTaskStatus)].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                filterStatus === status 
                ? 'bg-primary border-primary text-white' 
                : 'bg-white border-stone-100 text-stone-400 hover:border-primary/30'
              }`}
            >
              {status === 'ALL' ? 'Todas' : status}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-dark text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
        >
          <Plus size={14} strokeWidth={3} /> Nova Tarefa
        </button>
      </div>

      {/* LISTA DE TAREFAS */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : tasks.length === 0 ? (
          <div className="bg-brand-card border border-dashed border-stone-200 rounded-[2rem] py-20 text-center">
            <CheckCircle2 className="mx-auto text-stone-100 mb-3" size={48} />
            <p className="text-stone-400 italic text-sm">Tudo em dia! Nenhuma tarefa encontrada.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id}
              className={`bg-brand-card border p-5 rounded-[2rem] flex items-center justify-between group transition-all ${
                task.status === CrmTaskStatus.Completed ? 'opacity-60 border-stone-100' : 'border-stone-100 hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-4 min-w-0">
                <button 
                  onClick={() => handleToggleStatus(task)}
                  className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    task.status === CrmTaskStatus.Completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-stone-200 hover:border-primary text-transparent'
                  }`}
                >
                  <CheckCircle2 size={14} strokeWidth={3} />
                </button>
                
                <div className="min-w-0">
                  <h4 className={`font-bold text-sm md:text-base ${task.status === CrmTaskStatus.Completed ? 'line-through text-stone-400' : 'text-primary-dark'}`}>
                    {task.title}
                  </h4>
                  <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{task.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-stone-400 uppercase">
                      <Calendar size={10} className="text-primary" /> {new Date(task.dueDate).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleDelete(task.id!)}
                className="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form 
            onSubmit={handleCreateTask}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300"
          >
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-primary-dark">Nova Tarefa</h3>
               <button type="button" onClick={() => setIsModalOpen(false)} className="text-stone-400"><X size={24}/></button>
            </div>

            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">O que fazer?</label>
                  <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary" placeholder="Ex: Ligar para confirmar retorno" />
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Detalhes (Opcional)</label>
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm outline-none focus:border-primary resize-none" rows={2} />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Data Limite</label>
                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Prioridade</label>
                    <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary">
                       {Object.values(CrmTaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
               </div>
            </div>

            <button type="submit" className="w-full mt-8 py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">
               Criar Tarefa
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CrmTasks;
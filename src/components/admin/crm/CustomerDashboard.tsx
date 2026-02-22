import React, { useState } from 'react';
import { 
  Users, 
  Target, 
  CheckSquare, 
  Zap, 
  BarChart3, 
  Plus, 
  UserPlus
} from 'lucide-react';
import { COPY } from '../../../copy';
import { Customer } from '../../../types';

// Sub-componentes
import CustomerList from './CustomerList';
import CustomerProfile from './CustomerProfile';
import CustomerFormModal from './CustomerFormModal';
import CrmInsights from './CrmInsights';
import CrmTasks from './CrmTasks'; // NOVO: Importação do módulo de tarefas

const CustomerDashboard: React.FC = () => {
  // --- ESTADOS DE NAVEGAÇÃO CRM ---
  const [activeTab, setActiveTab] = useState<'customers' | 'leads' | 'tasks' | 'automations' | 'insights'>('customers');
  
  // Controlo de Visualização (Lista vs Perfil Detalhado)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Controlo de Modais
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // Mapeamento de itens do menu CRM usando COPY
  const crmMenuItems = [
    { id: 'customers', label: COPY.admin.crm.tabs.customers, icon: <Users size={18} /> },
    { id: 'tasks', label: COPY.admin.crm.tabs.tasks, icon: <CheckSquare size={18} /> },
    { id: 'insights', label: COPY.admin.crm.tabs.insights, icon: <BarChart3 size={18} /> },
    { id: 'leads', label: COPY.admin.crm.tabs.leads, icon: <Target size={18} /> },
    { id: 'automations', label: COPY.admin.crm.tabs.automations, icon: <Zap size={18} /> },
  ];

  // Handler para quando um cliente é selecionado na lista
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* CABEÇALHO CRM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-primary-dark font-bold text-xl uppercase tracking-tight">
            {COPY.admin.crm.title}
          </h3>
          <p className="text-stone-500 text-xs font-medium uppercase tracking-[0.2em]">
            {COPY.admin.crm.subtitle}
          </p>
        </div>

        <button 
          onClick={() => setIsNewCustomerModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-black text-xs shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95"
        >
          <UserPlus size={18} strokeWidth={3} />
          {COPY.admin.crm.list.btnNew}
        </button>
      </div>

      {/* SUB-NAVEGAÇÃO CRM (Abas estilo Pilulado) */}
      {!selectedCustomerId && (
        <div className="flex bg-stone-100 p-1 rounded-2xl overflow-x-auto no-scrollbar border border-stone-200">
          <div className="flex gap-1">
            {crmMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest shrink-0 ${
                  activeTab === item.id 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-stone-400 hover:text-stone-800'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ÁREA DE CONTEÚDO DINÂMICO */}
      <div className="min-h-[400px]">
        {selectedCustomerId ? (
          /* VISÃO 360° DO CLIENTE */
          <CustomerProfile 
            customerId={selectedCustomerId} 
            onBack={() => setSelectedCustomerId(null)} 
          />
        ) : (
          /* NAVEGAÇÃO ENTRE MÓDULOS ATIVOS */
          <>
            {activeTab === 'customers' && (
              <CustomerList onSelectCustomer={handleSelectCustomer} />
            )}
            
            {activeTab === 'tasks' && (
              <CrmTasks />
            )}
            
            {activeTab === 'insights' && (
              <CrmInsights />
            )}

            {/* PLACEHOLDERS PARA PRÓXIMAS FASES (3 e 4) */}
            {activeTab === 'leads' && (
              <div className="bg-brand-card border border-stone-200 border-dashed rounded-[2rem] p-20 text-center animate-in zoom-in-95">
                 <Target className="mx-auto text-stone-200 mb-4" size={48} />
                 <h4 className="text-stone-400 font-bold uppercase tracking-widest text-xs">Gestão de Leads</h4>
                 <p className="text-stone-400 text-sm mt-2 font-light">Este módulo será ativado na Fase 4 (Pipeline Comercial).</p>
              </div>
            )}

            {activeTab === 'automations' && (
              <div className="bg-brand-card border border-stone-200 border-dashed rounded-[2rem] p-20 text-center animate-in zoom-in-95">
                 <Zap className="mx-auto text-stone-200 mb-4" size={48} />
                 <h4 className="text-stone-400 font-bold uppercase tracking-widest text-xs">Workflows Automáticos</h4>
                 <p className="text-stone-400 text-sm mt-2 font-light">Automações de marketing e retorno agendadas para a Fase 3.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL DE NOVO CADASTRO */}
      <CustomerFormModal 
        isOpen={isNewCustomerModalOpen} 
        onClose={() => setIsNewCustomerModalOpen(false)} 
      />
    </div>
  );
};

export default CustomerDashboard;
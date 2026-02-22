import React, { useState } from 'react';
import { 
  Users, 
  Target, 
  CheckSquare, 
  Zap, 
  BarChart3, 
  Plus, 
  Search, 
  Filter,
  UserPlus
} from 'lucide-react';
import { COPY } from '../../../copy';
import { Customer } from '../../../types';

// Sub-componentes (Vamos criá-los nos próximos passos)
import CustomerList from './CustomerList';
import CustomerProfile from './CustomerProfile';
import CustomerFormModal from './CustomerFormModal';

const CustomerDashboard: React.FC = () => {
  // --- ESTADOS DE NAVEGAÇÃO CRM ---
  const [activeTab, setActiveTab] = useState<'customers' | 'leads' | 'tasks' | 'automations' | 'insights'>('customers');
  
  // Controlo de Visualização (Lista vs Perfil Detalhado)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Controlo de Modais
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // Mapeamento de itens do menu CRM
  const crmMenuItems = [
    { id: 'customers', label: COPY.admin.crm.tabs.customers, icon: <Users size={18} /> },
    { id: 'leads', label: COPY.admin.crm.tabs.leads, icon: <Target size={18} /> },
    { id: 'tasks', label: COPY.admin.crm.tabs.tasks, icon: <CheckSquare size={18} /> },
    { id: 'automations', label: COPY.admin.crm.tabs.automations, icon: <Zap size={18} /> },
    { id: 'insights', label: COPY.admin.crm.tabs.insights, icon: <BarChart3 size={18} /> },
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

      {/* SUB-NAVEGAÇÃO CRM (Abas) */}
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
                  : 'text-stone-400 hover:text-stone-600'
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
          /* VISÕES GERAIS */
          <>
            {activeTab === 'customers' && (
              <CustomerList onSelectCustomer={handleSelectCustomer} />
            )}
            
            {activeTab === 'leads' && (
              <div className="bg-brand-card border border-stone-200 border-dashed rounded-[2rem] p-20 text-center">
                 <Target className="mx-auto text-stone-200 mb-4" size={48} />
                 <p className="text-stone-400 italic">Módulo de Leads em preparação para a Fase 4.</p>
              </div>
            )}

            {/* Outras abas seguem o mesmo padrão de placeholder para as próximas fases */}
            {['tasks', 'automations', 'insights'].includes(activeTab) && (
              <div className="bg-brand-card border border-stone-200 border-dashed rounded-[2rem] p-20 text-center">
                 <p className="text-stone-400 italic font-light">Este recurso será ativado nas próximas fases da implementação do CRM.</p>
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
// src/components/admin/DashboardTeam.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  UserCog, 
  Mail, 
  Phone, 
  MoreHorizontal, 
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldAlert
} from 'lucide-react';
import { listTeamMembers, updateAppUser } from '../../services/authService';
import { AppUser, UserRole, UserStatus } from '../../types';
import { COPY } from '../../copy';
import { useAuth } from '../../context/AuthContext';
import TeamMemberModal from './TeamMemberModal'; // Modal agora integrado

const DashboardTeam: React.FC = () => {
  const { userData, isAdmin } = useAuth();
  
  // --- ESTADOS DE DADOS ---
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- ESTADOS DE UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AppUser | null>(null);

  // 1. CARREGAR EQUIPA
  const fetchTeam = async () => {
    setLoading(true);
    try {
      const data = await listTeamMembers();
      setMembers(data);
    } catch (error) {
      console.error("Erro ao carregar equipa:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // 2. FILTRAGEM LÓGICA
  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm]);

  // 3. ALTERAR ESTADO (ATIVO/INATIVO)
  const handleToggleStatus = async (member: AppUser) => {
    if (!isAdmin) return;
    
    const newStatus = member.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    const confirmMsg = newStatus === UserStatus.INACTIVE 
      ? COPY.admin.team.alerts.deleteConfirm 
      : "Reativar acesso para este membro?";

    if (window.confirm(confirmMsg)) {
      try {
        await updateAppUser(member.uid, { status: newStatus }, userData?.uid || 'ADMIN');
        await fetchTeam(); // Recarrega a lista
        alert(COPY.admin.team.alerts.statusChanged);
      } catch (error) {
        alert("Erro ao atualizar estado do membro.");
      }
    }
  };

  const handleEdit = (member: AppUser) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  // HELPER: Rótulo de Role
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER: return COPY.admin.team.list.roleOwner;
      case UserRole.MANAGER: return COPY.admin.team.list.roleManager;
      case UserRole.PROFESSIONAL: return COPY.admin.team.list.roleProfessional;
      case UserRole.RECEPTION: return COPY.admin.team.list.roleReception;
      default: return role;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* CABEÇALHO E AÇÃO PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-card p-6 rounded-[2.5rem] border border-stone-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-primary-dark font-bold text-lg uppercase tracking-tight">
              {COPY.admin.team.title}
            </h3>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest italic">
              {members.length} Membros Registados
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleAddNew}
          className="bg-primary text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <UserPlus size={16} strokeWidth={3} /> {COPY.admin.team.btnNew}
        </button>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" size={20} />
        <input 
          type="text"
          placeholder={COPY.admin.team.list.searchPlaceholder}
          className="w-full bg-white border border-stone-200 rounded-2xl py-4 pl-14 pr-6 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTA DE COLABORADORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-primary gap-4">
            <Loader2 className="animate-spin" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">A carregar equipa...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-stone-200 rounded-[3rem] py-20 text-center">
            <Users className="mx-auto text-stone-100 mb-4" size={64} />
            <p className="text-stone-400 italic text-sm">{COPY.admin.team.list.empty}</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div 
              key={member.uid}
              className={`bg-white border p-6 rounded-[2.5rem] flex flex-col justify-between transition-all group ${
                member.status === UserStatus.INACTIVE 
                ? 'opacity-60 grayscale border-stone-100' 
                : 'border-stone-100 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 group-hover:text-primary transition-colors border border-stone-100">
                    <UserCog size={28} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase border ${
                      member.status === UserStatus.ACTIVE 
                      ? 'bg-green-50 text-green-600 border-green-100' 
                      : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {member.status === UserStatus.ACTIVE ? COPY.admin.team.list.statusActive : COPY.admin.team.list.statusInactive}
                    </span>
                    <span className="text-[10px] font-bold text-primary mt-2 uppercase tracking-tighter">
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-primary-dark text-base leading-tight group-hover:text-primary transition-colors">
                    {member.fullName}
                  </h4>
                  <div className="flex flex-col gap-1 mt-3">
                    <div className="flex items-center gap-2 text-stone-400 text-xs font-medium">
                      <Mail size={14} className="text-primary/40" /> {member.email}
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-stone-400 text-xs font-medium">
                        <Phone size={14} className="text-primary/40" /> {member.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-stone-50 flex items-center justify-between">
                <button 
                  onClick={() => handleEdit(member)}
                  className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-primary transition-colors"
                >
                  Editar Perfil
                </button>
                
                {isAdmin && member.role !== UserRole.OWNER && (
                  <button 
                    onClick={() => handleToggleStatus(member)}
                    className={`p-2 rounded-xl transition-all ${
                      member.status === UserStatus.ACTIVE 
                      ? 'text-stone-300 hover:text-red-500 hover:bg-red-50' 
                      : 'text-stone-300 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={member.status === UserStatus.ACTIVE ? "Desativar Acesso" : "Ativar Acesso"}
                  >
                    {member.status === UserStatus.ACTIVE ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE GESTÃO DE MEMBRO */}
      <TeamMemberModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedMember}
        onSuccess={fetchTeam}
      />
    </div>
  );
};

export default DashboardTeam;
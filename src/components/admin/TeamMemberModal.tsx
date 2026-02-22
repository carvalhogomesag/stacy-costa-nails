// src/components/admin/TeamMemberModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Loader2, 
  Save, 
  CheckCircle2, 
  Info,
  UserCog
} from 'lucide-react';
import { auth } from '../../firebase';
import { createAppUser, updateAppUser } from '../../services/authService';
import { AppUser, UserRole, UserStatus } from '../../types';
import { COPY } from '../../copy';
import { useAuth } from '../../context/AuthContext';

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AppUser | null;
  onSuccess: () => void;
}

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  initialData, 
  onSuccess 
}) => {
  const { userData: adminUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ESTADO DO FORMULÁRIO ---
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: UserRole.PROFESSIONAL,
    status: UserStatus.ACTIVE
  });

  // 1. SINCRONIZAR DADOS AO ABRIR
  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName,
        email: initialData.email,
        phone: initialData.phone || '',
        role: initialData.role,
        status: initialData.status
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // 2. SUBMISSÃO LÓGICA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (initialData) {
        // MODO EDIÇÃO
        await updateAppUser(
          initialData.uid, 
          formData, 
          adminUser?.uid || 'ADMIN'
        );
      } else {
        // MODO CRIAÇÃO (Nota: Em produção, isto dispararia um convite por email)
        // Para este MVP, criamos o registo no Firestore. O UID temporário é o email.
        const tempUid = formData.email.replace(/[.@]/g, '_'); 
        await createAppUser({
          uid: tempUid,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          status: formData.status
        });
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Erro ao processar dados da equipa. Verifique as permissões.");
    } finally {
      setLoading(false);
    }
  };

  // HELPER: Descrição das permissões por Role
  const getRoleHelper = (role: UserRole) => {
    switch (role) {
      case UserRole.PROFESSIONAL: return COPY.admin.team.form.helperProfessional;
      case UserRole.RECEPTION: return COPY.admin.team.form.helperReception;
      case UserRole.MANAGER: return COPY.admin.team.form.helperManager;
      case UserRole.OWNER: return COPY.admin.team.form.helperOwner;
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* OVERLAY */}
      <div 
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity animate-in fade-in" 
        onClick={onClose} 
      />

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-[310]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-stone-100 bg-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <UserCog size={24} />
            </div>
            <div>
              <h2 className="text-primary-dark font-bold text-lg leading-tight uppercase tracking-tight">
                {initialData ? COPY.admin.team.form.titleEdit : COPY.admin.team.form.titleNew}
              </h2>
              <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-0.5">
                Segurança Nível {formData.role}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin">
          
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-xl text-center font-bold">
              {error}
            </div>
          )}

          {/* DADOS BÁSICOS */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 tracking-widest">
                {COPY.admin.team.form.fullName}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <input 
                  required 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value})} 
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary-dark outline-none focus:border-primary transition-all" 
                  placeholder="Ex: Maria Silva" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 tracking-widest">
                  {COPY.admin.team.form.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input 
                    required 
                    type="email"
                    disabled={!!initialData}
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary-dark outline-none focus:border-primary transition-all disabled:opacity-50" 
                    placeholder="email@empresa.com" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 tracking-widest">
                  {COPY.admin.team.form.phone}
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary-dark outline-none focus:border-primary transition-all" 
                    placeholder="9xx xxx xxx" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PERMISSÕES E CARGO */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 tracking-widest">
                {COPY.admin.team.form.role}
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary-dark outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value={UserRole.PROFESSIONAL}>{COPY.admin.team.list.roleProfessional}</option>
                  <option value={UserRole.RECEPTION}>{COPY.admin.team.list.roleReception}</option>
                  <option value={UserRole.MANAGER}>{COPY.admin.team.list.roleManager}</option>
                  {adminUser?.role === UserRole.OWNER && (
                    <option value={UserRole.OWNER}>{COPY.admin.team.list.roleOwner}</option>
                  )}
                </select>
              </div>
              
              <div className="mt-3 flex gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-primary-dark font-medium leading-relaxed italic">
                  {getRoleHelper(formData.role)}
                </p>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-xs active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> {COPY.admin.team.form.submit}</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeamMemberModal;
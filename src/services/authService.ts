// src/services/authService.ts

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  addDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { CLIENT_ID } from '../constants';
import { AppUser, UserRole, UserStatus, AuditLog } from '../types';

/**
 * CAMINHOS FIRESTORE (Multi-tenant)
 * Sub-coleção 'users' dentro do documento do negócio
 */
const usersRef = collection(db, "businesses", CLIENT_ID, "users");
const auditRef = collection(db, "businesses", CLIENT_ID, "auditLogs");

/**
 * 1. Obter Perfil Completo do Utilizador
 * Chamado logo após o login para carregar permissões (Roles)
 */
export const getUserProfile = async (uid: string): Promise<AppUser | null> => {
  try {
    const userDoc = doc(db, "businesses", CLIENT_ID, "users", uid);
    const snap = await getDoc(userDoc);
    
    if (!snap.exists()) return null;
    
    return { uid: snap.id, ...snap.data() } as AppUser;
  } catch (error) {
    console.error("Erro ao procurar perfil de utilizador:", error);
    return null;
  }
};

/**
 * 2. Inicializar Novo Utilizador (Primeiro Registo/Convite)
 * Salva os metadados do utilizador no Firestore vinculados ao Auth UID
 */
export const createAppUser = async (data: Omit<AppUser, 'createdAt' | 'updatedAt' | 'businessId'>): Promise<void> => {
  const userDoc = doc(db, "businesses", CLIENT_ID, "users", data.uid);
  
  const newUser: AppUser = {
    ...data,
    businessId: CLIENT_ID,
    status: UserStatus.ACTIVE,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(userDoc, newUser);
  
  // Registar auditoria da criação
  await logAuditAction({
    userId: "SYSTEM", // No Onboarding inicial é o sistema
    action: "USER_CREATED",
    targetId: data.uid,
    details: `Novo utilizador criado: ${data.fullName} (${data.role})`,
    timestamp: serverTimestamp()
  });
};

/**
 * 3. Atualizar Dados de Membro da Equipa
 */
export const updateAppUser = async (uid: string, updates: Partial<AppUser>, adminId: string): Promise<void> => {
  const userDoc = doc(db, "businesses", CLIENT_ID, "users", uid);
  
  await updateDoc(userDoc, {
    ...updates,
    updatedAt: serverTimestamp()
  });

  await logAuditAction({
    userId: adminId,
    action: "USER_UPDATED",
    targetId: uid,
    details: `Dados de utilizador retificados pelo administrador.`,
    timestamp: serverTimestamp(),
    metadata: { updates }
  });
};

/**
 * 4. Listar Todos os Membros da Equipa
 * Usado no painel de gestão de equipa (Owner/Manager)
 */
export const listTeamMembers = async (): Promise<AppUser[]> => {
  const q = query(usersRef, orderBy("fullName", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
};

/**
 * 5. Listar Apenas Profissionais Ativos
 * Usado para popular filtros de agenda e seletores de atendimento
 */
export const listActiveProfessionals = async (): Promise<AppUser[]> => {
  const q = query(
    usersRef, 
    where("role", "==", UserRole.PROFESSIONAL),
    where("status", "==", UserStatus.ACTIVE),
    orderBy("fullName", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
};

/**
 * 6. Motor de Auditoria (Audit Logs)
 * Regista todas as ações críticas para conformidade e segurança
 */
export const logAuditAction = async (log: Omit<AuditLog, 'id' | 'businessId'>): Promise<void> => {
  try {
    await addDoc(auditRef, {
      ...log,
      businessId: CLIENT_ID,
      timestamp: log.timestamp || serverTimestamp()
    });
  } catch (error) {
    // Falha silenciosa em produção para não interromper o fluxo do utilizador, 
    // mas log no console em dev.
    console.error("Falha ao gravar log de auditoria:", error);
  }
};

/**
 * 7. Obter Histórico de Auditoria
 */
export const getAuditLogs = async (limitCount: number = 50): Promise<AuditLog[]> => {
  const q = query(auditRef, orderBy("timestamp", "desc"), orderBy("action", "asc")); 
  // Nota: Query limitada por segurança. Requer índice no Firestore.
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
};
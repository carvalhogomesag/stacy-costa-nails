// src/services/crmService.ts

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  getDoc,
  limit,
  setDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { CLIENT_ID } from '../constants';
import { 
  Customer, 
  CustomerTimelineEvent, 
  CrmEventType, 
  CustomerTag,
  CrmTask,
  CrmTaskStatus,
  Lead,
  LeadStage
} from '../types';

/**
 * CAMINHOS FIRESTORE (Multi-tenant)
 */
const customersRef = collection(db, "businesses", CLIENT_ID, "customers");
const eventsRef = collection(db, "businesses", CLIENT_ID, "crmEvents");
const tasksRef = collection(db, "businesses", CLIENT_ID, "crmTasks");
const leadsRef = collection(db, "businesses", CLIENT_ID, "leads"); // NOVO: Fase 4

/**
 * 1. Pesquisa cliente por telemóvel (Deduplicação)
 */
export const findCustomerByPhone = async (phone: string): Promise<Customer | null> => {
  const q = query(customersRef, where("phone", "==", phone), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Customer;
};

/**
 * 2. Cria ou Atualiza Cliente (Upsert)
 */
export const upsertCustomer = async (
  data: Partial<Customer>, 
  adminId: string
): Promise<string> => {
  const existing = await findCustomerByPhone(data.phone!);

  if (existing) {
    const customerDoc = doc(db, "businesses", CLIENT_ID, "customers", existing.id!);
    await updateDoc(customerDoc, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return existing.id!;
  }

  const newCustomer: Omit<Customer, 'id'> = {
    name: data.name || '',
    phone: data.phone || '',
    whatsapp: data.whatsapp || data.phone || '',
    email: data.email || '',
    tags: [CustomerTag.New],
    marketingConsent: data.marketingConsent || false,
    stats: {
      totalSpent: 0,
      appointmentsCount: 0,
      averageTicket: 0,
      noShowCount: 0
    },
    preferences: {
      favoriteServices: []
    },
    createdAt: serverTimestamp(),
    createdBy: adminId,
    updatedAt: serverTimestamp(),
    ...data
  };

  const docRef = await addDoc(customersRef, newCustomer);
  
  await recordCrmEvent({
    customerId: docRef.id,
    type: CrmEventType.ManualEdit,
    title: "Novo Cadastro",
    description: "Cliente registado no sistema.",
    createdBy: adminId
  });

  return docRef.id;
};

/**
 * 3. Registar Evento na Timeline
 */
export const recordCrmEvent = async (
  event: Omit<CustomerTimelineEvent, 'id' | 'createdAt'>
): Promise<void> => {
  await addDoc(eventsRef, {
    ...event,
    createdAt: serverTimestamp()
  });
};

/**
 * 4. Obter Timeline do Cliente
 */
export const getCustomerTimeline = async (customerId: string): Promise<CustomerTimelineEvent[]> => {
  const q = query(
    eventsRef, 
    where("customerId", "==", customerId), 
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerTimelineEvent));
};

/**
 * 5. Atualizar Estatísticas Financeiras
 */
export const updateCustomerFinancialStats = async (
  customerId: string, 
  paidAmount: number
): Promise<void> => {
  const customerDoc = doc(db, "businesses", CLIENT_ID, "customers", customerId);
  const snap = await getDoc(customerDoc);
  
  if (!snap.exists()) return;
  
  const current = snap.data() as Customer;
  const newCount = (current.stats.appointmentsCount || 0) + 1;
  const newTotal = (current.stats.totalSpent || 0) + paidAmount;
  
  await updateDoc(customerDoc, {
    "stats.appointmentsCount": newCount,
    "stats.totalSpent": newTotal,
    "stats.averageTicket": newTotal / newCount,
    "stats.lastVisitDate": new Date().toISOString().split('T')[0],
    updatedAt: serverTimestamp()
  });
};

/**
 * 6. Atualizar Estatísticas de No-Show
 */
export const updateCustomerNoShowStats = async (customerId: string): Promise<void> => {
  const customerDoc = doc(db, "businesses", CLIENT_ID, "customers", customerId);
  const snap = await getDoc(customerDoc);
  if (!snap.exists()) return;

  const current = snap.data() as Customer;
  const newNoShowCount = (current.stats.noShowCount || 0) + 1;

  await updateDoc(customerDoc, {
    "stats.noShowCount": newNoShowCount,
    tags: newNoShowCount >= 2 
      ? Array.from(new Set([...current.tags, CustomerTag.NoShowRecurrent]))
      : current.tags,
    updatedAt: serverTimestamp()
  });
};

/**
 * 7. Inteligência: Obter Estatísticas Globais do CRM
 */
export const getCRMGlobalStats = async () => {
  const snap = await getDocs(customersRef);
  const customers = snap.docs.map(d => d.data() as Customer);

  const totalLTV = customers.reduce((acc, curr) => acc + (curr.stats.totalSpent || 0), 0);
  const totalVisits = customers.reduce((acc, curr) => acc + (curr.stats.appointmentsCount || 0), 0);
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];

  const inRiskCount = customers.filter(c => 
    c.stats.lastVisitDate && c.stats.lastVisitDate < sixtyDaysAgoStr
  ).length;

  return {
    totalCustomers: customers.length,
    totalLTV,
    averageLTV: customers.length > 0 ? totalLTV / customers.length : 0,
    averageTicket: totalVisits > 0 ? totalLTV / totalVisits : 0,
    inRiskCount,
    churnRate: customers.length > 0 ? (inRiskCount / customers.length) * 100 : 0
  };
};

/**
 * 8. GESTÃO DE TAREFAS CRM
 */
export const createCrmTask = async (task: Omit<CrmTask, 'id' | 'createdAt' | 'businessId'>): Promise<string> => {
  const docRef = await addDoc(tasksRef, {
    ...task,
    businessId: CLIENT_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const getCrmTasks = async (status?: CrmTaskStatus): Promise<CrmTask[]> => {
  let q = query(tasksRef, orderBy("dueDate", "asc"));
  if (status) {
    q = query(tasksRef, where("status", "==", status), orderBy("dueDate", "asc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CrmTask));
};

export const updateCrmTask = async (taskId: string, updates: Partial<CrmTask>): Promise<void> => {
  const taskDoc = doc(db, "businesses", CLIENT_ID, "crmTasks", taskId);
  await updateDoc(taskDoc, { ...updates, updatedAt: serverTimestamp() });
};

export const deleteCrmTask = async (taskId: string): Promise<void> => {
  await deleteDoc(doc(db, "businesses", CLIENT_ID, "crmTasks", taskId));
};

/**
 * 9. NOVO: GESTÃO DE LEADS E PIPELINE (FASE 4)
 */

// Criar novo Lead
export const createLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'businessId'>): Promise<string> => {
  const docRef = await addDoc(leadsRef, {
    ...lead,
    businessId: CLIENT_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Registar o evento de entrada do lead na timeline (se já existir vínculo futuro)
  return docRef.id;
};

// Obter Leads por Estágio (para o Kanban)
export const getLeads = async (stage?: LeadStage): Promise<Lead[]> => {
  let q = query(leadsRef, orderBy("createdAt", "desc"));
  if (stage) {
    q = query(leadsRef, where("stage", "==", stage), orderBy("createdAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
};

// Atualizar Lead
export const updateLead = async (leadId: string, updates: Partial<Lead>): Promise<void> => {
  const leadDoc = doc(db, "businesses", CLIENT_ID, "leads", leadId);
  await updateDoc(leadDoc, { ...updates, updatedAt: serverTimestamp() });
};

/**
 * CONVERSÃO: Transforma Lead em Cliente Real
 */
export const convertLeadToCustomer = async (leadId: string, adminId: string): Promise<string> => {
  const leadDoc = doc(db, "businesses", CLIENT_ID, "leads", leadId);
  const leadSnap = await getDoc(leadDoc);

  if (!leadSnap.exists()) throw new Error("Lead não encontrado.");
  const leadData = leadSnap.data() as Lead;

  // 1. Criar ou Vincular ao Cliente
  const customerId = await upsertCustomer({
    name: leadData.name,
    phone: leadData.phone,
    whatsapp: leadData.whatsapp,
    notes: `Convertido de Lead. Origem: ${leadData.source}. Notas originais: ${leadData.notes || ''}`
  }, adminId);

  // 2. Atualizar o Lead para Convertido
  await updateDoc(leadDoc, {
    stage: LeadStage.Converted,
    customerId: customerId,
    updatedAt: serverTimestamp()
  });

  // 3. Registar eventos na Timeline do Cliente
  await recordCrmEvent({
    customerId,
    type: CrmEventType.LeadConverted,
    title: "Lead Convertido",
    description: `Este cliente veio através de uma oportunidade do pipeline (${leadData.source}).`,
    createdBy: adminId
  });

  return customerId;
};

/**
 * 10. Obter Todos os Clientes
 */
export const getAllCustomers = async (): Promise<Customer[]> => {
  const q = query(customersRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
};

/**
 * 11. ANONIMIZAÇÃO (LGPD) - REFORÇADO PARA FASE 4
 */
export const anonymizeCustomerData = async (customerId: string): Promise<void> => {
  const customerDoc = doc(db, "businesses", CLIENT_ID, "customers", customerId);
  
  // Limpar PII (Personally Identifiable Information) mas manter histórico para estatísticas do salão
  await updateDoc(customerDoc, {
    name: "CLIENTE_ANONIMO_LGPD",
    phone: "000000000",
    whatsapp: "000000000",
    email: "anonimo@removido.com",
    birthday: "",
    notes: "Dados removidos a pedido do titular (Direito ao Esquecimento - LGPD).",
    marketingConsent: false,
    updatedAt: serverTimestamp()
  });

  // Registar a ação de anonimização na Timeline antes de qualquer outra coisa
  await recordCrmEvent({
    customerId,
    type: CrmEventType.ManualEdit,
    title: "Anonimização LGPD",
    description: "Os dados pessoais deste cliente foram removidos permanentemente.",
    createdBy: "SISTEMA_PRIVACIDADE"
  });
};
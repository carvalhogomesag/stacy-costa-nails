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
  CrmTaskStatus
} from '../types';

/**
 * CAMINHOS FIRESTORE (Multi-tenant)
 */
const customersRef = collection(db, "businesses", CLIENT_ID, "customers");
const eventsRef = collection(db, "businesses", CLIENT_ID, "crmEvents");
const tasksRef = collection(db, "businesses", CLIENT_ID, "crmTasks"); // NOVO

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
 * 8. Inteligência: Filtrar Clientes por Segmento Estratégico
 */
export const getCustomersBySegment = async (segment: 'VIP' | 'RISK' | 'BIRTHDAY_MONTH') => {
  const snap = await getDocs(customersRef);
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));

  const now = new Date();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');

  switch (segment) {
    case 'VIP':
      return all.filter(c => c.tags.includes(CustomerTag.VIP) || c.stats.totalSpent > 500);
    case 'RISK':
      const fortyFiveDaysAgo = new Date();
      fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
      const limitStr = fortyFiveDaysAgo.toISOString().split('T')[0];
      return all.filter(c => c.stats.lastVisitDate && c.stats.lastVisitDate < limitStr);
    case 'BIRTHDAY_MONTH':
      return all.filter(c => c.birthday && c.birthday.split('/')[1] === currentMonth);
    default:
      return all;
  }
};

/**
 * 9. NOVO: GESTÃO DE TAREFAS CRM
 */

// Criar nova tarefa
export const createCrmTask = async (task: Omit<CrmTask, 'id' | 'createdAt' | 'businessId'>): Promise<string> => {
  const newTask = {
    ...task,
    businessId: CLIENT_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const docRef = await addDoc(tasksRef, newTask);
  return docRef.id;
};

// Obter tarefas por status
export const getCrmTasks = async (status?: CrmTaskStatus): Promise<CrmTask[]> => {
  let q = query(tasksRef, orderBy("dueDate", "asc"));
  if (status) {
    q = query(tasksRef, where("status", "==", status), orderBy("dueDate", "asc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CrmTask));
};

// Obter tarefas vinculadas a um cliente específico
export const getCustomerTasks = async (customerId: string): Promise<CrmTask[]> => {
  const q = query(tasksRef, where("customerId", "==", customerId), orderBy("dueDate", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CrmTask));
};

// Atualizar status ou dados da tarefa
export const updateCrmTask = async (taskId: string, updates: Partial<CrmTask>): Promise<void> => {
  const taskDoc = doc(db, "businesses", CLIENT_ID, "crmTasks", taskId);
  await updateDoc(taskDoc, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// Eliminar tarefa
export const deleteCrmTask = async (taskId: string): Promise<void> => {
  const taskDoc = doc(db, "businesses", CLIENT_ID, "crmTasks", taskId);
  await deleteDoc(taskDoc);
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
 * 11. Eliminar Cliente (LGPD)
 */
export const deleteCustomerData = async (customerId: string): Promise<void> => {
  const eventsQ = query(eventsRef, where("customerId", "==", customerId));
  const eventsSnap = await getDocs(eventsQ);
  eventsSnap.forEach(async (d) => await setDoc(d.ref, {})); 

  await updateDoc(doc(db, "businesses", CLIENT_ID, "customers", customerId), {
    name: "CLIENTE_REMOVIDO_LGPD",
    phone: "000000000",
    whatsapp: "000000000",
    email: "",
    isInactive: true,
    updatedAt: serverTimestamp()
  });
};
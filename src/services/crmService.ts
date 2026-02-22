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
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { CLIENT_ID } from '../constants';
import { 
  Customer, 
  CustomerTimelineEvent, 
  CrmEventType, 
  CustomerTag 
} from '../types';

/**
 * CAMINHOS FIRESTORE
 */
const customersRef = collection(db, "businesses", CLIENT_ID, "customers");
const eventsRef = collection(db, "businesses", CLIENT_ID, "crmEvents");

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
 * Útil para quando um cliente faz um agendamento online
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
  
  // Registar evento de "Novo Cliente"
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
 * 5. Atualizar Estatísticas Financeiras (LTV / Visitas)
 * Chamado quando um agendamento é pago
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
 * 6. Obter Todos os Clientes (com filtros básicos)
 */
export const getAllCustomers = async (): Promise<Customer[]> => {
  const q = query(customersRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
};

/**
 * 7. Eliminar Cliente (LGPD)
 */
export const deleteCustomerData = async (customerId: string): Promise<void> => {
  // 1. Eliminar eventos da timeline
  const eventsQ = query(eventsRef, where("customerId", "==", customerId));
  const eventsSnap = await getDocs(eventsQ);
  // Nota: Numa app de larga escala usaríamos batch, aqui para MVP fazemos loop
  eventsSnap.forEach(async (d) => await setDoc(d.ref, {})); 

  // 2. Eliminar cadastro
  await updateDoc(doc(db, "businesses", CLIENT_ID, "customers", customerId), {
    name: "CLIENTE_REMOVIDO_LGPD",
    phone: "000000000",
    whatsapp: "000000000",
    email: "",
    isInactive: true,
    updatedAt: serverTimestamp()
  });
};
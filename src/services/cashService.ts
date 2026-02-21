// src/services/cashService.ts

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
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { CLIENT_ID } from '../constants';
import { CashSession, CashEntry, SessionStatus } from '../types';

/**
 * CAMINHOS FIRESTORE (Multi-tenant)
 */
const sessionsRef = collection(db, "businesses", CLIENT_ID, "cashSessions");
const entriesRef = collection(db, "businesses", CLIENT_ID, "cashEntries");

/**
 * Procura por uma sessão de caixa que esteja atualmente aberta
 */
export const getOpenCashSession = async (): Promise<CashSession | null> => {
  const q = query(
    sessionsRef, 
    where("status", "==", SessionStatus.Open)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;

  const docSnap = querySnapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as CashSession;
};

/**
 * Abre uma nova sessão de caixa
 */
export const openCashSession = async (
  data: Pick<CashSession, 'openingDate' | 'initialBalance' | 'createdBy'>
): Promise<string> => {
  const activeSession = await getOpenCashSession();
  if (activeSession) {
    throw new Error("Já existe uma sessão de caixa aberta.");
  }

  const newSession: Omit<CashSession, 'id'> = {
    businessId: CLIENT_ID,
    openingDate: data.openingDate,
    initialBalance: data.initialBalance,
    status: SessionStatus.Open,
    createdAt: serverTimestamp(),
    createdBy: data.createdBy,
    updatedAt: serverTimestamp(),
    updatedBy: data.createdBy
  };

  const docRef = await addDoc(sessionsRef, newSession);
  return docRef.id;
};

/**
 * Adiciona um movimento (entrada/saída) ao caixa
 */
export const addCashEntry = async (
  data: Omit<CashEntry, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> => {
  const newEntry: Omit<CashEntry, 'id'> = {
    ...data,
    status: 'CONFIRMED',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(entriesRef, newEntry);
  return docRef.id;
};

/**
 * Fecha uma sessão de caixa ativa
 */
export const closeCashSession = async (
  sessionId: string,
  data: Pick<CashSession, 'finalBalance' | 'expectedBalance' | 'divergenceAmount' | 'divergenceNotes' | 'closedBy'>
): Promise<void> => {
  const sessionDoc = doc(db, "businesses", CLIENT_ID, "cashSessions", sessionId);
  
  await updateDoc(sessionDoc, {
    ...data,
    status: SessionStatus.Closed,
    closedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: data.closedBy,
    closingDate: new Date().toISOString().split('T')[0]
  });
};

/**
 * Elimina uma entrada de caixa
 */
export const deleteCashEntry = async (entryId: string): Promise<void> => {
  const entryDoc = doc(db, "businesses", CLIENT_ID, "cashEntries", entryId);
  await deleteDoc(entryDoc);
};

/**
 * Obtém todas as entradas de uma sessão específica
 */
export const getCashEntriesBySession = async (sessionId: string): Promise<CashEntry[]> => {
  const q = query(
    entriesRef, 
    where("sessionId", "==", sessionId),
    orderBy("createdAt", "asc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CashEntry));
};

// --- FASE 3: FUNÇÕES DE HISTÓRICO E RELATÓRIOS ---

/**
 * Obtém sessões fechadas num intervalo de dias
 */
export const getClosedCashSessions = async (days: number = 30): Promise<CashSession[]> => {
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - days);
  const minDateStr = minDate.toISOString().split('T')[0];

  const q = query(
    sessionsRef,
    where("status", "==", SessionStatus.Closed),
    where("openingDate", ">=", minDateStr),
    orderBy("openingDate", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CashSession));
};

/**
 * CORREÇÃO FASE 3: Obtém movimentos consolidados usando CHUNKS (Lotes)
 * Esta função evita o erro de limite de 30 itens do Firestore e otimiza a performance.
 */
export const getEntriesForExport = async (sessionIds: string[]): Promise<CashEntry[]> => {
  if (sessionIds.length === 0) return [];

  // Firestore limita operador 'in' a 30 itens. Vamos dividir em lotes.
  const chunks = [];
  for (let i = 0; i < sessionIds.length; i += 30) {
    chunks.push(sessionIds.slice(i, i + 30));
  }

  let allEntries: CashEntry[] = [];

  // Executar consultas por cada lote
  for (const chunk of chunks) {
    const q = query(
      entriesRef,
      where("sessionId", "in", chunk),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const chunkEntries = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CashEntry));
    allEntries = [...allEntries, ...chunkEntries];
  }

  return allEntries;
};

/**
 * Pesquisa uma sessão específica pela data
 */
export const getSessionByDate = async (dateStr: string): Promise<CashSession | null> => {
  const q = query(
    sessionsRef,
    where("openingDate", "==", dateStr)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  const docSnap = querySnapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as CashSession;
};
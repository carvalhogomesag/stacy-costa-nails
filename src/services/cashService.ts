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
  getDoc,
  deleteDoc
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

  // Em teoria, só deve existir uma sessão aberta por vez
  const docSnap = querySnapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as CashSession;
};

/**
 * Abre uma nova sessão de caixa
 */
export const openCashSession = async (
  data: Pick<CashSession, 'openingDate' | 'initialBalance' | 'createdBy'>
): Promise<string> => {
  // 1. Verificar se já existe uma sessão aberta para evitar duplicados
  const activeSession = await getOpenCashSession();
  if (activeSession) {
    throw new Error("Já existe uma sessão de caixa aberta.");
  }

  // 2. Criar a nova sessão
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
 * Elimina uma entrada de caixa (apenas para correções manuais)
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
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CashEntry));
};
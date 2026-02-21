// src/hooks/useCashSession.ts

import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { CLIENT_ID } from '../constants';
import { CashSession, CashEntry, SessionStatus, CashSummary } from '../types';
import { calculateCashSummary } from '../utils/cashCalculations';

export const useCashSession = () => {
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Escutar se existe uma sessão aberta
  useEffect(() => {
    const sessionsRef = collection(db, "businesses", CLIENT_ID, "cashSessions");
    const q = query(
      sessionsRef, 
      where("status", "==", SessionStatus.Open)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Assume-se apenas uma sessão aberta por regra de negócio
        const doc = snapshot.docs[0];
        setCurrentSession({ id: doc.id, ...doc.data() } as CashSession);
      } else {
        setCurrentSession(null);
        setEntries([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Escutar as entradas da sessão ativa (se houver uma)
  useEffect(() => {
    if (!currentSession?.id) return;

    const entriesRef = collection(db, "businesses", CLIENT_ID, "cashEntries");
    const q = query(
      entriesRef,
      where("sessionId", "==", currentSession.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entriesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CashEntry));
      setEntries(entriesList);
    });

    return () => unsubscribe();
  }, [currentSession?.id]);

  // 3. Calcular o resumo financeiro em tempo real
  // Usamos useMemo para evitar cálculos desnecessários se os dados não mudarem
  const summary: CashSummary = useMemo(() => {
    if (!currentSession) {
      return {
        currentBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        totalByMethod: {} as any
      };
    }
    return calculateCashSummary(currentSession.initialBalance, entries);
  }, [currentSession, entries]);

  return {
    currentSession,
    entries,
    summary,
    loading
  };
};
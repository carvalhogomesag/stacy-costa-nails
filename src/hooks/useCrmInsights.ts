// src/hooks/useCrmInsights.ts

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CLIENT_ID } from '../constants';
import { Customer, CustomerTag } from '../types';

interface CrmStats {
  totalCustomers: number;
  totalLTV: number;
  averageLTV: number;
  averageTicket: number;
  inRiskCount: number;
  churnRate: number;
  vipCount: number;
  newThisMonth: number;
}

/**
 * Hook para extração de métricas inteligentes do CRM
 */
export const useCrmInsights = () => {
  const [stats, setStats] = useState<CrmStats>({
    totalCustomers: 0,
    totalLTV: 0,
    averageLTV: 0,
    averageTicket: 0,
    inRiskCount: 0,
    churnRate: 0,
    vipCount: 0,
    newThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const customersRef = collection(db, "businesses", CLIENT_ID, "customers");

    // Escuta a coleção de clientes para recalcular KPIs automaticamente
    const unsubscribe = onSnapshot(customersRef, (snapshot) => {
      try {
        const customers = snapshot.docs.map(d => d.data() as Customer);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Cálculos de Valor
        const totalLTV = customers.reduce((acc, curr) => acc + (curr.stats?.totalSpent || 0), 0);
        const totalVisits = customers.reduce((acc, curr) => acc + (curr.stats?.appointmentsCount || 0), 0);
        
        // 2. Clientes em Risco (Churn - Mais de 60 dias sem visita)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];

        const inRiskCount = customers.filter(c => 
          c.stats?.lastVisitDate && c.stats.lastVisitDate < sixtyDaysAgoStr
        ).length;

        // 3. Segmentação Rápida
        const vipCount = customers.filter(c => c.tags.includes(CustomerTag.VIP)).length;
        
        const newThisMonth = customers.filter(c => {
          if (!c.createdAt) return false;
          const createdDate = c.createdAt.toDate();
          return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
        }).length;

        setStats({
          totalCustomers: customers.length,
          totalLTV,
          averageLTV: customers.length > 0 ? totalLTV / customers.length : 0,
          averageTicket: totalVisits > 0 ? totalLTV / totalVisits : 0,
          inRiskCount,
          churnRate: customers.length > 0 ? (inRiskCount / customers.length) * 100 : 0,
          vipCount,
          newThisMonth
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Erro ao processar insights:", err);
        setError("Erro ao calcular métricas de CRM.");
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { stats, loading, error };
};
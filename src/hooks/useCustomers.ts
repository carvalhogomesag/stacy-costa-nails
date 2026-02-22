// src/hooks/useCustomers.ts

import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { CLIENT_ID } from '../constants';
import { Customer, CustomerTag } from '../types';

/**
 * Hook para gestão em tempo real da base de clientes do negócio
 */
export const useCustomers = (searchTerm: string = '', activeTag: CustomerTag | 'ALL' = 'ALL') => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Caminho Multi-tenant: businesses/{ID}/customers
    const customersRef = collection(db, "businesses", CLIENT_ID, "customers");
    const q = query(customersRef, orderBy("name", "asc"));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Customer));
        
        setCustomers(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Erro ao carregar clientes:", err);
        setError("Não foi possível carregar a lista de clientes.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtros aplicados no lado do cliente (Client-side filtering para velocidade de busca)
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // 1. Filtro de Busca (Nome ou Telefone)
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.whatsapp.includes(searchTerm);

      // 2. Filtro de Tag
      const matchesTag = activeTag === 'ALL' || customer.tags.includes(activeTag as CustomerTag);

      return matchesSearch && matchesTag;
    });
  }, [customers, searchTerm, activeTag]);

  return {
    customers: filteredCustomers,
    totalCount: customers.length,
    loading,
    error
  };
};
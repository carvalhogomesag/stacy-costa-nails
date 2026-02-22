// src/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile } from '../services/authService';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  user: User | null;           // Utilizador do Firebase Auth
  userData: AppUser | null;    // Perfil detalhado do Firestore (Role, etc)
  loading: boolean;            // Estado de carregamento inicial
  role: UserRole | null;       // Atalho para a Role do utilizador
  isAdmin: boolean;            // Atalho para Owner/Manager
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscreve às mudanças de estado de autenticação do Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        setUser(firebaseUser);
        // Busca o perfil detalhado com a Role no Firestore
        const profile = await getUserProfile(firebaseUser.uid);
        setUserData(profile);
      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  // Helpers de permissão rápidos
  const role = userData?.role || null;
  const isAdmin = role === UserRole.OWNER || role === UserRole.MANAGER;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      role, 
      isAdmin, 
      logout 
    }}>
      {loading ? (
        // Loader global de sistema para evitar "piscadelas" de UI
        <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">A validar acesso...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto de forma simples
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
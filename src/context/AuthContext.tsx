// src/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, createAppUser } from '../services/authService';
import { AppUser, UserRole, UserStatus } from '../types';

interface AuthContextType {
  user: User | null;
  userData: AppUser | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // 1. Tentar obter o perfil
          let profile = await getUserProfile(firebaseUser.uid);

          // 2. Lógica de Bootstrap (Auto-criação para o primeiro acesso)
          if (!profile) {
            console.log("Perfil não encontrado. A tentar criar perfil de OWNER...");
            try {
              await createAppUser({
                uid: firebaseUser.uid,
                fullName: firebaseUser.displayName || 'Administrador',
                email: firebaseUser.email || '',
                role: UserRole.OWNER,
                status: UserStatus.ACTIVE
              });
              // Tenta ler novamente após criar
              profile = await getUserProfile(firebaseUser.uid);
            } catch (createError) {
              console.error("Erro crítico: As regras do Firestore impediram a auto-criação.", createError);
              // Se falhar aqui, é porque as regras de segurança já estão ativas e barram o 'desconhecido'
            }
          }
          
          setUserData(profile);
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (globalError) {
        console.error("Erro na sincronização de autenticação:", globalError);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUserData(null);
    setUser(null);
    setLoading(false);
  };

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
        <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">A validar acesso seguro...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
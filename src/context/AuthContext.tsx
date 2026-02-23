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
  businessId: string | null; // Adicionado para facilitar o isolamento multi-tenant
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<{ role?: UserRole, businessId?: string }>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        
        if (firebaseUser) {
          // 1. EXTRAÇÃO DE CLAIMS (Hardening de Segurança)
          let tokenResult = await firebaseUser.getIdTokenResult();
          
          // Se o utilizador acabou de ser convidado, as claims podem não estar no token local.
          // Forçamos um refresh se role ou businessId estiverem em falta.
          if (!tokenResult.claims.role || !tokenResult.claims.businessId) {
            console.log("Claims em falta. A forçar atualização de token...");
            await firebaseUser.getIdToken(true);
            tokenResult = await firebaseUser.getIdTokenResult();
          }

          setClaims({
            role: tokenResult.claims.role as UserRole,
            businessId: tokenResult.claims.businessId as string
          });

          setUser(firebaseUser);
          
          // 2. BUSCA DE PERFIL NO FIRESTORE
          let profile = await getUserProfile(firebaseUser.uid);

          // 3. LÓGICA DE BOOTSTRAP (Apenas se as Rules permitirem ou for o primeiro OWNER)
          if (!profile && !tokenResult.claims.role) {
            console.log("Perfil e Claims não encontrados. A tentar criar perfil inicial...");
            try {
              await createAppUser({
                uid: firebaseUser.uid,
                fullName: firebaseUser.displayName || 'Administrador',
                email: firebaseUser.email || '',
                role: UserRole.OWNER,
                status: UserStatus.ACTIVE
              });
              profile = await getUserProfile(firebaseUser.uid);
            } catch (createError) {
              console.warn("Bootstrap automático bloqueado pelas Rules. Provisionamento deve ser via Cloud Functions.");
            }
          }
          
          setUserData(profile);
          
          // SEGURANÇA MÁXIMA: Se após tudo, não houver BusinessId, o acesso é inválido
          if (!tokenResult.claims.businessId && !profile) {
             console.error("Utilizador sem vínculo empresarial. Logout por segurança.");
             await signOut(auth);
          }

        } else {
          setUser(null);
          setUserData(null);
          setClaims({});
        }
      } catch (globalError) {
        console.error("Erro crítico na sincronização de sessão:", globalError);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUserData(null);
      setUser(null);
      setClaims({});
    } finally {
      setLoading(false);
    }
  };

  // Helpers derivados diretamente do Token de Segurança (Verdade Absoluta)
  const role = (claims.role || userData?.role) as UserRole | null;
  const businessId = claims.businessId || userData?.businessId || null;
  const isAdmin = role === UserRole.OWNER || role === UserRole.MANAGER;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      role, 
      businessId,
      isAdmin, 
      logout 
    }}>
      {loading ? (
        <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">A sincronizar chaves de segurança...</p>
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
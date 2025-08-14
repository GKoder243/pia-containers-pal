import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

// Définir une interface pour les identifiants de connexion
interface LoginCredentials {
  email: string;
  mot_de_passe: string;
}

interface User {
  id: number;
  nom: string;
  email: string;
  role: 'Admin' | 'CC' | 'PIA';
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login(credentials: LoginCredentials): Promise<void>;
  logout(): void;
}

// J'ai ajouté un type pour les props du Provider pour plus de clarté
interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Renommé en "appLoading" pour différencier le chargement initial de celui du login
  const [appLoading, setAppLoading] = useState(true);
  // Ajout d'un état de chargement spécifique aux actions (login)
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadStorageData() {
      const storedToken = await AsyncStorage.getItem('@App:token');
      const storedUser = await AsyncStorage.getItem('@App:user');

      if (storedToken && storedUser) {
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
      setAppLoading(false);
    }
    loadStorageData();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    // 1. Démarrer l'indicateur de chargement
    setActionLoading(true);
    try {
      // 2. Le "try" tente d'exécuter la requête
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;

      setUser(user);
      setToken(token);

      api.defaults.headers.Authorization = `Bearer ${token}`;

      await AsyncStorage.setItem('@App:token', token);
      await AsyncStorage.setItem('@App:user', JSON.stringify(user));

    } catch (error) {
      // 3. Le "catch" se déclenche si la requête échoue
      console.error('[AuthContext] Erreur de connexion:', error);
      // La ligne suivante est cruciale : elle renvoie l'erreur à l'écran de connexion
      throw error;
    } finally {
      // 4. Le "finally" s'exécute toujours, que ça réussisse ou échoue
      // On arrête l'indicateur de chargement dans tous les cas
      setActionLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    setUser(null);
    setToken(null);
  };

  return (
    // On expose la combinaison des deux états de chargement
    <AuthContext.Provider value={{ 
        user, 
        token, 
        // Le "loading" global est vrai si l'app charge OU si une action est en cours
        loading: appLoading || actionLoading, 
        login, 
        logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
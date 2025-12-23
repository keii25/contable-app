import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/userService';
import type { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Inicializar admin por defecto si no existe
        await userService.initializeAdmin();

        // Verificar si hay un usuario en sesión
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('🔄 Restoring user from localStorage:', parsedUser);
          console.log('🆔 Restored User ID type:', typeof parsedUser.id, 'value:', parsedUser.id);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      // Para compatibilidad entre localStorage y Supabase, usamos el password como está
      // En localStorage se compara con btoa(password), en Supabase se compara directamente
      let foundUser = await userService.authenticateUser(username, password);

      // Si no se encontró el usuario y es el admin por defecto, intentar crearlo
      if (!foundUser && username === 'admin' && password === 'admin123*') {
        console.log('Admin user not found, attempting to create...');
        try {
          await userService.initializeAdmin();
          // Intentar autenticar nuevamente después de crear
          foundUser = await userService.authenticateUser(username, password);
        } catch (createError) {
          console.error('Error creating admin user:', createError);
        }
      }

      if (foundUser) {
        console.log('✅ Login successful, user data:', foundUser);
        console.log('🆔 User ID type:', typeof foundUser.id, 'value:', foundUser.id);
        setUser(foundUser);
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
        console.log('💾 Saved to localStorage');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
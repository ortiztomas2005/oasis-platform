'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  name: string;
  dni: string;
  email: string;
  phone?: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  register: (userData: User & { password: string }) => { success: boolean; error?: string };
  updateProfile: (updatedData: { email: string; phone?: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      // 1. Cargar sesión activa
      const session = localStorage.getItem('oasis_current_session');
      if (session) {
        setUser(JSON.parse(session));
      }

      // 2. Inicializar base de usuarios por defecto si está vacía
      const storedUsers = localStorage.getItem('oasis_registered_users');
      if (!storedUsers) {
        const initialUsers: User[] = [
          {
            name: 'Franco Admin',
            dni: '42981332',
            email: 'admin@oasis.com',
            phone: '+54 9 11 5555-4321',
            password: 'password123',
          },
        ];
        localStorage.setItem('oasis_registered_users', JSON.stringify(initialUsers));
      }
    } catch (e) {
      console.warn('Error inicializando autenticación');
    }
  }, []);

  // Iniciar sesión con validación estricta de credenciales
  const login = (email: string, pass: string) => {
    try {
      const storedUsers = localStorage.getItem('oasis_registered_users');
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === pass
      );

      if (!found) {
        return { success: false, error: 'Credenciales inválidas. Verificá tu correo o contraseña.' };
      }

      const { password, ...safeUser } = found;
      setUser(safeUser);
      localStorage.setItem('oasis_current_session', JSON.stringify(safeUser));
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Error del sistema al procesar el inicio de sesión.' };
    }
  };

  // Registro de nuevo usuario
  const register = (userData: User & { password: string }) => {
    try {
      const storedUsers = localStorage.getItem('oasis_registered_users');
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

      // Validar si el DNI o el Email ya existen
      const emailExists = users.some(
        (u) => u.email.toLowerCase() === userData.email.toLowerCase().trim()
      );
      if (emailExists) {
        return { success: false, error: 'Ya existe una cuenta registrada con este correo electrónico.' };
      }

      const dniExists = users.some(
        (u) => u.dni.replace(/\D/g, '') === userData.dni.replace(/\D/g, '')
      );
      if (dniExists) {
        return { success: false, error: 'Ya existe una cuenta registrada con este número de DNI.' };
      }

      const newUser: User = {
        name: userData.name.trim(),
        dni: userData.dni.trim(),
        email: userData.email.toLowerCase().trim(),
        phone: userData.phone?.trim() || '',
        password: userData.password,
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem('oasis_registered_users', JSON.stringify(updatedUsers));

      const { password, ...safeUser } = newUser;
      setUser(safeUser);
      localStorage.setItem('oasis_current_session', JSON.stringify(safeUser));

      return { success: true };
    } catch (e) {
      return { success: false, error: 'Error al registrar la cuenta.' };
    }
  };

  // Modificar únicamente email o teléfono
  const updateProfile = (updatedData: { email: string; phone?: string }) => {
    if (!user) return;

    try {
      const newEmail = updatedData.email.toLowerCase().trim();
      const newPhone = updatedData.phone?.trim() || '';

      const updatedUser: User = {
        ...user,
        email: newEmail,
        phone: newPhone,
      };

      // Actualizar sesión actual
      setUser(updatedUser);
      localStorage.setItem('oasis_current_session', JSON.stringify(updatedUser));

      // Actualizar en el registro general de usuarios
      const storedUsers = localStorage.getItem('oasis_registered_users');
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const updatedList = users.map((u) => {
          if (u.dni === user.dni) {
            return { ...u, email: newEmail, phone: newPhone };
          }
          return u;
        });
        localStorage.setItem('oasis_registered_users', JSON.stringify(updatedList));
      }
    } catch (e) {
      console.warn('Error actualizando perfil');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('oasis_current_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
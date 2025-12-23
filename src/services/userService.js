import { supabase } from '../lib/supabase.js';

const STORAGE_KEY = 'app_users';
const USE_LOCAL_STORAGE = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: verificar configuración
console.log('🔍 Debug - Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('🔍 Debug - Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('🔍 Debug - Using localStorage:', USE_LOCAL_STORAGE);
console.log('🔍 Debug - Supabase client:', !!supabase);

// Función auxiliar para determinar si usar localStorage
const shouldUseLocalStorage = () => {
  return USE_LOCAL_STORAGE || !supabase;
};

// Funciones de localStorage como fallback
const localStorageService = {
  getUsers: () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (users.length === 0) {
      // Crear admin por defecto
      const seedUser = {
        id: Date.now().toString(),
        username: 'admin',
        password: 'admin123*', // Sin hash adicional
        role: 'admin',
      };
      users.push(seedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
    return users;
  },

  addUser: (user) => {
    const users = localStorageService.getUsers();
    const newUser = {
      ...user,
      id: Date.now().toString(),
      password: user.password, // Sin hash adicional
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return newUser;
  },

  updateUser: (id, updates) => {
    const users = localStorageService.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      const updated = { ...users[index], ...updates };
      if (updates.password) {
        updated.password = updates.password; // Sin hash adicional
      }
      users[index] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
  },

  deleteUser: (id) => {
    const users = localStorageService.getUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  authenticateUser: (username, password) => {
    const users = localStorageService.getUsers();
    const foundUser = users.find(u => u.username === username && u.password === password);
    return foundUser || null;
  }
};

export const userService = {
  // Obtener todos los usuarios (solo para admin)
  getUsers: async () => {
    if (shouldUseLocalStorage()) {
      return localStorageService.getUsers();
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Supabase connection error, falling back to localStorage:', error);
      return localStorageService.getUsers();
    }
  },

  // Agregar nuevo usuario
  addUser: async (user) => {
    if (shouldUseLocalStorage()) {
      return localStorageService.addUser(user);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: user.username,
          password_hash: user.password, // Ya viene hasheada desde el frontend
          role: user.role
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding user:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Supabase connection error, falling back to localStorage:', error);
      return localStorageService.addUser(user);
    }
  },

  // Actualizar usuario
  updateUser: async (id, updates) => {
    if (shouldUseLocalStorage()) {
      return localStorageService.updateUser(id, updates);
    }

    try {
      const updateData = { ...updates };
      if (updates.password) {
        updateData.password_hash = updates.password;
        delete updateData.password;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Supabase connection error, falling back to localStorage:', error);
      return localStorageService.updateUser(id, updates);
    }
  },

  // Eliminar usuario
  deleteUser: async (id) => {
    if (shouldUseLocalStorage()) {
      return localStorageService.deleteUser(id);
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    } catch (error) {
      console.error('Supabase connection error, falling back to localStorage:', error);
      return localStorageService.deleteUser(id);
    }
  },

  authenticateUser: async (username, password) => {
    console.log('🔐 Login attempt for user:', username);
    console.log('🔐 Using localStorage:', shouldUseLocalStorage());

    if (shouldUseLocalStorage()) {
      console.log('💾 Using localStorage authentication');
      return localStorageService.authenticateUser(username, password);
    }

    try {
      console.log('☁️ Using Supabase authentication');
      // Para Supabase, comparamos directamente (sin hash adicional)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password) // Comparar directamente
        .single();

      console.log('📊 Supabase query result:', { data: data ? 'User found' : 'No user', error: error?.message });

      if (error || !data) {
        console.log('❌ Authentication failed');
        return null;
      }
      console.log('✅ Authentication successful for user:', data.username);
      return data;
    } catch (error) {
      console.error('💥 Supabase connection error, falling back to localStorage:', error);
      return localStorageService.authenticateUser(username, password);
    }
  },

  // Crear usuario admin por defecto (solo si no existe)
  initializeAdmin: async () => {
    console.log('🔧 Initializing admin user...');
    if (shouldUseLocalStorage()) {
      console.log('📁 Using localStorage, skipping admin initialization');
      // En localStorage, el admin se crea automáticamente en getUsers
      return;
    }

    try {
      console.log('🔍 Checking for existing admin user...');
      // Verificar si ya existe un admin
      const { data: existingAdmin, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (checkError) {
        console.error('❌ Error checking for existing admin:', checkError);
        return;
      }

      console.log('📊 Admin check result:', existingAdmin);

      if (existingAdmin && existingAdmin.length > 0) {
        console.log('✅ Admin user already exists, skipping creation');
        return; // Ya existe un admin
      }

      console.log('👤 Creating default admin user...');
      // Crear admin por defecto
      const { error } = await supabase
        .from('users')
        .insert([{
          username: 'admin',
          password_hash: 'admin123*', // Contraseña por defecto
          role: 'admin'
        }]);

      if (error) {
        console.error('❌ Error creating default admin:', error);
      } else {
        console.log('✅ Default admin user created successfully');
      }
    } catch (error) {
      console.error('💥 Error initializing admin:', error);
    }
  }
};
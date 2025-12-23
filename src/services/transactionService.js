import { supabase } from '../lib/supabase.js';

const TRANSACTIONS_STORAGE_KEY = 'iecp_transacciones_v1';
const USE_LOCAL_STORAGE = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

// Función auxiliar para determinar si usar localStorage
const shouldUseLocalStorage = () => {
  return USE_LOCAL_STORAGE || !supabase;
};

// Funciones de localStorage como fallback
const localStorageTransactionService = {
  getTransactions: (userId) => {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (raw) {
      const transactions = JSON.parse(raw);
      // Filtrar por userId si está disponible, o devolver todas para compatibilidad
      return userId ? transactions.filter(t => t.userId === userId) : transactions;
    }
    return [];
  },

  addTransaction: (transaction, userId) => {
    const transactions = localStorageTransactionService.getTransactions();
    const newTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
      userId: userId,
      created_at: new Date().toISOString()
    };
    transactions.push(newTransaction);
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    return newTransaction;
  },

  updateTransaction: (id, updates) => {
    const transactions = localStorageTransactionService.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
      return transactions[index];
    }
    return null;
  },

  deleteTransaction: (id) => {
    const transactions = localStorageTransactionService.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(filtered));
  },

  loadInitialData: () => {
    try {
      const res = fetch('/seed-transacciones.json');
      return res.then(r => r.json()).catch(() => []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      return [];
    }
  }
};

export const transactionService = {
  // Obtener transacciones del usuario actual
  getTransactions: async (userId) => {
    console.log('📋 Getting transactions for userId:', userId);
    if (shouldUseLocalStorage()) {
      console.log('📁 Using localStorage');
      return localStorageTransactionService.getTransactions(userId);
    }

    try {
      console.log('☁️ Using Supabase, querying for user_id:', userId);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching transactions:', error);
        return [];
      }
      console.log('📊 Transactions retrieved from Supabase:', data);
      return data || [];
    } catch (error) {
      console.error('💥 Supabase connection error, falling back to localStorage:', error);
      return localStorageTransactionService.getTransactions(userId);
    }
  },

  // Agregar nueva transacción
  addTransaction: async (transaction, userId) => {
    console.log('➕ Adding transaction:', { transaction, userId });
    if (shouldUseLocalStorage()) {
      return localStorageTransactionService.addTransaction(transaction, userId);
    }

    try {
      // Accept app's `Transaccion` shape (valor, cuentaContable) and map to DB fields
      const transactionData = {
        user_id: userId,
        type: transaction.tipoMovimiento === 'CREDITO' ? 'ingreso' : 'egreso',
        amount: transaction.valor ?? transaction.monto ?? transaction.amount,
        description: transaction.descripcion ?? transaction.description,
        date: transaction.fecha ?? transaction.date,
        category: transaction.cuentaContable ?? transaction.cuenta ?? transaction.category
      };
      console.log('📤 Sending to Supabase:', transactionData);

      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding transaction:', error);
        throw error;
      }
      console.log('✅ Transaction added successfully:', data);
      return data;
    } catch (error) {
      console.error('💥 Supabase connection error, falling back to localStorage:', error);
      return localStorageTransactionService.addTransaction(transaction, userId);
    }
  },

  // Actualizar transacción
  updateTransaction: async (id, updates) => {
    if (shouldUseLocalStorage()) {
      return localStorageTransactionService.updateTransaction(id, updates);
    }

    try {
      const updateData = {};
      // Support both app and DB field names when updating
      if (updates.valor !== undefined) updateData.amount = updates.valor;
      if (updates.monto !== undefined) updateData.amount = updates.monto;
      if (updates.descripcion !== undefined) updateData.description = updates.descripcion;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.fecha !== undefined) updateData.date = updates.fecha;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.cuentaContable !== undefined) updateData.category = updates.cuentaContable;
      if (updates.cuenta !== undefined) updateData.category = updates.cuenta;
      if (updates.tipoMovimiento !== undefined) {
        updateData.type = updates.tipoMovimiento === 'CREDITO' ? 'ingreso' : 'egreso';
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Supabase connection error, falling back to localStorage:', error);
      return localStorageTransactionService.updateTransaction(id, updates);
    }
  },

  // Eliminar transacción
  deleteTransaction: async (id) => {
    if (shouldUseLocalStorage()) {
      return localStorageTransactionService.deleteTransaction(id);
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        throw error;
      }
    } catch (error) {
      console.error('Supabase connection error, falling back to localStorage:', error);
      return localStorageTransactionService.deleteTransaction(id);
    }
  },

  // Cargar datos iniciales desde seed
  loadInitialData: async () => {
    if (shouldUseLocalStorage()) {
      return localStorageTransactionService.loadInitialData();
    }

    try {
      const res = await fetch('/seed-transacciones.json');
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error loading initial data:', error);
      return [];
    }
  }
};
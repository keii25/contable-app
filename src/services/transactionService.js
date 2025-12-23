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
      // Normalizar y mapear el tipo de movimiento para tolerar variantes (CREDITO/credito/INGRESO/etc.)
      const normalizeTipo = (v) => {
        if (!v) return 'egreso';
        const s = String(v).toLowerCase().trim();
        // Aceptar muchas variantes que puedan venir de build/web antiguo o etiquetas UI
        if (s.includes('cred') || s.includes('ingres') || s === 'income' || s === 'i') return 'ingreso';
        return 'egreso';
      };

      // Accept app's `Transaccion` shape (valor, cuentaContable) and map to DB fields
      const transactionData = {
        user_id: userId,
        type: normalizeTipo(transaction.tipoMovimiento),
        amount: transaction.valor ?? transaction.monto ?? transaction.amount,
        description: transaction.descripcion ?? transaction.description,
        date: transaction.fecha ?? transaction.date,
        category: transaction.cuentaContable ?? transaction.cuenta ?? transaction.category,
        // Optional fields for person data
        cedula: transaction.cedula ?? undefined,
        nombres_apellidos: transaction.nombresApellidos ?? transaction.nombres_apellidos ?? undefined
      };
      // Debug logs: registrar el tipo recibido y el resultado normalizado (ayuda a diagnosticar builds en producción)
      try {
        console.log('🔍 transactionService - addTransaction - raw tipoMovimiento:', transaction.tipoMovimiento, '-> normalized:', transactionData.type);
      } catch (e) {
        // noop
      }
      console.log('📤 Sending to Supabase:', transactionData);

      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();
      if (error) {
        console.error('❌ Error adding transaction (first attempt):', error);
        // If the error mentions missing columns (e.g., cedula, nombres_apellidos), retry without them
        const msg = String(error?.message || error?.details || '').toLowerCase();
        if (msg.includes('column "cedula"') || msg.includes('column "nombres_apellidos"') || msg.includes('column cedula') || msg.includes('column nombres_apellidos')) {
          console.log('ℹ️ Retrying insert without person fields due to missing columns');
          const { data: data2, error: error2 } = await supabase
            .from('transactions')
            .insert([{
              user_id: transactionData.user_id,
              type: transactionData.type,
              amount: transactionData.amount,
              description: transactionData.description,
              date: transactionData.date,
              category: transactionData.category
            }])
            .select()
            .single();
          if (error2) {
            console.error('❌ Retry insert failed:', error2);
            throw error2;
          }
          console.log('✅ Transaction added successfully (without person fields):', data2);
          return data2;
        }
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
      if (updates.cedula !== undefined) updateData.cedula = updates.cedula;
      if (updates.nombresApellidos !== undefined) updateData.nombres_apellidos = updates.nombresApellidos;
      if (updates.tipoMovimiento !== undefined) {
        const normalizeTipo = (v) => {
          if (!v) return 'egreso';
          const s = String(v).toLowerCase().trim();
          if (s.includes('cred') || s.includes('ingres') || s === 'income' || s === 'i') return 'ingreso';
          return 'egreso';
        };
        updateData.type = normalizeTipo(updates.tipoMovimiento);
        try {
          console.log('🔍 transactionService - updateTransaction - raw tipoMovimiento:', updates.tipoMovimiento, '-> normalized:', updateData.type);
        } catch (e) {}
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Error updating transaction (first attempt):', error);
        const msg = String(error?.message || error?.details || '').toLowerCase();
        if (msg.includes('column "cedula"') || msg.includes('column "nombres_apellidos"') || msg.includes('column cedula') || msg.includes('column nombres_apellidos')) {
          console.log('ℹ️ Retrying update without person fields due to missing columns');
          // remove person fields and retry
          delete updateData.cedula;
          delete updateData.nombres_apellidos;
          const { data: data2, error: error2 } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
          if (error2) {
            console.error('❌ Retry update failed:', error2);
            throw error2;
          }
          return data2;
        }
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
import { supabase } from '../lib/supabase.js';

const STORAGE_PREFIX = 'app_accounts_';
const USE_LOCAL_STORAGE = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

const shouldUseLocalStorage = () => USE_LOCAL_STORAGE || !supabase;

const local = {
  getAccountsForUser: (userId) => {
    const key = STORAGE_PREFIX + userId;
    return JSON.parse(localStorage.getItem(key) || '[]');
  },
  saveAccountsForUser: (userId, list) => {
    const key = STORAGE_PREFIX + userId;
    localStorage.setItem(key, JSON.stringify(list));
  },
  addAccount: (userId, name, type) => {
    const list = local.getAccountsForUser(userId);
    const newItem = { id: Date.now().toString(), user_id: userId, name, type, created_at: new Date().toISOString() };
    // evitar duplicados (case-insensitive) por tipo
    if (list.find(a => a.name.toLowerCase() === name.toLowerCase() && a.type === type)) {
      const err = new Error('Cuenta duplicada para el usuario y tipo');
      err.code = 'DUPLICATE';
      throw err;
    }
    list.push(newItem);
    local.saveAccountsForUser(userId, list);
    return newItem;
  },
  updateAccount: (id, userId, updates) => {
    const list = local.getAccountsForUser(userId);
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('No encontrado');
    const newName = updates.name ?? list[idx].name;
    const newType = updates.type ?? list[idx].type;
    if (list.find(a => a.id !== id && a.name.toLowerCase() === newName.toLowerCase() && a.type === newType)) {
      const err = new Error('Cuenta duplicada para el usuario y tipo');
      err.code = 'DUPLICATE';
      throw err;
    }
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    local.saveAccountsForUser(userId, list);
    return list[idx];
  },
  deleteAccount: (id, userId) => {
    let list = local.getAccountsForUser(userId);
    list = list.filter(a => a.id !== id);
    local.saveAccountsForUser(userId, list);
  }
};

export const accountService = {
  getAccountsForUser: async (userId) => {
    if (shouldUseLocalStorage()) return local.getAccountsForUser(userId);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Supabase error getAccountsForUser:', err);
      // Si la tabla no existe en Supabase (schema cache), caer a localStorage para permitir uso local
      const msg = err && (err.message || err.error_description || '').toString();
      if (msg.includes('Could not find the table') || msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('does not exist')) {
        console.warn('Supabase table `accounts` missing — usando localStorage como fallback');
        return local.getAccountsForUser(userId);
      }
      return local.getAccountsForUser(userId);
    }
  },

  addAccount: async (userId, name, type) => {
    if (!['ingreso', 'egreso'].includes(type)) {
      const err = new Error('Tipo inválido');
      err.code = 'INVALID_TYPE';
      throw err;
    }
    if (shouldUseLocalStorage()) return local.addAccount(userId, name, type);
    try {
      // Validación simple: evitar duplicados por user_id, lower(name) y type
      const { data: existing } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', name)
        .eq('type', type)
        .limit(1);

      if (existing && existing.length > 0) {
        const err = new Error('Cuenta duplicada para el usuario y tipo');
        err.code = 'DUPLICATE';
        throw err;
      }

      const { data, error } = await supabase
        .from('accounts')
        .insert([{ user_id: userId, name, type }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Supabase error addAccount:', err);
      const msg = err && (err.message || err.error_description || '').toString();
      if (msg.includes('Could not find the table') || msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('does not exist')) {
        console.warn('Supabase table `accounts` missing — creando en localStorage como fallback');
        return local.addAccount(userId, name, type);
      }
      // Re-throw for other errors
      throw err;
    }
  },

  updateAccount: async (id, userId, updates) => {
    if (shouldUseLocalStorage()) return local.updateAccount(id, userId, updates);
    try {
      // Obtener registro actual para calcular nombre/tipo resultante
      const { data: current, error: curErr } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();
      if (curErr || !current) {
        const err = new Error('Cuenta no encontrada');
        err.code = 'NOT_FOUND';
        throw err;
      }

      const candidateName = (updates.name ?? current.name).trim();
      const candidateType = updates.type ?? current.type;

      if (!['ingreso', 'egreso'].includes(candidateType)) {
        const err = new Error('Tipo inválido');
        err.code = 'INVALID_TYPE';
        throw err;
      }

      // Validar duplicado por user_id + lower(name) + type, excluyendo este id
      const { data: existing, error: exErr } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', candidateName)
        .eq('type', candidateType)
        .neq('id', id)
        .limit(1);
      if (exErr) throw exErr;
      if (existing && existing.length > 0) {
        const err = new Error('Cuenta duplicada para el usuario y tipo');
        err.code = 'DUPLICATE';
        throw err;
      }

      const { data, error } = await supabase
        .from('accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
        console.error('Supabase error updateAccount:', err);
        const msg = err && (err.message || err.error_description || '').toString();
        if (msg.includes('Could not find the table') || msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('does not exist')) {
          console.warn('Supabase table `accounts` missing — actualizando en localStorage como fallback');
          return local.updateAccount(id, userId, updates);
        }
        throw err;
    }
  },

  deleteAccount: async (id, userId) => {
    if (shouldUseLocalStorage()) return local.deleteAccount(id, userId);
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Supabase error deleteAccount:', err);
      const msg = err && (err.message || err.error_description || '').toString();
      if (msg.includes('Could not find the table') || msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('does not exist')) {
        console.warn('Supabase table `accounts` missing — eliminando en localStorage como fallback');
        return local.deleteAccount(id, userId);
      }
      throw err;
    }
  }
};

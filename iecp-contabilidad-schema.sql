-- Crear tabla de usuarios
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'lector')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de transacciones
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ingreso', 'egreso')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS (Row Level Security) - DESHABILITADAS
-- Nota: RLS está deshabilitado porque usamos autenticación personalizada
-- en lugar del sistema de auth de Supabase
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Políticas para usuarios (deshabilitadas temporalmente para evitar recursión)
-- CREATE POLICY "Users can view their own data" ON users
--   FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Admins can view all users" ON users
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM users
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   );

-- Políticas para transacciones (deshabilitadas temporalmente)
-- CREATE POLICY "Users can view their own transactions" ON transactions
--   FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert their own transactions" ON transactions
--   FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own transactions" ON transactions
--   FOR UPDATE USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete their own transactions" ON transactions
--   FOR DELETE USING (auth.uid() = user_id);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
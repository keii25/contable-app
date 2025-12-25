-- Crear tabla accounts para catálogo de cuentas por usuario (perfil)

CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ingreso', 'egreso')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evitar duplicados por usuario, nombre (case-insensitive) y tipo
CREATE UNIQUE INDEX IF NOT EXISTS ux_accounts_user_name_type ON accounts (user_id, lower(name), type);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Nota: RLS no se activa por defecto en este proyecto (ver iecp-contabilidad-schema.sql)

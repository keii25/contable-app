-- Fix RLS infinite recursion issue
-- This script disables RLS and removes problematic policies

-- First, disable RLS on both tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

-- Verify the fix worked
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'transactions')
AND schemaname = 'public';
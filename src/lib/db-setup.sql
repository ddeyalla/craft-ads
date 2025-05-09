-- Supabase profiles table SQL

-- This table extends Supabase Auth users with profiles
-- Create a profiles table with Reddit-style usernames
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a security policy that lets authenticated users read all profiles
CREATE POLICY "Profiles are viewable by authenticated users" 
  ON profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create a security policy that lets users update their own profile
CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create a security policy that lets service_role create new profiles
CREATE POLICY "Only service_role can create profiles" 
  ON profiles FOR INSERT 
  USING (auth.role() = 'service_role');

-- Add DB modification to include user_id column in existing tables where needed
ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;

-- Create a security policy for ads that lets users read/write their own ads only
CREATE POLICY "Users can read their own ads" 
  ON ads FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ads" 
  ON ads FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads" 
  ON ads FOR UPDATE 
  USING (auth.uid() = user_id);

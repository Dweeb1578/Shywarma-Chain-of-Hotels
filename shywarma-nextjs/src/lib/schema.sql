-- Run this in your Supabase SQL Editor

-- 1. Users table (Links WhatsApp Phone to a persistent ID)
create table if not exists users (
  id uuid default uuid_generate_v4() primary key,
  phone_number text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Unified Messages table (Stores WhatsApp and Web chats together for context)
-- Note: You might already have 'chat_logs', but this is specific for the "Context Window" feature
create table if not exists unified_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  source text check (source in ('whatsapp', 'web', 'system')) not null,
  role text check (role in ('user', 'assistant', 'agent')) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Optional, depending on your setup)
alter table users enable row level security;
alter table unified_messages enable row level security;

-- Policy: Allow public read/insert (for demo/simplicity, tighten this in production!)
create policy "Allow public access" on users for all using (true) with check (true);
create policy "Allow public access" on unified_messages for all using (true) with check (true);

-- ============================================================================
-- Seed Template: admin_whitelist (4 Anggota Tim Nottura)
-- GANTI email placeholder di bawah dengan email Google asli tim Nottura
-- sebelum menjalankan SQL ini di Supabase SQL Editor.
-- ============================================================================

insert into public.admin_whitelist (email, name, role)
values
  ('raken.nottura@gmail.com', 'Raken', 'owner'),
  ('arya.nottura@gmail.com', 'Arya', 'admin'),
  ('cs1.nottura@gmail.com', 'Admin CS 1', 'admin'),
  ('cs2.nottura@gmail.com', 'Admin CS 2', 'admin')
on conflict (email) do nothing;

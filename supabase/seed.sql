-- ============================================================================
-- Seed Template: admin_whitelist (4 Anggota Tim Nottura)
-- GANTI email placeholder di bawah dengan email Google asli tim Nottura
-- sebelum menjalankan SQL ini di Supabase SQL Editor.
-- ============================================================================

insert into public.admin_whitelist (email, name, role)
values
  ('rakenriski3366@gmail.com', 'Raken', 'owner'),
  ('sahputradamar40@gmail.com', 'Arya', 'admin'),
  ('ychel4508@gmail.com', 'Chelo', 'admin'),
  ('riduwann.1999@gmail.com', 'Riduwan', 'admin')
on conflict (email) do update set role = excluded.role;

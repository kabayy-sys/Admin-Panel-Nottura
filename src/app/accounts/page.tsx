"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { GroupStatus, GroupType } from "@/types/database";
import { useAccounts } from "@/hooks/useAccounts";

export default function AccountsPage() {
  const {
    groups,
    selectedGroupMembers,
    loadingMembers,
    loading,
    submitting,
    error,
    createGroup,
    deleteGroup,
    loadGroupMembers,
  } = useAccounts();

  const [groupName, setGroupName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [groupType, setGroupType] = useState<GroupType>("shared");
  const [maxSlots, setMaxSlots] = useState(5);
  const [masterExpiredAt, setMasterExpiredAt] = useState("");
  const [status, setStatus] = useState<GroupStatus>("active");
  const [notes, setNotes] = useState("");
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createGroup({
      group_name: groupName,
      manager_email: managerEmail,
      group_type: groupType,
      max_slots: maxSlots,
      master_expired_at: masterExpiredAt,
      status,
      notes: notes || null,
    });
    setGroupName("");
    setManagerEmail("");
    setNotes("");
  }

  async function handleViewMembers(groupId: string) {
    setActiveGroupId(groupId);
    await loadGroupMembers(groupId);
  }

  // TODO(Arya): Ganti markup polos dengan Card Grid / Tabel Akun Google Pro, modal Tambah/Edit, dan modal Lihat Anggota.
  return (
    <main>
      <h1>Manajemen Akun Google Pro</h1>
      <nav>
        <Link href="/">Kembali ke Dashboard</Link>
      </nav>

      {error ? <p role="alert">{error}</p> : null}

      <section>
        <h2>Tambah Akun Induk</h2>
        <form onSubmit={handleCreate}>
          <input
            placeholder="Nama Grup (mis. Nottura-01)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email Manager"
            value={managerEmail}
            onChange={(e) => setManagerEmail(e.target.value)}
            required
          />
          <select
            value={groupType}
            onChange={(e) => setGroupType(e.target.value as GroupType)}
          >
            <option value="shared">Shared</option>
            <option value="full">Full Group</option>
          </select>
          <input
            type="number"
            min={1}
            max={5}
            value={maxSlots}
            onChange={(e) => setMaxSlots(Number(e.target.value) || 5)}
          />
          <input
            type="date"
            value={masterExpiredAt}
            onChange={(e) => setMasterExpiredAt(e.target.value)}
            required
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as GroupStatus)}
          >
            <option value="active">Aktif</option>
            <option value="full">Penuh</option>
            <option value="suspended">Bermasalah/Suspended</option>
          </select>
          <input
            placeholder="Catatan (opsional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button type="submit" disabled={submitting}>
            Tambah Akun
          </button>
        </form>
      </section>

      <section>
        <h2>Daftar Grup Family Sharing</h2>
        {loading ? <p>Memuat grup...</p> : null}
        <table>
          <thead>
            <tr>
              <th>Nama Grup</th>
              <th>Email Manager</th>
              <th>Tipe</th>
              <th>Slot</th>
              <th>Ready</th>
              <th>Expired Induk</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id}>
                <td>{group.group_name}</td>
                <td>{group.manager_email}</td>
                <td>{group.group_type}</td>
                <td>
                  {group.active_members_count} / {group.max_slots} Terisi
                </td>
                <td>
                  {group.is_full ? "FULL" : `${group.ready_slots} Slot Ready`}
                </td>
                <td>{group.master_expired_at}</td>
                <td>{group.effective_status}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => void handleViewMembers(group.id)}
                  >
                    Lihat Anggota
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void deleteGroup(group.id)}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {activeGroupId ? (
        <section>
          <h2>Anggota Grup Terpilih</h2>
          {loadingMembers ? (
            <p>Memuat anggota...</p>
          ) : selectedGroupMembers.length === 0 ? (
            <p>Belum ada anggota aktif di grup ini.</p>
          ) : (
            <ul>
              {selectedGroupMembers.map((member) => (
                <li key={member.id}>
                  {member.full_name} ({member.gmail}) — {member.status}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </main>
  );
}

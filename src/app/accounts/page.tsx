"use client";

import { useMemo, useState, type FormEvent } from "react";
import type {
  CustomerRow,
  EnrichedCustomer,
  FamilyGroupRow,
  FamilyGroupWithSlots,
  GroupStatus,
  GroupType,
} from "@/types/database";
import { useAccounts } from "@/hooks/useAccounts";
import {
  buildDemoEnrichedCustomers,
  buildDemoGroupsWithSlots,
  buildDemoSeed,
} from "@/components/demo-data";
import {
  formatShortDate,
  getCustomerStatusMeta,
  getGroupStatusMeta,
} from "@/components/formatters";
import { addDaysToDateString, getTodayDateString } from "@/lib/logic/customer";

export default function AccountsPage() {
  const {
    groups,
    selectedGroupMembers,
    loadingMembers,
    loading,
    submitting,
    error,
    supabaseConfigured,
    createGroup,
    updateGroup,
    deleteGroup,
    loadGroupMembers,
  } = useAccounts();

  // Demo fallback state so UI works interactively when Supabase is not configured
  const initialDemo = useMemo(() => buildDemoSeed(), []);
  const [demoGroups, setDemoGroups] = useState<FamilyGroupRow[]>(
    initialDemo.groups,
  );
  const [demoCustomers] = useState<CustomerRow[]>(initialDemo.customers);

  const isUsingDemo = !supabaseConfigured && groups.length === 0;
  const activeGroups: FamilyGroupWithSlots[] = useMemo(() => {
    if (isUsingDemo) {
      return buildDemoGroupsWithSlots(demoGroups, demoCustomers);
    }
    return groups;
  }, [isUsingDemo, demoGroups, demoCustomers, groups]);

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal Tambah/Edit Akun state
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FamilyGroupWithSlots | null>(
    null,
  );
  const [groupName, setGroupName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [groupType, setGroupType] = useState<GroupType>("shared");
  const [maxSlots, setMaxSlots] = useState(5);
  const [masterExpiredAt, setMasterExpiredAt] = useState(
    addDaysToDateString(getTodayDateString(), 30),
  );
  const [status, setStatus] = useState<GroupStatus>("active");
  const [notes, setNotes] = useState("");

  // Modal Lihat Anggota state
  const [membersModalGroup, setMembersModalGroup] =
    useState<FamilyGroupWithSlots | null>(null);
  const [demoSelectedMembers, setDemoSelectedMembers] = useState<
    EnrichedCustomer[]
  >([]);

  function openCreateModal() {
    setEditingGroup(null);
    setGroupName(`Nottura-0${activeGroups.length + 1}`);
    setManagerEmail("");
    setGroupType("shared");
    setMaxSlots(5);
    setMasterExpiredAt(addDaysToDateString(getTodayDateString(), 30));
    setStatus("active");
    setNotes("");
    setFormOpen(true);
  }

  function openEditModal(group: FamilyGroupWithSlots) {
    setEditingGroup(group);
    setGroupName(group.group_name);
    setManagerEmail(group.manager_email);
    setGroupType(group.group_type);
    setMaxSlots(group.max_slots);
    setMasterExpiredAt(group.master_expired_at);
    setStatus(group.status);
    setNotes(group.notes ?? "");
    setFormOpen(true);
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      group_name: groupName.trim(),
      manager_email: managerEmail.trim(),
      group_type: groupType,
      max_slots: maxSlots,
      master_expired_at: masterExpiredAt,
      status: groupType === "full" && status === "active" ? "full" : status,
      notes: notes.trim() || null,
    };

    if (isUsingDemo) {
      if (editingGroup) {
        setDemoGroups((prev) =>
          prev.map((item) =>
            item.id === editingGroup.id ? { ...item, ...payload } : item,
          ),
        );
      } else {
        setDemoGroups((prev) => [
          ...prev,
          {
            id: `demo-grp-${Date.now()}`,
            ...payload,
            created_at: getTodayDateString(),
          },
        ]);
      }
      setFormOpen(false);
      return;
    }

    if (editingGroup) {
      await updateGroup(editingGroup.id, payload);
    } else {
      await createGroup(payload);
    }
    setFormOpen(false);
  }

  async function handleDeleteGroup(group: FamilyGroupWithSlots) {
    if (isUsingDemo) {
      setDemoGroups((prev) => prev.filter((item) => item.id !== group.id));
      return;
    }
    await deleteGroup(group.id);
  }

  async function handleViewMembers(group: FamilyGroupWithSlots) {
    setMembersModalGroup(group);
    if (isUsingDemo) {
      const enriched = buildDemoEnrichedCustomers(demoGroups, demoCustomers);
      setDemoSelectedMembers(
        enriched.filter((c) => c.family_group_id === group.id),
      );
      return;
    }
    await loadGroupMembers(group.id);
  }

  const displayedMembers = isUsingDemo
    ? demoSelectedMembers
    : selectedGroupMembers;

  const totalSharedReady = activeGroups
    .filter((g) => g.group_type === "shared" && g.status !== "suspended")
    .reduce((acc, g) => acc + g.ready_slots, 0);

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <section className="bg-[#090A33] border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Grup Family Sharing (Akun Induk)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {totalSharedReady} Slot Shared Ready
            </span>
            {isUsingDemo ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Mode Preview Data Dummy
              </span>
            ) : null}
          </div>
          <p className="text-xs text-white/65 mt-1">
            Kelola akun induk Google AI Pro. Grup bertipe{" "}
            <strong className="text-white">Full Group</strong> otomatis dianggap
            penuh (<code className="text-white/90">0 Slot Ready</code>).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="inline-flex rounded-xl bg-[#121212] border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Card Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Tabel
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white text-[#090A33] hover:bg-white/90 font-semibold text-xs sm:text-sm px-4 py-2.5 transition cursor-pointer shadow-sm"
          >
            <span>+ Tambah Akun Induk</span>
          </button>
        </div>
      </section>

      {error && supabaseConfigured ? (
        <div
          role="alert"
          className="rounded-2xl bg-rose-500/15 border border-rose-500/30 px-4 py-3 text-xs text-rose-200"
        >
          {error}
        </div>
      ) : null}

      {loading && activeGroups.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-52 rounded-2xl bg-[#090A33]/60 border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : null}

      {/* Card Grid View */}
      {viewMode === "grid" ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGroups.map((group) => {
            const statusMeta = getGroupStatusMeta(group.effective_status);
            const fillRatio =
              group.group_type === "full"
                ? 100
                : Math.min(
                    100,
                    Math.round(
                      (group.active_members_count /
                        Math.max(1, group.max_slots)) *
                        100,
                    ),
                  );
            const isAlmostFull =
              !group.is_full && group.ready_slots === 1 && group.group_type === "shared";

            return (
              <div
                key={group.id}
                className="bg-[#090A33] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition"
              >
                <div>
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">
                          {group.group_name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            group.group_type === "full"
                              ? "bg-purple-500/15 text-purple-200 border-purple-500/30"
                              : "bg-white/10 text-white/80 border-white/15"
                          }`}
                        >
                          {group.group_type === "full"
                            ? "Full Group"
                            : "Shared"}
                        </span>
                      </div>
                      <p className="text-xs text-white/65 mt-1 truncate">
                        {group.manager_email}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusMeta.badgeClass}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`}
                      />
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Slot Progress Section */}
                  <div className="mt-5 p-3.5 rounded-xl bg-[#121212]/70 border border-white/10">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-white/75 font-medium">
                        {group.active_members_count} / {group.max_slots} Terisi
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          group.is_full
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            : isAlmostFull
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {group.is_full
                          ? "FULL"
                          : `${group.ready_slots} Slot Ready`}
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        style={{ width: `${fillRatio}%` }}
                        className={`h-full rounded-full transition-all ${
                          group.is_full
                            ? "bg-rose-400"
                            : isAlmostFull
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="mt-4 space-y-1 text-xs text-white/65">
                    <div className="flex items-center justify-between">
                      <span>Expired Akun Induk:</span>
                      <span className="text-white font-medium">
                        {formatShortDate(group.master_expired_at)}
                      </span>
                    </div>
                    {group.notes ? (
                      <p className="text-[11px] text-white/55 pt-1 truncate">
                        Catatan: {group.notes}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => void handleViewMembers(group)}
                    className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 py-2 px-3 text-xs font-medium text-white transition cursor-pointer"
                  >
                    Lihat Anggota ({group.active_members_count})
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(group)}
                    className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-2 px-3 text-xs font-medium text-white/80 hover:text-white transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleDeleteGroup(group)}
                    className="rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 py-2 px-3 text-xs font-medium text-rose-300 transition cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        /* Table View */
        <section className="bg-[#090A33] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-white/60 bg-black/20">
                  <th className="py-3.5 px-4">Nama Grup</th>
                  <th className="py-3.5 px-4">Email Manager</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4">Indikator Slot</th>
                  <th className="py-3.5 px-4">Expired Induk</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                {activeGroups.map((group) => {
                  const statusMeta = getGroupStatusMeta(group.effective_status);
                  return (
                    <tr
                      key={group.id}
                      className="hover:bg-white/[0.03] transition"
                    >
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {group.group_name}
                      </td>
                      <td className="py-3.5 px-4 text-white/75">
                        {group.manager_email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-xs bg-white/10 text-white/85 border border-white/15">
                          {group.group_type === "full"
                            ? "Full Group"
                            : "Shared"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white/85">
                            {group.active_members_count} / {group.max_slots}{" "}
                            Terisi
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              group.is_full
                                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {group.is_full
                              ? "FULL"
                              : `${group.ready_slots} Slot Ready`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-white/80">
                        {formatShortDate(group.master_expired_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.badgeClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`}
                          />
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => void handleViewMembers(group)}
                          className="rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 px-2.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                        >
                          Lihat Anggota
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(group)}
                          className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 text-xs text-white/80 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleDeleteGroup(group)}
                          className="rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 px-2.5 py-1.5 text-xs text-rose-300 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal Tambah / Edit Akun Google Pro */}
      {formOpen ? (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#090A33] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {editingGroup
                    ? `Edit Grup ${editingGroup.group_name}`
                    : "Tambah Akun Induk Google Pro"}
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Atur tipe grup Shared (eceran) atau Full Group (private 1
                  grup)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-white/60 hover:text-white text-sm px-2 py-1"
              >
                &#10005;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Nama Grup
                  </label>
                  <input
                    placeholder="Nottura-01"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Email Manager (Akun Induk)
                  </label>
                  <input
                    type="email"
                    placeholder="master01@gmail.com"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    required
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Tipe Grup
                  </label>
                  <select
                    value={groupType}
                    onChange={(e) => setGroupType(e.target.value as GroupType)}
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="shared">Shared (Eceran)</option>
                    <option value="full">Full Group (Private)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Maks. Slot
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={maxSlots}
                    onChange={(e) => setMaxSlots(Number(e.target.value) || 5)}
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as GroupStatus)}
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="active">Aktif</option>
                    <option value="full">Penuh</option>
                    <option value="suspended">Bermasalah / Suspended</option>
                  </select>
                </div>
              </div>

              {groupType === "full" ? (
                <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-3.5 py-2.5 text-xs text-amber-200">
                  Logika Khusus PRD: Karena tipe grup dipilih{" "}
                  <strong>Full Group</strong>, slot otomatis dianggap penuh (
                  <code>0 Slot Ready</code>) meskipun hanya diinput 1
                  koordinator.
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Tanggal Expired Akun Induk
                  </label>
                  <input
                    type="date"
                    value={masterExpiredAt}
                    onChange={(e) => setMasterExpiredAt(e.target.value)}
                    required
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    placeholder="Keterangan grup..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-xs font-medium text-white/80 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-white text-[#090A33] hover:bg-white/90 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal Lihat Anggota Grup */}
      {membersModalGroup ? (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#090A33] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Anggota Grup {membersModalGroup.group_name}
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Manager: {membersModalGroup.manager_email} &bull;{" "}
                  {membersModalGroup.active_members_count} /{" "}
                  {membersModalGroup.max_slots} Terisi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMembersModalGroup(null)}
                className="text-white/60 hover:text-white text-sm px-2 py-1"
              >
                &#10005;
              </button>
            </div>

            {loadingMembers ? (
              <p className="py-8 text-center text-xs text-white/60">
                Memuat daftar anggota...
              </p>
            ) : displayedMembers.length === 0 ? (
              <p className="py-8 text-center text-xs text-white/60">
                Belum ada anggota yang terdaftar di grup ini.
              </p>
            ) : (
              <ul className="divide-y divide-white/10 max-h-80 overflow-y-auto">
                {displayedMembers.map((member, index) => {
                  const st = getCustomerStatusMeta(member.status);
                  return (
                    <li
                      key={member.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {index + 1}. {member.full_name}
                        </p>
                        <p className="text-xs text-white/60 truncate">
                          {member.gmail} &bull; Habis{" "}
                          {formatShortDate(member.end_date)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${st.badgeClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`}
                        />
                        {st.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setMembersModalGroup(null)}
                className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-2 text-xs font-medium text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

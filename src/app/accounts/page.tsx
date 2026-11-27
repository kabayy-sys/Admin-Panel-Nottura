"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  LayoutGrid,
  Lock,
  Pencil,
  Plus,
  Table2,
  Trash2,
  Users,
} from "lucide-react";
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
import { CopyButton } from "@/components/ui/CopyButton";
import { Modal } from "@/components/ui/Modal";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/MotionPrimitives";
import { useToast } from "@/components/ui/ToastProvider";
import { addDaysToDateString, getTodayDateString } from "@/lib/logic/customer";

export default function AccountsPage() {
  const toast = useToast();
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      status: (groupType === "full" && status === "active"
        ? "full"
        : status) as GroupStatus,
      notes: notes.trim() || null,
    };

    try {
      if (isUsingDemo) {
        if (editingGroup) {
          setDemoGroups((prev) =>
            prev.map((item) =>
              item.id === editingGroup.id ? { ...item, ...payload } : item,
            ),
          );
          toast.success(`Grup ${payload.group_name} diperbarui`);
        } else {
          setDemoGroups((prev) => [
            ...prev,
            {
              id: `demo-grp-${Date.now()}`,
              ...payload,
              created_at: getTodayDateString(),
            },
          ]);
          toast.success(`Grup ${payload.group_name} ditambahkan`);
        }
        setFormOpen(false);
        return;
      }

      if (editingGroup) {
        await updateGroup(editingGroup.id, payload);
        toast.success(`Grup ${payload.group_name} diperbarui`);
      } else {
        await createGroup(payload);
        toast.success(`Grup ${payload.group_name} ditambahkan`);
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menyimpan data grup",
      );
    }
  }

  async function handleDeleteGroup(group: FamilyGroupWithSlots) {
    if (confirmDeleteId !== group.id) {
      setConfirmDeleteId(group.id);
      window.setTimeout(() => {
        setConfirmDeleteId((current) =>
          current === group.id ? null : current,
        );
      }, 3000);
      return;
    }

    setConfirmDeleteId(null);
    try {
      if (isUsingDemo) {
        setDemoGroups((prev) => prev.filter((item) => item.id !== group.id));
        toast.success(`Grup ${group.group_name} dihapus`);
        return;
      }
      await deleteGroup(group.id);
      toast.success(`Grup ${group.group_name} dihapus`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus grup",
      );
    }
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
    <PageTransition className="space-y-6">
      {/* Header & Action Bar */}
      <section className="surface-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-semibold text-[#FAFAFA] tracking-tight">
              Grup Family Sharing (Akun Induk)
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  totalSharedReady > 0 ? "bg-[#22C55E]" : "bg-[#EF4444]"
                }`}
              />
              {totalSharedReady} Slot Ready
            </span>
            {isUsingDemo ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
                Preview Data Dummy
              </span>
            ) : null}
          </div>
          <p className="text-xs text-[#71717A] mt-1">
            Pantau kapasitas 5 slot per akun Google Pro. Grup{" "}
            <strong className="text-[#E4E4E7]">Full Group</strong> otomatis
            terkunci sebagai{" "}
            <code className="font-mono text-[#E4E4E7]">0 Slot Ready</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative inline-flex rounded-xl surface-inset p-1">
            {(
              [
                { value: "grid", label: "Card Grid", icon: LayoutGrid },
                { value: "table", label: "Tabel", icon: Table2 },
              ] as const
            ).map((option) => {
              const Icon = option.icon;
              const active = viewMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setViewMode(option.value)}
                  className={`relative z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    active ? "text-[#FAFAFA]" : "text-[#71717A] hover:text-[#E4E4E7]"
                  }`}
                >
                  {active ? (
                    <motion.span
                      layoutId="accounts-view-toggle"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 35,
                      }}
                      className="absolute inset-0 rounded-lg bg-[#17171D] border border-white/[0.1]"
                    />
                  ) : null}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{option.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAFAFA] text-[#09090B] hover:bg-white font-semibold text-xs sm:text-sm px-4 py-2 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Akun Induk</span>
          </motion.button>
        </div>
      </section>

      {error && supabaseConfigured ? (
        <div
          role="alert"
          className="rounded-2xl bg-[#17171D] border border-white/[0.1] border-l-2 border-l-[#EF4444] px-4 py-3 text-xs text-[#E4E4E7]"
        >
          {error}
        </div>
      ) : null}

      {loading && activeGroups.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-56 rounded-2xl surface-card animate-pulse"
            />
          ))}
        </div>
      ) : null}

      {/* Card Grid View */}
      {viewMode === "grid" ? (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeGroups.map((group) => {
            const statusMeta = getGroupStatusMeta(group.effective_status);
            const isAlmostFull =
              !group.is_full &&
              group.ready_slots === 1 &&
              group.group_type === "shared";
            const slotBlocks = Array.from(
              { length: Math.max(1, group.max_slots) },
              (_, idx) => idx,
            );
            const confirmingDelete = confirmDeleteId === group.id;

            return (
              <StaggerItem key={group.id}>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="surface-card surface-interactive rounded-2xl p-5 h-full flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-[#FAFAFA] tracking-tight whitespace-nowrap">
                            {group.group_name}
                          </h3>
                          <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#17171D] text-[#A1A1AA] border border-white/[0.08]">
                            {group.group_type === "full" ? (
                              <Lock className="h-2.5 w-2.5" />
                            ) : null}
                            {group.group_type === "full"
                              ? "Full Group"
                              : "Shared"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <p className="text-xs font-mono text-[#71717A] truncate">
                            {group.manager_email}
                          </p>
                          <CopyButton
                            value={group.manager_email}
                            label="Email manager"
                          />
                        </div>
                      </div>

                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusMeta.badgeClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`}
                        />
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* Visual 5-Slot Capacity Matrix */}
                    <div className="mt-4 p-3.5 rounded-xl surface-inset">
                      <div className="flex items-center justify-between text-xs mb-2.5">
                        <span className="font-mono tabular-nums text-[#E4E4E7] font-medium">
                          {group.active_members_count} / {group.max_slots} Terisi
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              group.is_full
                                ? "bg-[#EF4444]"
                                : isAlmostFull
                                  ? "bg-[#EAB308]"
                                  : "bg-[#22C55E]"
                            }`}
                          />
                          {group.is_full
                            ? "FULL"
                            : `${group.ready_slots} Slot Ready`}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5">
                        {slotBlocks.map((idx) => {
                          const isOccupied =
                            group.group_type === "full" ||
                            idx < group.active_members_count;

                          let blockClass =
                            "bg-[#17171D] border border-white/[0.07]";
                          if (group.group_type === "full") {
                            blockClass = "bg-[#52525B]";
                          } else if (group.status === "suspended") {
                            blockClass = "bg-[#EAB308]/75";
                          } else if (isOccupied) {
                            blockClass = "bg-[#FAFAFA]";
                          }

                          return (
                            <div
                              key={idx}
                              title={
                                group.group_type === "full"
                                  ? "Full Group (Private)"
                                  : isOccupied
                                    ? `Slot ${idx + 1}: Terisi`
                                    : `Slot ${idx + 1}: Ready`
                              }
                              className={`h-1.5 rounded-full transition-colors ${blockClass}`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="mt-4 space-y-1.5 text-xs text-[#71717A]">
                      <div className="flex items-center justify-between">
                        <span>Expired Akun Induk</span>
                        <span className="font-mono text-[#E4E4E7] font-medium">
                          {formatShortDate(group.master_expired_at)}
                        </span>
                      </div>
                      {group.notes ? (
                        <p className="text-[11px] text-[#71717A] pt-0.5 truncate">
                          Catatan: {group.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void handleViewMembers(group)}
                      className="flex-1 min-w-0 whitespace-nowrap inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#17171D] hover:bg-[#22222A] border border-white/[0.09] py-2 px-2.5 text-xs font-medium text-[#FAFAFA] transition cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5 text-[#A1A1AA] shrink-0" />
                      <span>Anggota ({group.active_members_count})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(group)}
                      title="Edit grup"
                      className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-xl bg-[#0C0C10] hover:bg-[#17171D] border border-white/[0.08] py-2 px-2.5 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleDeleteGroup(group)}
                      className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-xl border py-2 px-2.5 text-xs font-medium transition cursor-pointer ${
                        confirmingDelete
                          ? "bg-[#EF4444] text-white border-[#EF4444]"
                          : "bg-[#0C0C10] hover:bg-[#17171D] border-white/[0.08] text-[#A1A1AA] hover:text-[#EF4444]"
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{confirmingDelete ? "Yakin?" : "Hapus"}</span>
                    </button>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      ) : (
        /* Table View */
        <section className="surface-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-[#71717A] bg-[#0C0C10]">
                  <th className="py-3.5 px-4">Nama Grup</th>
                  <th className="py-3.5 px-4">Email Manager</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4">Indikator Slot</th>
                  <th className="py-3.5 px-4">Expired Induk</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07] text-xs sm:text-sm">
                {activeGroups.map((group) => {
                  const statusMeta = getGroupStatusMeta(group.effective_status);
                  const confirmingDelete = confirmDeleteId === group.id;
                  return (
                    <tr
                      key={group.id}
                      className="hover:bg-[#17171D]/55 transition"
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#FAFAFA] whitespace-nowrap">
                        {group.group_name}
                      </td>
                      <td className="py-3.5 px-4 text-[#A1A1AA] font-mono text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <span>{group.manager_email}</span>
                          <CopyButton
                            value={group.manager_email}
                            label="Email manager"
                          />
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-[#17171D] text-[#E4E4E7] border border-white/[0.08]">
                          {group.group_type === "full"
                            ? "Full Group"
                            : "Shared"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#E4E4E7]">
                            {group.active_members_count} / {group.max_slots}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                group.is_full ? "bg-[#EF4444]" : "bg-[#22C55E]"
                              }`}
                            />
                            {group.is_full
                              ? "FULL"
                              : `${group.ready_slots} Ready`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#A1A1AA] whitespace-nowrap">
                        {formatShortDate(group.master_expired_at)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                          className="rounded-lg bg-[#17171D] hover:bg-[#22222A] border border-white/[0.09] px-2.5 py-1.5 text-xs font-medium text-[#FAFAFA] cursor-pointer transition"
                        >
                          Lihat Anggota
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(group)}
                          className="rounded-lg bg-[#0C0C10] hover:bg-[#17171D] border border-white/[0.08] px-2.5 py-1.5 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleDeleteGroup(group)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium cursor-pointer transition ${
                            confirmingDelete
                              ? "bg-[#EF4444] text-white border-[#EF4444]"
                              : "bg-[#0C0C10] hover:bg-[#17171D] border-white/[0.08] text-[#A1A1AA] hover:text-[#EF4444]"
                          }`}
                        >
                          {confirmingDelete ? "Yakin?" : "Hapus"}
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
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          editingGroup
            ? `Edit Grup ${editingGroup.group_name}`
            : "Tambah Akun Induk Google Pro"
        }
        subtitle="Atur tipe grup Shared (eceran) atau Full Group (private 1 grup)"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Nama Grup
              </label>
              <input
                placeholder="Nottura-01"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                className="input-field w-full rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Email Manager (Akun Induk)
              </label>
              <input
                type="email"
                placeholder="master01@gmail.com"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                required
                className="input-field w-full rounded-xl px-3.5 py-2 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Tipe Grup
              </label>
              <select
                value={groupType}
                onChange={(e) => setGroupType(e.target.value as GroupType)}
                className="input-field w-full rounded-xl px-3 py-2 text-sm"
              >
                <option value="shared">Shared (Eceran)</option>
                <option value="full">Full Group (Private)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Maks. Slot
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={maxSlots}
                onChange={(e) => setMaxSlots(Number(e.target.value) || 5)}
                className="input-field w-full rounded-xl px-3.5 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Status Akun
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GroupStatus)}
                className="input-field w-full rounded-xl px-3 py-2 text-sm"
              >
                <option value="active">Aktif</option>
                <option value="full">Penuh</option>
                <option value="suspended">Bermasalah / Suspended</option>
              </select>
            </div>
          </div>

          {groupType === "full" ? (
            <div className="rounded-xl bg-[#17171D] border border-white/[0.09] border-l-2 border-l-[#EAB308] px-3.5 py-2.5 text-xs text-[#E4E4E7]">
              Karena bertipe <strong>Full Group</strong>, kapasitas otomatis
              dianggap penuh (<code className="font-mono">0 Slot Ready</code>)
              meskipun hanya diisi 1 koordinator.
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Tanggal Expired Akun Induk
              </label>
              <input
                type="date"
                value={masterExpiredAt}
                onChange={(e) => setMasterExpiredAt(e.target.value)}
                required
                className="input-field w-full rounded-xl px-3.5 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Catatan (Opsional)
              </label>
              <input
                placeholder="Keterangan grup..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field w-full rounded-xl px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-xl bg-[#17171D] hover:bg-[#22222A] border border-white/[0.08] px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#FAFAFA] text-[#09090B] hover:bg-white font-semibold px-4 py-2 text-xs cursor-pointer transition"
            >
              {submitting ? "Menyimpan..." : "Simpan Akun"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Lihat Anggota Grup */}
      <Modal
        open={Boolean(membersModalGroup)}
        onClose={() => setMembersModalGroup(null)}
        title={
          membersModalGroup
            ? `Anggota Grup ${membersModalGroup.group_name}`
            : "Anggota Grup"
        }
        subtitle={
          membersModalGroup
            ? `Manager: ${membersModalGroup.manager_email} • ${membersModalGroup.active_members_count} / ${membersModalGroup.max_slots} Terisi`
            : undefined
        }
      >
        {loadingMembers ? (
          <p className="py-8 text-center text-xs text-[#71717A]">
            Memuat daftar anggota...
          </p>
        ) : displayedMembers.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#71717A]">
            Belum ada anggota yang terdaftar di grup ini.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.08] max-h-80 overflow-y-auto">
            {displayedMembers.map((member, index) => {
              const st = getCustomerStatusMeta(member.status);
              return (
                <li
                  key={member.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#FAFAFA] truncate">
                      {index + 1}. {member.full_name}
                    </p>
                    <p className="text-xs text-[#71717A] truncate mt-0.5 font-mono">
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

        <div className="mt-5 pt-3 border-t border-white/[0.08] flex justify-end">
          <button
            type="button"
            onClick={() => setMembersModalGroup(null)}
            className="rounded-xl bg-[#17171D] hover:bg-[#22222A] border border-white/[0.09] px-4 py-2 text-xs font-medium text-[#FAFAFA] cursor-pointer transition"
          >
            Tutup
          </button>
        </div>
      </Modal>
    </PageTransition>
  );
}

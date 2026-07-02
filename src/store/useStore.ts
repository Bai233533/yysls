import { create } from "zustand";
import { members as initialMembers, Member } from "../data/members";
import * as db from "../lib/supabase";

const STORAGE_KEY = "baiye_members";

function loadLocal(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialMembers;
}

function saveLocal(members: Member[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {}
}

// Convert supabase member to local member
function fromDB(b: db.SupabaseMember): Member {
  return {
    id: b.id,
    name: b.name,
    role: b.role as Member["role"],
    title: b.title,
    description: b.description,
    avatarUrl: b.avatar_url,
    detailUrl: b.detail_url,
    rank: b.rank,
    karma: b.karma,
    valor: b.valor,
    joinDate: b.join_date,
    isVerified: b.is_verified,
  };
}

// Convert local member to supabase format
function toDB(m: Member): Omit<db.SupabaseMember, "id" | "created_at"> {
  return {
    name: m.name,
    role: m.role,
    title: m.title,
    description: m.description,
    avatar_url: m.avatarUrl,
    detail_url: m.detailUrl,
    rank: m.rank,
    karma: m.karma,
    valor: m.valor,
    join_date: m.joinDate,
    is_verified: m.isVerified,
  };
}

interface AppState {
  members: Member[];
  currentPage: number;
  membersPerPage: number;
  selectedMember: Member | null;
  editingMember: Member | null;
  addingMember: boolean;
  deleteConfirmId: number | null;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  setCurrentPage: (page: number) => void;
  setSelectedMember: (member: Member | null) => void;
  setEditingMember: (member: Member | null) => void;
  setAddingMember: (v: boolean) => void;
  setDeleteConfirmId: (id: number | null) => void;
  addMember: (data: Omit<Member, "id">) => void;
  updateMember: (id: number, data: Partial<Omit<Member, "id">>) => void;
  deleteMember: (id: number) => void;
  syncFromCloud: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  members: loadLocal(),
  currentPage: 1,
  membersPerPage: 10,
  selectedMember: null,
  editingMember: null,
  addingMember: false,
  deleteConfirmId: null,
  syncStatus: "idle",

  setCurrentPage: (page: number) => set({ currentPage: page }),
  setSelectedMember: (member: Member | null) => set({ selectedMember: member }),
  setEditingMember: (member: Member | null) => set({ editingMember: member }),
  setAddingMember: (v: boolean) => set({ addingMember: v }),
  setDeleteConfirmId: (id: number | null) => set({ deleteConfirmId: id }),

  syncFromCloud: async () => {
    set({ syncStatus: "syncing" });
    try {
      const cloudMembers = await db.fetchAll();
      if (cloudMembers.length > 0) {
        const members = cloudMembers.map(fromDB);
        set({ members });
        saveLocal(members);
        set({ syncStatus: "synced" });
      } else {
        // Cloud is empty, push initial data
        const local = loadLocal();
        for (const m of local) {
          await db.createMember(toDB(m));
        }
        set({ syncStatus: "synced" });
      }
    } catch (e) {
      console.error("[Sync] Error:", e);
      set({ syncStatus: "error" });
    }
  },

  addMember: (data) =>
    set((state) => {
      const dbData = toDB(data as Member);
      // Async save to cloud
      db.createMember(dbData).then((newId) => {
        if (newId) {
          // Update local with the real ID from cloud
          const members = useStore.getState().members.map((m) =>
            m.id === data.id ? { ...m, id: newId } : m
          );
          saveLocal(members);
          useStore.setState({ members });
        }
      });
      const members = [...state.members, data as Member];
      saveLocal(members);
      return { members, addingMember: false };
    }),

  updateMember: (id, data) =>
    set((state) => {
      const members = state.members.map((m) => (m.id === id ? { ...m, ...data } : m));
      saveLocal(members);
      // Async save to cloud - only send changed fields
      const dbData: Record<string, unknown> = {};
      if (data.name !== undefined) dbData.name = data.name;
      if (data.role !== undefined) dbData.role = data.role;
      if (data.avatarUrl !== undefined) dbData.avatar_url = data.avatarUrl;
      if (data.detailUrl !== undefined) dbData.detail_url = data.detailUrl;
      if (data.title !== undefined) dbData.title = data.title;
      if (data.description !== undefined) dbData.description = data.description;
      db.updateMember(id, dbData).catch(() => {});
      return { members };
    }),

  deleteMember: (id) =>
    set((state) => {
      const members = state.members.filter((m) => m.id !== id);
      saveLocal(members);
      // Async delete from cloud
      db.deleteMember(id).catch(() => {});
      return { members, deleteConfirmId: null };
    }),
}));

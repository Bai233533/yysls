import { create } from "zustand";
import { members as initialMembers, Member } from "../data/members";

const STORAGE_KEY = "baiye_members";

function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialMembers;
}

function saveMembers(members: Member[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {}
}

interface AppState {
  members: Member[];
  currentPage: number;
  membersPerPage: number;
  selectedMember: Member | null;
  editingMember: Member | null;
  addingMember: boolean;
  deleteConfirmId: number | null;
  setCurrentPage: (page: number) => void;
  setSelectedMember: (member: Member | null) => void;
  setEditingMember: (member: Member | null) => void;
  setAddingMember: (v: boolean) => void;
  setDeleteConfirmId: (id: number | null) => void;
  addMember: (data: Omit<Member, "id">) => void;
  updateMember: (id: number, data: Partial<Omit<Member, "id">>) => void;
  deleteMember: (id: number) => void;
  getPaginatedMembers: () => Member[];
  totalPages: () => number;
}

export const useStore = create<AppState>((set, get) => ({
  members: loadMembers(),
  currentPage: 1,
  membersPerPage: 10,
  selectedMember: null,
  editingMember: null,
  addingMember: false,
  deleteConfirmId: null,
  setCurrentPage: (page: number) => set({ currentPage: page }),
  setSelectedMember: (member: Member | null) => set({ selectedMember: member }),
  setEditingMember: (member: Member | null) => set({ editingMember: member }),
  setAddingMember: (v: boolean) => set({ addingMember: v }),
  setDeleteConfirmId: (id: number | null) => set({ deleteConfirmId: id }),
  addMember: (data) =>
    set((state) => {
      const maxId = state.members.reduce((max, m) => Math.max(max, m.id), 0);
      const newMember: Member = { ...data, id: maxId + 1 };
      const members = [...state.members, newMember];
      saveMembers(members);
      return { members, addingMember: false };
    }),
  updateMember: (id, data) =>
    set((state) => {
      const members = state.members.map((m) => (m.id === id ? { ...m, ...data } : m));
      saveMembers(members);
      return { members };
    }),
  deleteMember: (id) =>
    set((state) => {
      const members = state.members.filter((m) => m.id !== id);
      saveMembers(members);
      return { members, deleteConfirmId: null };
    }),
  getPaginatedMembers: () => {
    const { members, currentPage, membersPerPage } = get();
    const start = (currentPage - 1) * membersPerPage;
    return members.slice(start, start + membersPerPage);
  },
  totalPages: () => {
    const { members, membersPerPage } = get();
    return Math.ceil(members.length / membersPerPage);
  },
}));

import { create } from "zustand";
import { members as initialMembers, Member } from "../data/members";
import { fetchMembers, saveMembers, hasToken, setToken as saveGithubToken } from "../lib/github";

const STORAGE_KEY = "baiye_members";
const TOKEN_KEY = "github_token";

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

interface AppState {
  members: Member[];
  currentPage: number;
  membersPerPage: number;
  selectedMember: Member | null;
  editingMember: Member | null;
  addingMember: boolean;
  deleteConfirmId: number | null;
  githubToken: string;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  setCurrentPage: (page: number) => void;
  setSelectedMember: (member: Member | null) => void;
  setEditingMember: (member: Member | null) => void;
  setAddingMember: (v: boolean) => void;
  setDeleteConfirmId: (id: number | null) => void;
  setGithubToken: (token: string) => void;
  addMember: (data: Omit<Member, "id">) => void;
  updateMember: (id: number, data: Partial<Omit<Member, "id">>) => void;
  deleteMember: (id: number) => void;
  syncFromGitHub: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  members: loadLocal(),
  currentPage: 1,
  membersPerPage: 10,
  selectedMember: null,
  editingMember: null,
  addingMember: false,
  deleteConfirmId: null,
  githubToken: localStorage.getItem(TOKEN_KEY) || "",
  syncStatus: "idle",
  setCurrentPage: (page: number) => set({ currentPage: page }),
  setSelectedMember: (member: Member | null) => set({ selectedMember: member }),
  setEditingMember: (member: Member | null) => set({ editingMember: member }),
  setAddingMember: (v: boolean) => set({ addingMember: v }),
  setDeleteConfirmId: (id: number | null) => set({ deleteConfirmId: id }),
  setGithubToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    saveGithubToken(token);
    set({ githubToken: token });
  },
  syncFromGitHub: async () => {
    set({ syncStatus: "syncing" });
    const remoteMembers = await fetchMembers();
    if (remoteMembers && remoteMembers.length > 0) {
      set({ members: remoteMembers });
      saveLocal(remoteMembers);
      set({ syncStatus: "synced" });
    } else {
      set({ syncStatus: "error" });
    }
  },
  addMember: (data) =>
    set((state) => {
      const maxId = state.members.reduce((max, m) => Math.max(max, m.id), 0);
      const newMember: Member = { ...data, id: maxId + 1 };
      const members = [...state.members, newMember];
      saveLocal(members);
      // Async save to GitHub
      saveMembers(members).catch(() => {});
      return { members, addingMember: false };
    }),
  updateMember: (id, data) =>
    set((state) => {
      const members = state.members.map((m) => (m.id === id ? { ...m, ...data } : m));
      saveLocal(members);
      saveMembers(members).catch(() => {});
      return { members };
    }),
  deleteMember: (id) =>
    set((state) => {
      const members = state.members.filter((m) => m.id !== id);
      saveLocal(members);
      saveMembers(members).catch(() => {});
      return { members, deleteConfirmId: null };
    }),
}));

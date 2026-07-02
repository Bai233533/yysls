import { create } from "zustand";
import { members as initialMembers, Member } from "../data/members";
import * as db from "../lib/supabase";
import type { SupabasePhoto } from "../lib/supabase";

const STORAGE_KEY = "baiye_members";
const BG_KEY = "baiye_hero_bg";
const PRESET_KEY = "baiye_bg_presets";

const DEFAULT_BG = "https://picsum.photos/seed/inkmountain/1920/1080";

interface BgPreset { name: string; url: string }

// 照片墙 fallback 数据（Supabase 不可用时使用）
function getDefaultPhotos(): { src: string; title: string }[] {
  const names = [
    "剑影寒霜","墨染江山","风起云涌","星辰引路","铁马冰河",
    "醉卧沙场","孤烟大漠","落日长河","残阳如血","竹林听雨",
    "古道西风","江湖夜雨","千山暮雪","沧海一声","天涯明月",
    "烟雨江南","雪山飞狐","大漠孤烟","长风万里","明月几时",
    "红尘客栈","刀剑如梦","英雄本色","笑傲江湖","一剑封喉",
    "半壶纱","醉清风","画中仙","长相思","断肠人",
    "问情","归去来","梦回吹角","连营画角","塞下曲",
    "渔家傲","破阵子","满江红","念奴娇","水调歌头",
    "将进酒","行路难","蜀道难","望庐山","早发白帝",
    "黄鹤楼","登鹳雀楼","静夜思","春晓","鹿柴",
    "竹里馆","山居秋暝","终南山","关山月","子夜吴歌",
    "长干行","峨眉山月","渡荆门","送友人","听蜀僧",
    "秋浦歌","月下独酌","从军行","出塞曲","凉州词",
  ];
  return names.map((name, i) => ({
    src: `https://picsum.photos/seed/wall${String(i + 1).padStart(2, "0")}/400/400`,
    title: name,
  }));
}

function loadBg(): string {
  try {
    const raw = localStorage.getItem(BG_KEY);
    if (raw) return raw;
  } catch {}
  return DEFAULT_BG;
}

function saveBg(url: string) {
  try {
    localStorage.setItem(BG_KEY, url);
  } catch {}
}

function loadPresets(): BgPreset[] {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    if (raw) return JSON.parse(raw) as BgPreset[];
  } catch {}
  return [];
}

function savePresets(presets: BgPreset[]) {
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
  } catch {}
}

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

/* ================================================================
 *  照片墙数据类型
 * ================================================================ */

export type WallPhoto = { src: string; title: string };

/* ================================================================
 *  App State
 * ================================================================ */

interface AppState {
  members: Member[];
  currentPage: number;
  membersPerPage: number;
  selectedMember: Member | null;
  editingMember: Member | null;
  addingMember: boolean;
  deleteConfirmId: number | null;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  heroBackground: string;
  bgPresets: BgPreset[];

  // 照片墙状态
  wallPhotos: WallPhoto[];
  wallLoading: boolean;

  setCurrentPage: (page: number) => void;
  setSelectedMember: (member: Member | null) => void;
  setEditingMember: (member: Member | null) => void;
  setAddingMember: (v: boolean) => void;
  setDeleteConfirmId: (id: number | null) => void;
  setHeroBackground: (url: string) => void;
  resetHeroBackground: () => void;
  addBgPreset: (name: string, url: string) => void;
  removeBgPreset: (url: string) => void;
  addMember: (data: Omit<Member, "id">) => void;
  updateMember: (id: number, data: Partial<Omit<Member, "id">>) => void;
  deleteMember: (id: number) => void;
  syncFromCloud: () => Promise<void>;

  // 照片墙方法
  loadWallPhotos: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  members: loadLocal(),
  currentPage: 1,
  membersPerPage: 10,
  selectedMember: null,
  editingMember: null,
  addingMember: false,
  deleteConfirmId: null,
  syncStatus: "idle",
  heroBackground: loadBg(),
  bgPresets: loadPresets(),

  // 照片墙初始值：先用 fallback，等 Supabase 加载后覆盖
  wallPhotos: getDefaultPhotos(),
  wallLoading: true,

  setCurrentPage: (page: number) => set({ currentPage: page }),
  setSelectedMember: (member: Member | null) => set({ selectedMember: member }),
  setEditingMember: (member: Member | null) => set({ editingMember: member }),
  setAddingMember: (v: boolean) => set({ addingMember: v }),
  setDeleteConfirmId: (id: number | null) => set({ deleteConfirmId: id }),
  setHeroBackground: (url: string) => {
    saveBg(url);
    set({ heroBackground: url });
  },
  resetHeroBackground: () => {
    saveBg(DEFAULT_BG);
    set({ heroBackground: DEFAULT_BG });
  },
  addBgPreset: (name: string, url: string) =>
    set((state) => {
      const presets = [...state.bgPresets, { name, url }];
      savePresets(presets);
      return { bgPresets: presets };
    }),
  removeBgPreset: (url: string) =>
    set((state) => {
      const presets = state.bgPresets.filter(p => p.url !== url);
      savePresets(presets);
      return { bgPresets: presets };
    }),

  /* ---- 从 Supabase 加载照片 ---- */
  loadWallPhotos: async () => {
    try {
      const photos = await db.fetchPhotos();
      if (photos.length > 0) {
        set({
          wallPhotos: photos.map(p => ({ src: p.src, title: p.name })),
          wallLoading: false,
        });
      } else {
        // Supabase 表为空，使用 fallback
        set({ wallLoading: false });
      }
    } catch {
      console.error("[Wall] Failed to load from Supabase, using fallback");
      set({ wallLoading: false });
    }
  },

  /* ---- 成员同步 ---- */
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
      const members = [...state.members, data as Member];
      saveLocal(members);
      // Async save to cloud, then re-sync to get real IDs
      const dbData = toDB(data as Member);
      db.createMember(dbData).then(() => {
        db.fetchAll().then((cloudMembers) => {
          const synced = cloudMembers.map(fromDB);
          useStore.setState({ members: synced });
          saveLocal(synced);
        });
      });
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

import { create } from "zustand";
import { members as initialMembers, Member, ROLE_TO_DB, DB_TO_ROLE } from "../data/members";
import * as db from "../lib/supabase";
import type { SupabasePhoto } from "../lib/supabase";

const STORAGE_KEY = "baiye_members";
const BG_KEY = "baiye_hero_bg";
const DEFAULT_BG = "https://picsum.photos/seed/inkmountain/1920/1080";

interface BgPreset { id: number | string; name: string; url: string }

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
    src: `https://picsum.photos/seed/wall${String(i + 1).padStart(2, "0")}/100/100`,
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
    role: DB_TO_ROLE[b.role] ?? b.role,
    title: b.title ?? "",
    avatarUrl: b.avatar_url,
    detailUrl: b.detail_url,
    detailMedia1: b.detail_media_1 ?? "",
    detailMedia2: b.detail_media_2 ?? "",
    detailMedia3: b.detail_media_3 ?? "",
    detailMedia1Type: b.detail_media_1_type ?? "image",
    detailMedia2Type: b.detail_media_2_type ?? "image",
    detailMedia3Type: b.detail_media_3_type ?? "image",
    signature: b.signature ?? "",
    joinDate: b.join_date ?? "",
    gameId: b.game_id ?? "",
    userId: b.user_id ?? "",
    password: b.password ?? "",
  };
}

// Convert local member to supabase format
function toDB(m: Member): Omit<db.SupabaseMember, "id" | "created_at"> {
  return {
    name: m.name,
    role: ROLE_TO_DB[m.role] ?? m.role,
    title: m.title,
    avatar_url: m.avatarUrl,
    detail_url: m.detailUrl,
    detail_media_1: m.detailMedia1,
    detail_media_2: m.detailMedia2,
    detail_media_3: m.detailMedia3,
    detail_media_1_type: m.detailMedia1Type,
    detail_media_2_type: m.detailMedia2Type,
    detail_media_3_type: m.detailMedia3Type,
    signature: m.signature,
    join_date: m.joinDate,
    game_id: m.gameId,
    user_id: m.userId || null,
    password: m.password,
  };
}

/* ================================================================
 *  照片墙数据类型
 * ================================================================ */

export type WallPhoto = { src: string; title: string; ratio?: string };

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
  welcomeName: string | null;

  // 照片墙状态
  wallPhotos: WallPhoto[];
  wallLoading: boolean;

  setCurrentPage: (page: number) => void;
  setSelectedMember: (member: Member | null) => void;
  setEditingMember: (member: Member | null) => void;
  setAddingMember: (v: boolean) => void;
  setDeleteConfirmId: (id: number | null) => void;
  clearWelcome: () => void;
  setHeroBackground: (url: string) => void;
  resetHeroBackground: () => void;
  addBgPreset: (name: string, url: string) => Promise<void>;
  removeBgPreset: (id: number | string) => Promise<void>;
  loadBgPresets: () => Promise<void>;
  addMember: (data: Omit<Member, "id">) => void;
  updateMember: (id: number, data: Partial<Omit<Member, "id">>) => void;
  deleteMember: (id: number) => void;
  syncFromCloud: () => Promise<void>;

  // 照片墙方法
  loadWallPhotos: () => Promise<void>;

  // Realtime 订阅
  _realtimeChannel: ReturnType<typeof db.supabase.channel> | null;
  subscribeToChanges: () => void;
  unsubscribeFromChanges: () => void;
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
  bgPresets: [],
  welcomeName: null,

  // 照片墙初始值：先用 fallback，等 Supabase 加载后覆盖
  wallPhotos: getDefaultPhotos(),
  wallLoading: true,

  setCurrentPage: (page: number) => set({ currentPage: page }),
  setSelectedMember: (member: Member | null) => set({ selectedMember: member }),
  setEditingMember: (member: Member | null) => set({ editingMember: member }),
  setAddingMember: (v: boolean) => set({ addingMember: v }),
  setDeleteConfirmId: (id: number | null) => set({ deleteConfirmId: id }),
  clearWelcome: () => set({ welcomeName: null }),
  setHeroBackground: (url: string) => {
    saveBg(url);
    set({ heroBackground: url });
  },
  resetHeroBackground: () => {
    saveBg(DEFAULT_BG);
    set({ heroBackground: DEFAULT_BG });
  },
  addBgPreset: async (name: string, url: string) => {
    const id = await db.createBgPreset(name, url);
    if (id != null) {
      set((state) => ({ bgPresets: [...state.bgPresets, { id, name, url }] }));
    }
  },
  removeBgPreset: async (id: number | string) => {
    if (typeof id === "number") await db.deleteBgPreset(id);
    set((state) => ({ bgPresets: state.bgPresets.filter((p) => p.id !== id) }));
  },
  loadBgPresets: async () => {
    const data = await db.fetchBgPresets();
    if (data.length > 0) {
      set({ bgPresets: data.map((p) => ({ id: p.id, name: p.name, url: p.url })) });
    }
  },

  /* ---- 从 Supabase 加载照片 ---- */
  loadWallPhotos: async () => {
    try {
      const photos = await db.fetchPhotos();
      set({
        wallPhotos: photos.map(p => ({ src: p.src, title: p.name, ratio: p.ratio })),
        wallLoading: false,
      });
    } catch {
      console.error("[Wall] Failed to load from Supabase, using fallback");
      set({ wallPhotos: [], wallLoading: false });
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
      // 启动 Realtime 订阅，自动接收后续变更
      get().subscribeToChanges();
    } catch (e) {
      console.error("[Sync] Error:", e);
      set({ syncStatus: "error" });
    }
  },

  addMember: (data) =>
    set((state) => {
      // 先分配临时 id，确保新成员可以立即点击/拖拽
      const tempId = Date.now();
      const member = { ...data, id: tempId } as Member;
      const members = [...state.members, member];
      saveLocal(members);
      // Async save to cloud, then re-sync to get real IDs
      const dbData = toDB(member);
      db.createMember(dbData).then(() => {
        db.fetchAll().then((cloudMembers) => {
          const synced = cloudMembers.map(fromDB);
          useStore.setState({ members: synced });
          saveLocal(synced);
        });
      });
      return { members, addingMember: false, welcomeName: data.name };
    }),

  updateMember: (id, data) =>
    set((state) => {
      const members = state.members.map((m) => (m.id === id ? { ...m, ...data } : m));
      saveLocal(members);
      // Async save to cloud - only send changed fields
      const dbData: Record<string, unknown> = {};
      if (data.name !== undefined) dbData.name = data.name;
      if (data.role !== undefined) dbData.role = ROLE_TO_DB[data.role] ?? data.role;
      if (data.avatarUrl !== undefined) dbData.avatar_url = data.avatarUrl;
      if (data.detailUrl !== undefined) dbData.detail_url = data.detailUrl;
      if (data.title !== undefined) dbData.title = data.title;
      if (data.signature !== undefined) dbData.signature = data.signature;
      if (data.joinDate !== undefined) dbData.join_date = data.joinDate;
      if (data.gameId !== undefined) dbData.game_id = data.gameId;
      if (data.userId !== undefined) dbData.user_id = data.userId;
      if (data.password !== undefined) dbData.password = data.password;
      if (data.detailMedia1 !== undefined) dbData.detail_media_1 = data.detailMedia1;
      if (data.detailMedia2 !== undefined) dbData.detail_media_2 = data.detailMedia2;
      if (data.detailMedia3 !== undefined) dbData.detail_media_3 = data.detailMedia3;
      if (data.detailMedia1Type !== undefined) dbData.detail_media_1_type = data.detailMedia1Type;
      if (data.detailMedia2Type !== undefined) dbData.detail_media_2_type = data.detailMedia2Type;
      if (data.detailMedia3Type !== undefined) dbData.detail_media_3_type = data.detailMedia3Type;
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

  /* ---- Supabase Realtime：监听成员/照片变更，自动同步给所有在线用户 ---- */
  _realtimeChannel: null as ReturnType<typeof db.supabase.channel> | null,

  subscribeToChanges: () => {
    const state = get();
    // 防止重复订阅
    if (state._realtimeChannel) return;

    const channel = db.supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "member" },
        async () => {
          console.log("[Realtime] member 变更，重新拉取...");
          const cloudMembers = await db.fetchAll();
          const members = cloudMembers.map(fromDB);
          useStore.setState({ members });
          saveLocal(members);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "photo" },
        async () => {
          console.log("[Realtime] photo 变更，重新拉取...");
          const photos = await db.fetchPhotos();
          const wallPhotos = photos.map((p: SupabasePhoto) => ({ src: p.src, title: p.name, ratio: p.ratio }));
          useStore.setState({ wallPhotos });
        }
      )
      .subscribe();

    useStore.setState({ _realtimeChannel: channel });
  },

  unsubscribeFromChanges: () => {
    const channel = get()._realtimeChannel;
    if (channel) {
      db.supabase.removeChannel(channel);
      useStore.setState({ _realtimeChannel: null });
    }
  },
}));

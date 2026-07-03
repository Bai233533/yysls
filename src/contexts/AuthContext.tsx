import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Member } from "../data/members";
import { DB_TO_ROLE } from "../data/members";

const AUTH_STORAGE_KEY = "baiye_auth_session";
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 小时

/* ================================================================
 *  权限等级
 *  L1: 社长/副社长 — 全部权限
 *  L2: 指挥等管理 — 添加成员 + 照片墙管理
 *  L3: 社员 — 上传/查看/下载照片
 *  L4: 观众(未登录) — 仅查看
 * ================================================================ */
export type PermissionLevel = 1 | 2 | 3 | 4;

const ROLE_LEVEL: Record<string, PermissionLevel> = {
  "社长": 1,
  "副社长": 2,
  "指挥": 3,
  "社员": 4,
};

interface AuthContextType {
  member: Member | null;
  level: PermissionLevel;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signUp: (memberName: string, password: string, gameId: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  recoverPassword: (memberName: string, gameId: string, newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  member: null,
  level: 4,
  loading: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: () => {},
  recoverPassword: async () => ({ error: null }),
});

export function useAuth() {
  return useContext(AuthContext);
}

// localStorage 只存最小会话信息，不存大字段
interface SessionStub {
  id: number;
  name: string;
  role: string;
  expiresAt: number;
}

// 将 supabase 行转为 Member
function rowToMember(d: Record<string, unknown>): Member {
  return {
    id: d.id as number,
    name: d.name as string,
    role: DB_TO_ROLE[d.role as string] ?? (d.role as string),
    title: (d.title as string) ?? "",
    avatarUrl: d.avatar_url as string,
    detailUrl: d.detail_url as string,
    detailMedia1: (d.detail_media_1 as string) ?? "",
    detailMedia2: (d.detail_media_2 as string) ?? "",
    detailMedia3: (d.detail_media_3 as string) ?? "",
    detailMedia1Type: (d.detail_media_1_type as string) ?? "image",
    detailMedia2Type: (d.detail_media_2_type as string) ?? "image",
    detailMedia3Type: (d.detail_media_3_type as string) ?? "image",
    signature: (d.signature as string) ?? "",
    joinDate: (d.join_date as string) ?? "",
    gameId: (d.game_id as string) ?? "",
    userId: (d.user_id as string) ?? "",
    password: (d.password as string) ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);

  const level: PermissionLevel = member ? (ROLE_LEVEL[member.role] ?? 4) : 4;

  // 页面加载时从 localStorage 恢复会话，然后从 Supabase 拉完整数据
  useEffect(() => {
    if (bootstrapped) return;
    setBootstrapped(true);

    (async () => {
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) { setLoading(false); return; }
        const stub = JSON.parse(raw) as SessionStub;
        if (Date.now() >= stub.expiresAt) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setLoading(false);
          return;
        }
        // 用保存的 id 从 Supabase 拉完整数据
        const { data } = await supabase
          .from("member")
          .select("*")
          .eq("id", stub.id)
          .single();
        if (data) {
          setMember(rowToMember(data));
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      setLoading(false);
    })();
  }, [bootstrapped]);

  // member 变更时自动同步到 localStorage（只存最小字段）
  useEffect(() => {
    if (member) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        id: member.id,
        name: member.name,
        role: member.role,
        expiresAt: Date.now() + SESSION_TTL,
      } satisfies SessionStub));
    } else if (bootstrapped) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [member, bootstrapped]);

  // 登录：名字或游戏ID + 密码（直接用 member 表验证）
  const signIn = useCallback(async (identifier: string, password: string) => {
    // 先按名字查
    let { data: memberRecord } = await supabase
      .from("member")
      .select("*")
      .eq("name", identifier)
      .single();

    // 再按游戏ID查
    if (!memberRecord) {
      const { data: byGameId } = await supabase
        .from("member")
        .select("*")
        .eq("game_id", identifier)
        .single();
      memberRecord = byGameId;
    }

    if (!memberRecord) {
      return { error: "找不到该成员，请检查名字或游戏ID" };
    }

    if (memberRecord.password !== password) {
      return { error: "密码错误" };
    }

    // 登录成功
    setMember(rowToMember(memberRecord));
    return { error: null };
  }, []);

  // 注册：社长/副社长添加成员后，成员自己设置密码
  const signUp = useCallback(async (memberName: string, password: string, gameId: string) => {
    const { data: existing } = await supabase
      .from("member")
      .select("id, password")
      .eq("name", memberName)
      .single();

    if (!existing) {
      return { error: `找不到名为"${memberName}"的成员，请联系社长先添加` };
    }
    if (existing.password && existing.password !== "123456") {
      return { error: `成员"${memberName}"已设置过密码` };
    }

    // 更新密码和游戏ID
    const { error } = await supabase
      .from("member")
      .update({ password, game_id: gameId })
      .eq("id", existing.id);

    if (error) return { error: "设置密码失败: " + error.message };
    return { error: null };
  }, []);

  // 登出
  const signOut = useCallback(() => {
    setMember(null);
  }, []);

  // 忘记密码：通过成员名称 + 游戏ID 验证身份后重置密码
  const recoverPassword = useCallback(async (memberName: string, gameId: string, newPassword: string) => {
    const { data: memberRecord } = await supabase
      .from("member")
      .select("id, game_id, name")
      .eq("name", memberName)
      .single();

    if (!memberRecord) {
      return { error: `找不到名为"${memberName}"的成员` };
    }
    if (memberRecord.game_id !== gameId) {
      return { error: "游戏ID不正确" };
    }

    const { error } = await supabase
      .from("member")
      .update({ password: newPassword })
      .eq("id", memberRecord.id);

    if (error) return { error: "密码重置失败: " + error.message };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider value={{ member, level, loading, signIn, signUp, signOut, recoverPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

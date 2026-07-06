import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gpoyuvdjqemjltdpzloh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwb3l1dmRqcWVtamx0ZHB6bG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Njc3MzQsImV4cCI6MjA5ODU0MzczNH0.gWfeNoDFIiFxVoCFPUAFug1ugkx6znFtOnBXFJEkxuY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ================================================================
 *  成员 (member) 相关接口
 * ================================================================ */

export interface SupabaseMember {
  id: number;
  name: string;
  role: string;
  title: string;
  avatar_url: string;
  detail_url: string;
  detail_media_1?: string;
  detail_media_2?: string;
  detail_media_3?: string;
  detail_media_1_type?: string;
  detail_media_2_type?: string;
  detail_media_3_type?: string;
  signature?: string;
  join_date?: string;
  game_id?: string;
  user_id?: string;
  password?: string;
  created_at?: string;
}

/* ================================================================
 *  Storage 上传（照片/视频）
 * ================================================================ */
export async function uploadToStorage(
  file: File,
  bucket: string,
  folder: string
): Promise<string | null> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.error("[Storage] upload error:", error);
    return null;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

// Fetch all members
export async function fetchAll(): Promise<SupabaseMember[]> {
  const { data, error } = await supabase
    .from("member")
    .select("*")
    .order("id", { ascending: true });
  if (error) {
    console.error("[Supabase] fetchAll error:", error);
    return [];
  }
  return data || [];
}

// Create a member
export async function createMember(member: Omit<SupabaseMember, "id" | "created_at">): Promise<number | null> {
  const { data, error } = await supabase
    .from("member")
    .insert([member])
    .select("id")
    .single();
  if (error) {
    console.error("[Supabase] createMember error:", error);
    return null;
  }
  return data?.id || null;
}

// Update a member
export async function updateMember(id: number, data: Record<string, unknown>): Promise<boolean> {
  const { error } = await supabase
    .from("member")
    .update(data)
    .eq("id", id);
  if (error) {
    console.error("[Supabase] updateMember error:", error);
    return false;
  }
  return true;
}

// Delete a member
export async function deleteMember(id: number): Promise<boolean> {
  const { error } = await supabase
    .from("member")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[Supabase] deleteMember error:", error);
    return false;
  }
  return true;
}

/* ================================================================
 *  照片墙 (photo) 相关接口
 * ================================================================ */

export interface SupabasePhoto {
  id: number;
  name: string;
  src: string;
  sort_order: number;
  is_active: boolean;
  ratio?: string;  // "4:3" | "3:4" | "1:1" | "16:9" | "3:2"
  created_at?: string;
}

// Fetch all active photos, ordered by sort_order
export async function fetchPhotos(): Promise<SupabasePhoto[]> {
  const { data, error } = await supabase
    .from("photo")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[Supabase] fetchPhotos error:", error);
    return [];
  }
  return data || [];
}

// Fetch all photos (including inactive, for admin)
export async function fetchAllPhotos(): Promise<SupabasePhoto[]> {
  const { data, error } = await supabase
    .from("photo")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[Supabase] fetchAllPhotos error:", error);
    return [];
  }
  return data || [];
}

// Create a photo
export async function createPhoto(photo: Omit<SupabasePhoto, "id" | "created_at">): Promise<number | null> {
  const { data, error } = await supabase
    .from("photo")
    .insert([photo])
    .select("id")
    .single();
  if (error) {
    console.error("[Supabase] createPhoto error:", error);
    return null;
  }
  return data?.id || null;
}

// Update a photo
export async function updatePhoto(id: number, data: Record<string, unknown>): Promise<boolean> {
  const { error } = await supabase
    .from("photo")
    .update(data)
    .eq("id", id);
  if (error) {
    console.error("[Supabase] updatePhoto error:", error);
    return false;
  }
  return true;
}

// Delete a photo
export async function deletePhoto(id: number): Promise<boolean> {
  const { error } = await supabase
    .from("photo")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[Supabase] deletePhoto error:", error);
    return false;
  }
  return true;
}

/* ================================================================
 *  背景预设 (bg_preset) 相关接口
 *  字段：id, name, img, created_at, updated_at
 * ================================================================ */

export interface SupabaseBgPreset {
  id: number;
  name: string;
  img: string;
  created_at?: string;
  updated_at?: string;
}

// 获取所有预设
export async function fetchBgPresets(): Promise<SupabaseBgPreset[]> {
  const { data, error } = await supabase
    .from("bg_preset")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[Supabase] fetchBgPresets error:", error);
    return [];
  }
  return data || [];
}

// 添加预设
export async function createBgPreset(name: string, img: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("bg_preset")
    .insert([{ name, img }])
    .select("id")
    .single();
  if (error) {
    console.error("[Supabase] createBgPreset error:", error);
    return null;
  }
  return data?.id || null;
}

// 删除预设
export async function deleteBgPreset(id: number): Promise<boolean> {
  const { error } = await supabase
    .from("bg_preset")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[Supabase] deleteBgPreset error:", error);
    return false;
  }
  return true;
}

/* ================================================================
 *  站点配置 (site_config) 相关接口
 *  用于存储全局配置，如主页背景图片
 * ================================================================ */

// 获取配置项
export async function getConfig(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", key)
    .single();
  if (error) {
    // 如果是"未找到"的错误，返回 null（不是真正的错误）
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[Supabase] getConfig error:", error);
    return null;
  }
  return data?.value || null;
}

// 设置配置项（如果不存在则创建）
export async function setConfig(key: string, value: string): Promise<boolean> {
  // 先尝试更新
  const { error: updateError } = await supabase
    .from("site_config")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);

  // 如果更新成功（影响了行），返回 true
  if (!updateError) {
    return true;
  }

  // 如果是"未找到"的错误，尝试插入
  const { error: insertError } = await supabase
    .from("site_config")
    .insert([{ key, value }]);

  if (insertError) {
    console.error("[Supabase] setConfig error:", insertError);
    return false;
  }
  return true;
}

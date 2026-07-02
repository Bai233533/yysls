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
  description: string;
  avatar_url: string;
  detail_url: string;
  rank: string;
  karma: number;
  valor: number;
  join_date: string;
  is_verified: boolean;
  created_at?: string;
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

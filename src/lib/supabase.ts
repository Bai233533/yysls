import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gpoyuvdjqemjltdpzloh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwb3l1dmRqcWVtamx0ZHB6bG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Njc3MzQsImV4cCI6MjA5ODU0MzczNH0.gWfeNoDFIiFxVoCFPUAFug1ugkx6znFtOnBXFJEkxuY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
export async function updateMember(id: number, data: Partial<Omit<SupabaseMember, "id" | "created_at">>): Promise<boolean> {
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

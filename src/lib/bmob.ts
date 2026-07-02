const APP_ID = "8f65100d6a4198150c083ba47bdfbafb";
const REST_KEY = "4bdd500df7168ee0f7ea0950e5a7b762";
const BASE_URL = "https://api.bmob.cn/1";
const TABLE = "Member";

const headers = () => ({
  "X-Bmob-Application-Id": APP_ID,
  "X-Bmob-REST-API-Key": REST_KEY,
  "Content-Type": "application/json",
});

export interface BmobMember {
  objectId: string;
  name: string;
  role: string;
  title: string;
  description: string;
  avatarUrl: string;
  detailUrl: string;
  rank: string;
  karma: number;
  valor: number;
  joinDate: string;
  isVerified: boolean;
}

// Fetch all members
export async function fetchAll(): Promise<BmobMember[]> {
  const res = await fetch(`${BASE_URL}/classes/${TABLE}?order=createdAt`, {
    headers: headers(),
  });
  const data = await res.json();
  console.log("[Bmob] fetchAll:", data);
  return data.results || [];
}

// Create a member
export async function createMember(member: Omit<BmobMember, "objectId">): Promise<string> {
  const res = await fetch(`${BASE_URL}/classes/${TABLE}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(member),
  });
  const data = await res.json();
  return data.objectId;
}

// Update a member
export async function updateMember(objectId: string, data: Partial<Omit<BmobMember, "objectId">>): Promise<void> {
  await fetch(`${BASE_URL}/classes/${TABLE}/${objectId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(data),
  });
}

// Delete a member
export async function deleteMember(objectId: string): Promise<void> {
  await fetch(`${BASE_URL}/classes/${TABLE}/${objectId}`, {
    method: "DELETE",
    headers: headers(),
  });
}

// Sync: delete all, then insert all
export async function syncAll(members: Omit<BmobMember, "objectId">[]): Promise<void> {
  // Fetch current
  const current = await fetchAll();
  // Delete all
  for (const m of current) {
    await fetch(`${BASE_URL}/classes/${TABLE}/${m.objectId}`, {
      method: "DELETE",
      headers: headers(),
    });
  }
  // Insert all
  for (const m of members) {
    await fetch(`${BASE_URL}/classes/${TABLE}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(m),
    });
  }
}

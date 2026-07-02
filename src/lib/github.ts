import { Member } from "../data/members";

const OWNER = "Bai233533";
const REPO = "yysls";
const FILE_PATH = "data/members.json";
const BRANCH = "main";

// Token is stored in localStorage for simplicity
function getToken(): string {
  return localStorage.getItem("github_token") || "";
}

export function setToken(token: string) {
  localStorage.setItem("github_token", token);
}

export function hasToken(): boolean {
  return !!getToken();
}

// Read members from GitHub
export async function fetchMembers(): Promise<Member[] | null> {
  try {
    const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${FILE_PATH}`;
    const res = await fetch(url + "?t=" + Date.now());
    if (!res.ok) return null;
    const data = await res.json();
    return data.members || null;
  } catch {
    return null;
  }
}

// Write members to GitHub
export async function saveMembers(members: Member[]): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    // First get current file SHA
    const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let sha: string | undefined;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // Create or update file
    const content = JSON.stringify({ members }, null, 2);
    const body: Record<string, unknown> = {
      message: "Update members data",
      content: btoa(unescape(encodeURIComponent(content))),
      branch: BRANCH,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(getUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return putRes.ok;
  } catch {
    return false;
  }
}

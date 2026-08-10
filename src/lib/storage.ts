export const USERNAME_KEY = "adr_nv_username";
export const USER_ID_KEY = "adr_nv_user_id";
export const FORM_START_KEY = "adr_nv_form_start";

export function getStoredUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USERNAME_KEY);
}

export function getStoredUserId(): number | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(USER_ID_KEY);
  return value ? Number(value) : null;
}

export function storeUser(username: string, userId: number) {
  localStorage.setItem(USERNAME_KEY, username);
  localStorage.setItem(USER_ID_KEY, String(userId));
}

export function startFormTimer() {
  localStorage.setItem(FORM_START_KEY, String(Date.now()));
}

export function getFormDurationMs(): number {
  const start = localStorage.getItem(FORM_START_KEY);
  if (!start) return 0;
  return Math.max(0, Date.now() - Number(start));
}

export function clearFormTimer() {
  localStorage.removeItem(FORM_START_KEY);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(2, "0")}`;
}

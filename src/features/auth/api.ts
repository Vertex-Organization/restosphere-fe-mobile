import type { Staff } from "./types";

interface Tokens { accessToken: string; refreshToken: string; expiresIn: number }
// shortcut: tokens stay in memory; add SecureStore when persistent sign-in is required.
let tokens: Tokens | null = null;
let sessionGeneration = 0;

let refreshing: Promise<Tokens> | null = null;
export async function authenticatedRequest<T>(path: string, body?: unknown): Promise<T> {
  if (!tokens) throw new Error("Vui lòng đăng nhập lại.");
  const generation = sessionGeneration;
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("Chưa cấu hình EXPO_PUBLIC_API_URL.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const current = tokens;
    const send = () => fetch(`${base}/${path}`, {
      method: body === undefined ? "GET" : "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { Authorization: `Bearer ${tokens?.accessToken}`, Accept: "application/json", "Content-Type": "application/json" },
      signal: controller.signal,
    });
    let response = await send();
    if (generation !== sessionGeneration) throw new Error("Phiên đăng nhập đã thay đổi.");
    if (response.status === 401 && tokens === current) {
      refreshing ??= request<Tokens>("refresh", { refreshToken: current.refreshToken }).then(next => {
        if (!next?.accessToken || !next.refreshToken || !(next.expiresIn > 0)) throw new Error("Phản hồi làm mới phiên không hợp lệ.");
        if (tokens === current) tokens = next;
        return next;
      }).finally(() => { refreshing = null; });
      const next = await refreshing;
      if (tokens !== next) throw new Error("Phiên đăng nhập đã thay đổi.");
      response = await send();
    } else if (response.status === 401 && tokens) response = await send();
    if (generation !== sessionGeneration) throw new Error("Phiên đăng nhập đã thay đổi.");
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || error?.message || (response.status === 401 ? "Phiên đã hết hạn. Vui lòng đăng nhập lại." : "Không thể hoàn tất yêu cầu máy chủ."));
    }
    return await response.json() as T;
  } finally { clearTimeout(timer); }
}
export const authenticatedGet = <T>(path: string) => authenticatedRequest<T>(path);

async function request<T>(path: string, body?: unknown, accessToken?: string): Promise<T> {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("Chưa cấu hình EXPO_PUBLIC_API_URL cho máy chủ API.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    let response: Response;
    try {
      response = await fetch(`${base}/auth/${path}`, {
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch { throw new Error(`Không thể kết nối máy chủ (${base}). Kiểm tra backend và EXPO_PUBLIC_API_URL.`); }
    if (!response.ok) throw new Error(response.status === 401 ? "Email hoặc mật khẩu không đúng hoặc phiên đã hết hạn." : "Không thể hoàn tất yêu cầu. Vui lòng kiểm tra thông tin và thử lại.");
    return response.status === 204 ? undefined as T : await response.json() as T;
  } finally { clearTimeout(timer); }
}

export async function signIn(email: string, password: string): Promise<Staff> {
  const generation = ++sessionGeneration;
  const next = await request<Tokens>("login", { email: email.trim(), password });
  if (!next || !next.accessToken || !next.refreshToken || !(next.expiresIn > 0)) throw new Error("Phản hồi đăng nhập không hợp lệ.");
  try {
    const user = await request<{ id: string; email: string; fullName: string; role: string }>("me", undefined, next.accessToken);
    if (!user.id || !user.email || !user.fullName) throw new Error("Thông tin nhân viên không hợp lệ.");
    if (user.role !== "RECEPTIONIST" && user.role !== "WAITER") throw new Error("Tài khoản này sử dụng khu làm việc trên web.");
    if (generation !== sessionGeneration) throw new Error("Phiên đăng nhập đã thay đổi.");
    tokens = next;
    return { id: user.id, username: user.email, name: user.fullName, role: user.role, shift: "Chưa phân ca" };
  } catch (error) {
    await request("logout", { refreshToken: next.refreshToken }).catch(() => {});
    throw error;
  }
}

export async function signOut() {
  sessionGeneration++;
  const current = tokens;
  tokens = null;
  if (current) await request("logout", { refreshToken: current.refreshToken });
}

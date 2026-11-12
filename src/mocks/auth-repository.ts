import type { AuthenticationRepository } from "../features/auth/types";
import { DEMO_STAFF } from "./demo-data";
import { DEMO_WAITER, OTHER_WAITER } from "./waiter-data";

export const mockAuthenticationRepository: AuthenticationRepository = {
  async signIn(username, password) {
    const staff = [DEMO_STAFF, DEMO_WAITER, OTHER_WAITER].find((s) => s.username === username.trim());
    if (!staff || password !== "123456")
      throw new Error("Tài khoản hoặc mật khẩu không đúng.");
    return { ...staff };
  },
};

import type { AuthenticationRepository } from "../features/auth/types";
import { DEMO_STAFF } from "./demo-data";

export const mockAuthenticationRepository: AuthenticationRepository = {
  async signIn(username, password) {
    if (username.trim() !== "receptionist" || password !== "123456")
      throw new Error("Tài khoản hoặc mật khẩu không đúng.");
    return { ...DEMO_STAFF };
  },
};

export type Role =
  | "RECEPTIONIST"
  | "WAITER"
  | "KITCHEN"
  | "CASHIER"
  | "MANAGER";
export interface Staff {
  id: string;
  name: string;
  username: string;
  role: Role;
  shift: string;
}
export interface AuthenticationRepository {
  signIn(username: string, password: string): Promise<Staff>;
}

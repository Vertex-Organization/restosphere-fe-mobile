import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as authentication from "@/features/auth/api";
import type { ReceptionCommand, ReceptionState } from "@/features/reservations/types";
import type { WaiterCommand } from "@/features/waiter/types";
import { changeSession, loadWorkspace, mapSnapshot, sendCommand, type SessionChange, type Snapshot } from "./workspace-api";

const emptyState = (): ReceptionState => ({
  version: 1,
  serviceVersion: 1,
  seedDay: "",
  nextId: 0,
  settings: { bufferMinutes: 0, noShowMinutes: 0 },
  session: null,
  areas: [],
  tables: [],
  reservations: [],
  notifications: [],
  assignments: [],
  employees: [],
  tableSessions: [],
  menuCategories: [],
  menuItems: [],
  orders: [],
  orderItems: [],
  drafts: [],
  bills: [],
  waiterNotifications: [],
  requests: [],
  outbox: [],
});
interface Store {
  state: ReceptionState;
  ready: boolean;
  now: Date;
  storageError: string;
  notice: string;
  busy: boolean;
  signIn(username: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  run(command: ReceptionCommand): Promise<string | undefined>;
  runWaiter(command: WaiterCommand): Promise<void>;
  changeSession(command: SessionChange): Promise<void>;
  dismissNotice(): void;
  retrySave(): void;
}
const Context = createContext<Store | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(emptyState);
  const current = useRef(state);
  const generation = useRef(0);
  const pending = useRef(false);
  const refreshing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(new Date());
  const [storageError, setStorageError] = useState("");
  const [notice, setNotice] = useState("");
  function commit(next: ReceptionState) {
    current.current = next;
    setState(next);
  }
  function apply(data: Snapshot) {
    const session = current.current.session;
    if (!session) return;
    const mapped = mapSnapshot(data, session.id);
    const employee = mapped.employees.find((e) => e.id === session.id);
    commit({
      ...mapped,
      session: employee ? { ...session, shift: employee.shift, areaId: employee.areaId } : session,
    });
  }
  async function refresh() {
    if (!current.current.session || pending.current || refreshing.current) return;
    refreshing.current = true;
    const attempt = generation.current;
    try {
      const data = await loadWorkspace();
      if (attempt !== generation.current || pending.current) return;
      apply(data);
      setStorageError("");
    } catch (e) {
      if (attempt === generation.current) setStorageError((e as Error).message);
    } finally {
      refreshing.current = false;
    }
  }
  const poll = useEffectEvent(() => {
    setNow(new Date());
    void refresh();
  });
  useEffect(() => {
    const timer = setInterval(poll, 15000);
    return () => clearInterval(timer);
  }, []);
  async function signIn(username: string, password: string) {
    const attempt = ++generation.current;
    const staff = await authentication.signIn(username, password);
    try {
      const data = await loadWorkspace();
      if (attempt !== generation.current) return;
      const mapped = mapSnapshot(data, staff.id);
      const employee = mapped.employees.find((e) => e.id === staff.id);
      commit({
        ...mapped,
        session: { ...staff, shift: employee?.shift ?? staff.shift, areaId: employee?.areaId },
      });
      setStorageError("");
    } catch (e) {
      await authentication.signOut().catch(() => {});
      throw e;
    }
  }
  async function signOut() {
    generation.current++;
    commit(emptyState());
    setStorageError("");
    setNotice("");
    try {
      await authentication.signOut();
    } catch {
      setNotice("Đã đăng xuất trên thiết bị. Không thể thu hồi phiên trên máy chủ.");
    }
  }
  async function command(value: ReceptionCommand | WaiterCommand) {
    if (pending.current) throw new Error("Đang gửi thao tác. Vui lòng chờ.");
    if (!current.current.session) throw new Error("Vui lòng đăng nhập lại.");
    pending.current = true;
    setBusy(true);
    setNotice("");
    const attempt = ++generation.current;
    try {
      const result = await sendCommand(value);
      if (attempt !== generation.current) throw new Error("Phiên đăng nhập đã thay đổi.");
      apply(result.data);
      setStorageError("");
      if (!["read", "read-notification"].includes(value.type)) setNotice(result.summary);
      return result.reservationId;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        state,
        ready: true,
        now,
        storageError,
        notice,
        busy,
        signIn,
        signOut,
        run: command,
        runWaiter: async (value) => {
          await command(value);
        },
        changeSession: async (value) => {
          if (pending.current) throw new Error("Đang gửi thao tác. Vui lòng chờ.");
          pending.current = true;
          setBusy(true);
          const attempt = ++generation.current;
          try {
            const data = await changeSession(value);
            if (attempt !== generation.current) throw new Error("Phiên đăng nhập đã thay đổi.");
            apply(data);
            setStorageError("");
          } finally {
            pending.current = false;
            setBusy(false);
          }
        },
        dismissNotice: () => setNotice(""),
        retrySave: () => {
          void refresh();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const store = useContext(Context);
  if (!store) throw new Error("AppProvider is missing");
  return store;
}

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { executeCommand } from "@/features/reservations/commands";
import type {
  ReceptionCommand,
  ReceptionState,
} from "@/features/reservations/types";
// Demo adapters: swap these for API-backed repositories when the backend is ready.
import { mockAuthenticationRepository } from "@/mocks/auth-repository";
import { createMockState } from "@/mocks/demo-data";
import { mockReceptionRepository } from "@/mocks/reception-repository";

interface Store {
  state: ReceptionState;
  ready: boolean;
  now: Date;
  storageError: string;
  notice: string;
  signIn(username: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  run(command: ReceptionCommand): string | undefined;
  dismissNotice(): void;
  retrySave(): void;
}
const Context = createContext<Store | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => createMockState());
  const current = useRef(state);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(new Date());
  const [storageError, setStorageError] = useState("");
  const [notice, setNotice] = useState("");
  const saves = useRef(Promise.resolve());
  const authGeneration = useRef(0);
  function persist(next: ReceptionState) {
    saves.current = saves.current
      .catch(() => {})
      .then(() => mockReceptionRepository.save(next))
      .then(() => setStorageError(""))
      .catch(() =>
        setStorageError(
          "Không lưu được dữ liệu trên thiết bị. Thao tác hiện chỉ còn trong bộ nhớ.",
        ),
      );
    return saves.current;
  }
  function commit(next: ReceptionState) {
    current.current = next;
    setState(next);
    return persist(next);
  }
  useEffect(() => {
    let active = true;
    mockReceptionRepository
      .load()
      .then((saved) => {
        if (active) {
          current.current = saved;
          setState(saved);
        }
      })
      .catch(() => {
        if (active)
          setStorageError(
            "Không đọc được dữ liệu lưu. Đang dùng dữ liệu demo mới trong bộ nhớ.",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  async function signIn(username: string, password: string) {
    const attempt = ++authGeneration.current;
    const staff = await mockAuthenticationRepository.signIn(username, password);
    if (attempt === authGeneration.current)
      await commit({ ...current.current, session: staff });
  }
  async function signOut() {
    authGeneration.current++;
    setNotice("");
    await commit({ ...current.current, session: null });
  }
  function run(command: ReceptionCommand) {
    const result = executeCommand(current.current, command, new Date());
    void commit(result.state);
    if (command.type !== "read") setNotice("Đã cập nhật dữ liệu.");
    return result.reservationId;
  }
  return (
    <Context.Provider
      value={{
        state,
        ready,
        now,
        storageError,
        notice,
        signIn,
        signOut,
        run,
        dismissNotice: () => setNotice(""),
        retrySave: () => {
          void persist(current.current);
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

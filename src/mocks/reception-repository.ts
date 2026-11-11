import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  ReceptionRepository,
  ReceptionState,
} from "../features/reservations/types";
import { createMockState, restoreDemoState } from "./demo-data";

const STORAGE_KEY = "restosphere.staff.demo.v1";
export const mockReceptionRepository: ReceptionRepository = {
  async load() {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value ? restoreDemoState(JSON.parse(value)) : createMockState();
  },
  save(state: ReceptionState) {
    return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
};

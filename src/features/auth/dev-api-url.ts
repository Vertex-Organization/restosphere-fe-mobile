import Constants from "expo-constants";
import { Platform } from "react-native";
import { setDetectedApiBaseUrl } from "./api";

const DEV_API_PORT = 8080;

const host = Platform.OS === "web"
  ? (typeof window === "undefined" ? undefined : window.location.hostname)
  : Constants.expoConfig?.hostUri?.split(":")[0];

if (host) setDetectedApiBaseUrl(`http://${host}:${DEV_API_PORT}/api/v1`);

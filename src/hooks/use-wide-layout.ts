import { useWindowDimensions } from "react-native";
import { layout } from "@/theme";

/** True on desktop and landscape tablets, where workspaces show a sidebar. */
export function useWideLayout() {
  const { width } = useWindowDimensions();
  return width >= layout.wideMinWidth;
}

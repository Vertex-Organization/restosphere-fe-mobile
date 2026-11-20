import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "@/theme";
import { ui } from "./styles";

export function Loading() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={ui.text}>Đang tải dữ liệu…</Text>
    </View>
  );
}

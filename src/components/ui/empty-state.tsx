import { Text, View } from "react-native";
import { colors } from "@/theme";
import { AppIcon } from "./app-icon";
import { ui } from "./styles";

export function EmptyState({
  title = "Chưa có dữ liệu",
  description = "Thử chọn ngày hoặc thay đổi bộ lọc.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <View style={{ padding: 28, gap: 10, alignItems: "center" }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name="file-tray-outline" size={24} />
      </View>
      <Text style={[ui.heading, { textAlign: "center" }]}>{title}</Text>
      <Text style={[ui.muted, { textAlign: "center" }]}>{description}</Text>
    </View>
  );
}

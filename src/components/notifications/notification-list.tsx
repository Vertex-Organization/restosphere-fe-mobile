import { Pressable, Text, View } from "react-native";
import { AppIcon, FilterChip, type IconName, ui } from "@/components/ui";
import { colors, radius } from "@/theme";
import { dateTimeLabel } from "@/utils/dates";

export function NotificationListHeader({ unread, total, onlyUnread, onFilter, onReadAll, readAllLabel }: {
  unread: number;
  total: number;
  onlyUnread: boolean;
  onFilter(value: boolean): void;
  onReadAll(): void;
  readAllLabel: string;
}) {
  return <View style={{ gap: 12, paddingBottom: 16 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <Text style={ui.muted}><Text style={[ui.label, { color: unread ? colors.primary : colors.ink, fontWeight: "700" }]}>{unread} chưa đọc</Text> · {total} thông báo</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={readAllLabel} accessibilityState={{ disabled: !unread }} disabled={!unread} onPress={onReadAll}
        style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, opacity: !unread ? 0.45 : pressed ? 0.6 : 1 })}>
        <AppIcon name="checkmark-done-outline" size={19} />
        <Text style={[ui.label, { color: colors.primary }]}>Đọc tất cả</Text>
      </Pressable>
    </View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <FilterChip title="Tất cả" selected={!onlyUnread} onPress={() => onFilter(false)} />
      <FilterChip title={`Chưa đọc (${unread})`} selected={onlyUnread} onPress={() => onFilter(true)} />
    </View>
  </View>;
}

export function NotificationRow({ title, body, at, unread, category, icon, tone = "primary", onPress }: {
  title: string;
  body: string;
  at: string;
  unread: boolean;
  category: string;
  icon: IconName;
  tone?: "primary" | "success" | "danger" | "warning";
  onPress(): void;
}) {
  const ink = colors[tone];
  const tint = tone === "primary" ? colors.primarySoft : tone === "success" ? colors.successSoft : tone === "danger" ? colors.dangerSoft : colors.warningSoft;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ${unread ? "chưa đọc" : "đã đọc"}`} onPress={onPress}
    style={({ pressed }) => ({ flexDirection: "row", gap: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: unread ? ink : colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: pressed ? colors.surface : unread ? colors.primarySoft : colors.white })}>
    <View style={{ width: 34, height: 34, borderRadius: radius.control, alignItems: "center", justifyContent: "center", backgroundColor: tint }}>
      <AppIcon name={icon} color={ink} size={19} />
    </View>
    <View style={{ flex: 1, gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={[ui.caption, { color: ink, fontWeight: "500", flex: 1 }]}>{category}</Text>
        {unread && <View style={{ width: 7, height: 7, borderRadius: radius.full, backgroundColor: ink }} />}
      </View>
      <Text style={[ui.text, { fontWeight: unread ? "700" : "500" }]}>{title}</Text>
      <Text style={ui.muted}>{body}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 4, paddingTop: 4 }}>
        <Text style={ui.caption}>{dateTimeLabel(at)}</Text>
        <Text style={[ui.caption, { color: unread ? colors.primary : colors.muted, fontWeight: unread ? "600" : "400" }]}>{unread ? "Chưa đọc" : "Đã đọc"}</Text>
      </View>
    </View>
  </Pressable>;
}

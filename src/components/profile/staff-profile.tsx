import { Host, List, ListItem, Text as NativeText } from "@expo/ui";
import type { ReactNode } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { AppIcon, type IconName, ui } from "@/components/ui";
import type { Staff } from "@/features/auth/types";
import { ROLE_LABELS } from "@/features/auth/roles";
import { colors, radius } from "@/theme";

export function StaffProfile({ staff, children }: { staff: Staff; children?: ReactNode }) {
  const { fontScale } = useWindowDimensions();
  const initials = staff.name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("");
  return (
    <>
      <View style={{ gap: 16, paddingBottom: 20, borderBottomWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: radius.full, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.primaryBorder }}>
            <Text style={[ui.title, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text accessibilityRole="header" style={ui.heading}>{staff.name}</Text>
            <Text style={[ui.label, { color: colors.primary }]}>{ROLE_LABELS[staff.role]}</Text>
            <Text style={ui.caption}>Tài khoản · {staff.username}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <AppIcon name="time-outline" size={18} color={colors.muted} />
          <Text style={[ui.muted, { flex: 1 }]}>{staff.shift}</Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text accessibilityRole="header" style={ui.heading}>Thông tin tài khoản</Text>
        <Host colorScheme="light" seedColor={colors.primary}
          // Native lists need a proposed height. Scale the three account rows with system text.
          style={{ height: 196 * Math.max(fontScale, 1), width: "100%", borderRadius: radius.control, overflow: "hidden", backgroundColor: colors.white }}>
          <List>
            {[["Mã nhân viên", staff.id], ["Vai trò", ROLE_LABELS[staff.role]], ["Tài khoản đăng nhập", staff.username]].map(([label, value]) => (
              <ListItem key={label} supportingText={value}><NativeText textStyle={{ color: colors.ink }}>{label}</NativeText></ListItem>
            ))}
          </List>
        </Host>
      </View>
      {children}
    </>
  );
}

export function ProfileAction({ title, icon, onPress }: { title: string; icon: IconName; onPress(): void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", minHeight: 52, paddingHorizontal: 12, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: pressed ? colors.surface : colors.white })}>
      <AppIcon name={icon} size={20} color={colors.primary} />
      <Text style={[ui.label, { flex: 1 }]}>{title}</Text>
      <AppIcon name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

export function DeviceDataNote() {
  return <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
    <AppIcon name="information-circle-outline" size={18} color={colors.muted} />
    <Text style={[ui.caption, { flex: 1 }]}>Dữ liệu được lưu trên máy chủ và cập nhật mỗi 15 giây. Thao tác cần kết nối mạng.</Text>
  </View>;
}

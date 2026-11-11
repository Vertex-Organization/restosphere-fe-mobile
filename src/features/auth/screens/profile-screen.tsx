import { Host, List, ListItem, Text as NativeText } from "@expo/ui";
import { useState } from "react";
import { Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { AppIcon, Button, ConfirmDialog, Message, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { colors, radius } from "@/theme";
import { ROLE_LABELS } from "../roles";
export default function ProfileScreen() {
  const { state, signOut } = useApp();
  const [confirm, setConfirm] = useState(false);
  const staff = state.session!;
  const initials = staff.name.split(" ").slice(-2).map((part) => part[0]).join("");
  return (
    <Screen tabbed>
      <View style={[ui.panel, { padding: 24, gap: 16 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: radius.full, backgroundColor: colors.primarySoft, justifyContent: "center", alignItems: "center" }}>
            <Text style={[ui.heading, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={ui.heading}>{staff.name}</Text>
            <Text style={ui.muted}>{staff.id}{` · Nhân viên ${ROLE_LABELS[staff.role].toLowerCase()}`}</Text>
          </View>
        </View>
        <View style={[ui.divider]} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <AppIcon name="time-outline" size={18} color={colors.muted} />
          <Text style={ui.muted}>{staff.shift}</Text>
        </View>
      </View>
      <Text style={[ui.heading, { paddingTop: 8 }]}>Thông tin tài khoản</Text>
      <Host colorScheme="light" seedColor={colors.primary}
        style={{ height: 300, width: "100%", borderRadius: radius.panel, overflow: "hidden", backgroundColor: colors.white }}>
        <List>
          {[["Họ tên", staff.name], ["Mã nhân viên", staff.id], ["Vai trò", ROLE_LABELS[staff.role]], ["Tài khoản", staff.username]].map(([label, value]) => (
            <ListItem key={label} supportingText={value}><NativeText>{label}</NativeText></ListItem>
          ))}
        </List>
      </Host>
      <Message kind="info">Dữ liệu mô phỏng chỉ lưu trên thiết bị này, chưa kết nối hệ thống thật. Dữ liệu mẫu được tạo lại khi mở ứng dụng vào ngày mới.</Message>
      <Button title="Đăng xuất" icon="log-out-outline" variant="danger" onPress={() => setConfirm(true)} />
      {confirm && <ConfirmDialog title="Đăng xuất" message="Kết thúc phiên làm việc trên thiết bị này? Dữ liệu nghiệp vụ demo vẫn được giữ."
        onCancel={() => setConfirm(false)} onConfirm={() => { void signOut(); }} />}
    </Screen>
  );
}

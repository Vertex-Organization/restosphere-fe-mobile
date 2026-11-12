import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { DeviceDataNote, ProfileAction, StaffProfile } from "@/components/profile/staff-profile";
import { Button, ConfirmDialog } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { radius } from "@/theme";

export default function WaiterProfileScreen() {
  const { state, signOut } = useApp();
  const [confirm, setConfirm] = useState(false);
  return <Screen tabbed>
    <StaffProfile staff={state.session!}>
      <View style={{ borderRadius: radius.control, overflow: "hidden" }}>
        <ProfileAction title="Xem lịch sử phục vụ" icon="time-outline" onPress={() => router.push("/waiter/history")} />
        <ProfileAction title="Xem thông báo" icon="notifications-outline" onPress={() => router.push("/waiter/notifications")} />
        {__DEV__ && <ProfileAction title="Công cụ kiểm thử luồng mô phỏng" icon="construct-outline" onPress={() => router.push("/waiter/dev-workflow")} />}
      </View>
    </StaffProfile>
    <DeviceDataNote />
    <Button title="Đăng xuất" icon="log-out-outline" variant="danger" onPress={() => setConfirm(true)} />
    {confirm && <ConfirmDialog title="Đăng xuất" message="Kết thúc phiên làm việc trên thiết bị? Giỏ món và dữ liệu phục vụ vẫn được giữ." onCancel={() => setConfirm(false)} onConfirm={() => { void signOut(); }} />}
  </Screen>;
}

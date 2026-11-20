import { router } from "expo-router";
import { useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { AppIcon, Button, ConfirmDialog, EmptyState, Message, SectionHeader, ui, type IconName } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { colors, radius, typography } from "@/theme";
import { dayKey } from "@/utils/dates";
import { ReservationListItem } from "../components/reservation-list-item";
import { canConfirmReservation, getAvailableTables, getReceptionDashboardSummary, selectReservations } from "../rules";
import type { Reservation } from "../types";
import { tableCode } from "@/features/tables/labels";

export default function DashboardScreen() {
  const { state, now, run } = useApp();
  const [confirm, setConfirm] = useState<Reservation | null>(null);
  const [error, setError] = useState("");
  const summary = getReceptionDashboardSummary(state, now);
  const today = selectReservations(state, dayKey(now));
  const sections = [
    { title: "Chờ bàn giao", data: today.filter((r) => r.status === "ARRIVED") },
    { title: "Cần xác nhận", data: today.filter((r) => r.status === "PENDING") },
    { title: "Khách sắp đến", data: today.filter((r) => r.status === "CONFIRMED" && new Date(r.startsAt) >= now && new Date(r.startsAt).getTime() <= now.getTime() + 120 * 60_000) },
    { title: "Khách đến trễ", data: today.filter((r) => r.status === "CONFIRMED" && new Date(r.startsAt) < now) },
  ].filter((section) => section.data.length > 0);
  const candidate = confirm && (confirm.tableId ? state.tables.find((t) => t.id === confirm.tableId)?.code : getAvailableTables(state, confirm, confirm.id, now)[0]?.code);
  const metrics = [
    { value: summary.pending, label: "Cần xác nhận", color: colors.warning, icon: "time-outline" as const },
    { value: summary.upcoming, label: "Sắp đến", color: colors.info, icon: "calendar-outline" as const },
    { value: summary.arrived, label: "Chờ bàn giao", color: colors.success, icon: "people-outline" as const },
    { value: summary.late, label: "Đến trễ", color: colors.danger, icon: "alert-circle-outline" as const },
  ];
  const quickActions: { title: string; subtitle: string; icon: IconName; onPress(): void }[] = [
    { title: "Tạo đặt bàn", subtitle: "Thêm lịch hẹn mới", icon: "add-outline", onPress: () => router.push("/reception/reservations/form") },
    { title: "Đón khách", subtitle: "Tìm lịch & nhận khách", icon: "scan-outline", onPress: () => router.push("/reception/check-in") },
    { title: "Khách trực tiếp", subtitle: "Tiếp nhận tại quầy", icon: "people-outline", onPress: () => router.push("/reception/walk-in") },
    { title: "Xem bàn trống", subtitle: "Chọn bàn sẵn sàng", icon: "restaurant-outline", onPress: () => router.push("/reception/tables?status=AVAILABLE") },
  ];
  return (
    <Screen tabbed scroll={false}>
      <SectionList
        sections={sections}
        keyExtractor={(r) => r.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.content}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <View style={styles.dateRow}>
              <Text style={ui.muted}>Hôm nay, {now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</Text>
              <Text style={[ui.caption, { color: colors.primary }]}>Quầy lễ tân</Text>
            </View>
            <View style={styles.summary}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={ui.heading}>Tình hình ca làm</Text>
                <Text style={ui.caption}>{summary.total} lịch đặt hôm nay · {state.tables.length} bàn</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Xem ${summary.available} bàn sẵn sàng`} onPress={() => router.push("/reception/tables?status=AVAILABLE")}
                style={({ pressed }) => [styles.availability, { opacity: pressed ? 0.65 : 1 }]}>
                <Text style={[styles.smallNumber, { color: colors.primary }]}>{summary.available}<Text style={ui.caption}> / {state.tables.length}</Text></Text>
                <Text style={[ui.caption, { color: colors.primary }]}>Bàn sẵn sàng →</Text>
              </Pressable>
            </View>
            <View style={styles.metricRow}>
              {metrics.map((metric) => (
                <View key={metric.label} style={styles.smallMetric}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <AppIcon name={metric.icon} size={16} color={metric.color} />
                    <Text style={[styles.smallNumber, { color: metric.color }]}>{metric.value}</Text>
                  </View>
                  <Text style={[ui.caption, { textAlign: "center" }]}>{metric.label}</Text>
                </View>
              ))}
            </View>
            <View style={{ gap: 8 }}>
              <View style={styles.actionGrid}>
                {quickActions.map((action, index) => (
                  <Pressable key={action.title} accessibilityRole="button" accessibilityLabel={`${action.title}. ${action.subtitle}`} onPress={action.onPress}
                    style={({ pressed }) => [styles.action, { backgroundColor: index === 0 ? pressed ? colors.primaryPressed : colors.primary : pressed ? colors.surface : colors.white }]}>
                    <AppIcon name={action.icon} size={20} color={index === 0 ? colors.white : colors.primary} />
                    <Text style={[ui.label, { color: index === 0 ? colors.white : colors.ink, fontWeight: "600", flex: 1 }]}>{action.title}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <SectionHeader title="Lịch cần xử lý" action="Xem tất cả" onPress={() => router.push("/reception/bookings")} />
            {!!error && <Message>{error}</Message>}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.queueHeading}>
            <Text style={[ui.label, { color: colors.muted }]}>{section.title}</Text>
            <View style={styles.count}><Text style={[ui.caption, { color: colors.primary }]}>{section.data.length}</Text></View>
          </View>
        )}
        renderItem={({ item: r }) => (
          <ReservationListItem reservation={r} trailing={
            r.status === "PENDING" ? <Button title="Xác nhận đặt bàn" variant="secondary" onPress={() => {
              const check = canConfirmReservation(state, r, new Date());
              if (!check.ok) setError(check.reason);
              else { setError(""); setConfirm(r); }
            }} /> : r.status === "CONFIRMED" ? <Button title="Nhận khách" icon="scan-outline" variant="secondary" onPress={() => router.push(`/reception/check-in?id=${r.id}`)} /> : <Button title="Tiếp tục bàn giao" variant="secondary" onPress={() => router.push(`/reception/handover?id=${r.id}`)} />
          } />
        )}
        ListEmptyComponent={<EmptyState title="Đã xử lý hết công việc" description="Các lịch cần xác nhận, đón khách và bàn giao sẽ hiển thị tại đây." />}
      />
      {confirm && <ConfirmDialog title="Xác nhận đặt bàn" message={`Xác nhận ${confirm.code} và giữ bàn ${candidate ?? "phù hợp"} cho khách?`}
        onCancel={() => setConfirm(null)} onConfirm={async () => {
          try { await run({ type: "confirm", id: confirm.id }); setConfirm(null); }
          catch (e) { setError((e as Error).message); setConfirm(null); }
        }} />}
    </Screen>
  );
}
const styles = StyleSheet.create({
  dateRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  summary: { flexDirection: "row", alignItems: "center", paddingBottom: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  availability: { minHeight: 48, alignItems: "flex-end", justifyContent: "center", gap: 2 },
  metricRow: { flexDirection: "row", flexWrap: "wrap", rowGap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  smallMetric: { flex: 1, minWidth: 65, alignItems: "center", gap: 4 },
  smallNumber: { ...typography.heading, fontVariant: ["tabular-nums"], color: colors.ink },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: { flexBasis: "45%", flexGrow: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderRadius: radius.control, borderCurve: "continuous", minHeight: 48 },
  queueHeading: { paddingTop: 8, paddingBottom: 0, flexDirection: "row", gap: 8, alignItems: "center" },
  count: { minWidth: 24, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.badge, backgroundColor: colors.primarySoft, alignItems: "center" },
});

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

export default function DashboardScreen() {
  const { state, now, run } = useApp();
  const [confirm, setConfirm] = useState<Reservation | null>(null);
  const [error, setError] = useState("");
  const summary = getReceptionDashboardSummary(state, now);
  const today = selectReservations(state, dayKey(now));
  const sections = [
    { title: "Cần xác nhận", data: today.filter((r) => r.status === "PENDING") },
    { title: "Chờ bàn giao", data: today.filter((r) => r.status === "ARRIVED") },
    { title: "Khách sắp đến", data: today.filter((r) => r.status === "CONFIRMED" && new Date(r.startsAt) >= now && new Date(r.startsAt).getTime() <= now.getTime() + 120 * 60_000) },
    { title: "Khách đến trễ", data: today.filter((r) => r.status === "CONFIRMED" && new Date(r.startsAt) < now) },
  ].filter((section) => section.data.length > 0);
  const candidate = confirm && (confirm.tableId ?? getAvailableTables(state, confirm, confirm.id, now)[0]?.id);
  const metrics = [
    { value: summary.pending, label: "Chờ xác nhận", color: colors.warning },
    { value: summary.upcoming, label: "Sắp đến", color: colors.info },
    { value: summary.arrived, label: "Đã check-in", color: colors.success },
    { value: summary.late, label: "Đến trễ", color: colors.danger },
  ];
  const quickActions: { title: string; subtitle: string; icon: IconName; onPress(): void }[] = [
    { title: "Tạo đặt bàn", subtitle: "Thêm lịch hẹn mới", icon: "add-outline", onPress: () => router.push("/reception/reservations/form") },
    { title: "Đón khách", subtitle: "Tìm lịch & check-in", icon: "scan-outline", onPress: () => router.push("/reception/check-in") },
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
          <View style={{ gap: 24 }}>
            <View style={styles.dateRow}>
              <Text style={ui.muted}>Hôm nay, {now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</Text>
              <Text style={ui.caption}>{state.session?.name.split(" ").slice(-2).join(" ")}</Text>
            </View>
            <View style={styles.summary}>
              <View style={styles.summaryTop}>
                <Text style={[ui.label, { color: colors.inverseMuted }]}>Hoạt động hôm nay</Text>
                <AppIcon name="calendar-outline" size={19} color={colors.brandGold} />
              </View>
              <View style={styles.bigMetrics}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.bigNumber}>{summary.total.toString().padStart(2, "0")}</Text>
                  <Text style={[ui.label, { color: colors.inverseMuted }]}>Lịch đặt bàn</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.bigNumber}>{summary.available.toString().padStart(2, "0")}<Text style={styles.totalTables}> / {state.tables.length}</Text></Text>
                  <Text style={[ui.label, { color: colors.inverseMuted }]}>Bàn sẵn sàng</Text>
                </View>
              </View>
            </View>
            <View style={styles.metricRow}>
              {metrics.map((metric) => (
                <View key={metric.label} style={styles.smallMetric}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={[styles.statusDot, { backgroundColor: metric.color }]} />
                    <Text style={styles.smallNumber}>{metric.value}</Text>
                  </View>
                  <Text style={[ui.caption, { textAlign: "center" }]}>{metric.label}</Text>
                </View>
              ))}
            </View>
            <View style={{ gap: 12 }}>
              <Text style={ui.heading}>Thao tác nhanh</Text>
              <View style={styles.actionGrid}>
                {quickActions.map((action, index) => (
                  <Pressable key={action.title} accessibilityRole="button" accessibilityLabel={`${action.title}. ${action.subtitle}`} onPress={action.onPress}
                    style={({ pressed }) => [styles.action, { backgroundColor: index === 0 ? pressed ? colors.primaryPressed : colors.primary : pressed ? colors.surface : colors.white }]}>
                    <AppIcon name={action.icon} size={23} color={index === 0 ? colors.white : colors.primary} />
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
            }} /> : r.status === "CONFIRMED" ? <Button title="Check-in khách" icon="scan-outline" variant="secondary" onPress={() => router.push(`/reception/check-in?id=${r.id}`)} /> : <Button title="Tiếp tục bàn giao" variant="secondary" onPress={() => router.push(`/reception/handover?id=${r.id}`)} />
          } />
        )}
        ListEmptyComponent={<EmptyState title="Đã xử lý hết công việc" description="Các lịch cần xác nhận, đón khách và bàn giao sẽ hiển thị tại đây." />}
      />
      {confirm && <ConfirmDialog title="Xác nhận đặt bàn" message={`Xác nhận ${confirm.code} và giữ bàn ${candidate ?? "phù hợp"}. Chính sách demo tự giữ một bàn để tránh nhận quá khả năng.`}
        onCancel={() => setConfirm(null)} onConfirm={() => {
          try { run({ type: "confirm", id: confirm.id }); setConfirm(null); }
          catch (e) { setError((e as Error).message); setConfirm(null); }
        }} />}
    </Screen>
  );
}
const styles = StyleSheet.create({
  dateRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  summary: { padding: 24, gap: 20, backgroundColor: colors.primaryDark, borderRadius: radius.panel, borderCurve: "continuous" },
  summaryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  bigMetrics: { flexDirection: "row", alignItems: "center", gap: 24 },
  bigNumber: { ...typography.metric, color: colors.white, fontVariant: ["tabular-nums"] },
  totalTables: { ...typography.body, color: colors.inverseMuted },
  summaryDivider: { width: 1, height: 52, backgroundColor: colors.inverseBorder },
  metricRow: { flexDirection: "row", flexWrap: "wrap", rowGap: 16 },
  smallMetric: { flex: 1, minWidth: 65, alignItems: "center", gap: 4 },
  smallNumber: { ...typography.heading, fontVariant: ["tabular-nums"], color: colors.ink },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  action: { flexBasis: "45%", flexGrow: 1, flexDirection: "row", alignItems: "center", padding: 14, gap: 10, borderRadius: radius.control, borderCurve: "continuous", minHeight: 64 },
  queueHeading: { paddingTop: 16, paddingBottom: 0, flexDirection: "row", gap: 8, alignItems: "center" },
  count: { minWidth: 24, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.badge, backgroundColor: colors.primarySoft, alignItems: "center" },
});

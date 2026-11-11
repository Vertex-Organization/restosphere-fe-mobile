import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import {
  DetailRow,
  EmptyState,
  Message,
  Section,
  ui,
} from "@/components/ui";
import { ReservationListItem } from "@/features/reservations/components/reservation-list-item";
import { StatusBadge } from "@/features/reservations/components/status-badge";
import { endsAt, heldRange, holdsTable } from "@/features/reservations/rules";
import { useApp } from "@/store/app-store";
import { dateTimeLabel } from "@/utils/dates";
export default function TableDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, now } = useApp();
  const table = state.tables.find((t) => t.id === id);
  if (!table)
    return (
      <Screen>
        <EmptyState title="Không tìm thấy bàn" />
      </Screen>
    );
  const related = state.reservations
    .filter((r) => r.tableId === id)
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  const current = related.find((r) => r.status === "SEATED");
  const holds = related.filter((r) => holdsTable(r));
  const upcoming = holds.filter(
    (r) => r.status !== "SEATED" && endsAt(heldRange(r)) > now,
  );
  return (
    <Screen>
      <View style={ui.row}>
        <Text style={ui.title}>Bàn {table.code}</Text>
        <StatusBadge status={table.status} />
      </View>
      <View style={ui.panel}>
        <DetailRow
          label="Khu vực"
          value={state.areas.find((a) => a.id === table.areaId)?.name}
        />
        <DetailRow label="Sức chứa" value={`${table.capacity} khách`} />
        <DetailRow
          label="Khách đang sử dụng"
          value={
            current
              ? `${current.customer.name} · ${current.actualGuests ?? current.guests} khách`
              : "Không có lượt đang sử dụng"
          }
        />
      </View>
      <Message kind="info">
        Trạng thái vận hành và lịch giữ bàn là hai thông tin riêng. Lễ tân chỉ
        xem; không đánh dấu khách rời bàn hoặc đã dọn.
      </Message>
      <Section title="Khung giờ giữ bàn">
        {holds.length ? (
          holds.map((r) => (
            <View key={r.id} style={ui.panel}>
              <Text style={ui.text}>
                {r.code} · {r.customer.name}
              </Text>
              <Text style={ui.muted}>
                {dateTimeLabel(heldRange(r).startsAt)} →{" "}
                {dateTimeLabel(endsAt(heldRange(r)))} (+15 phút đệm)
              </Text>
            </View>
          ))
        ) : (
          <EmptyState title="Chưa có khung giờ giữ bàn" />
        )}
      </Section>
      <Section title="Lịch sắp tới">
        {upcoming.length ? (
          upcoming.map((r) => (
            <ReservationListItem key={r.id} reservation={r} />
          ))
        ) : (
          <Text style={ui.muted}>Không có lịch sắp tới.</Text>
        )}
      </Section>
      <Section title="Các lịch liên quan">
        {related.length ? (
          related.map((r) => <ReservationListItem key={r.id} reservation={r} />)
        ) : (
          <Text style={ui.muted}>Chưa có lịch liên quan.</Text>
        )}
      </Section>
    </Screen>
  );
}

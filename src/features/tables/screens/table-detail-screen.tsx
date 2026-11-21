import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { DetailRow, EmptyState, Message, Section, ui } from "@/components/ui";
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
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const current = related.find((r) => r.status === "SEATED");
  const holds = related
    .filter((r) => holdsTable(r) && (r.status === "SEATED" || endsAt(heldRange(r)) > now))
    .sort(
      (a, b) =>
        Number(b.status === "SEATED") - Number(a.status === "SEATED") ||
        new Date(heldRange(a).startsAt).getTime() - new Date(heldRange(b).startsAt).getTime(),
    );
  const heldIds = new Set(holds.map((r) => r.id));
  const otherRelated = related.filter((r) => !heldIds.has(r.id));
  return (
    <Screen>
      <View style={ui.row}>
        <Text style={ui.title}>Bàn {table.code}</Text>
        <StatusBadge status={table.status} />
      </View>
      <View style={ui.panel}>
        <DetailRow label="Khu vực" value={state.areas.find((a) => a.id === table.areaId)?.name} />
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
        Màn hình này chỉ để xem. Việc khách rời bàn và dọn bàn do phục vụ cập nhật.
      </Message>
      <Section title="Khung giờ giữ bàn">
        {holds.length ? (
          holds.map((r) => (
            <ReservationListItem
              key={r.id}
              reservation={r}
              trailing={
                <View style={{ gap: 4 }}>
                  <Text style={ui.caption}>
                    {r.status === "SEATED" ? "Sử dụng bàn" : "Giữ chỗ"}:{" "}
                    {dateTimeLabel(heldRange(r).startsAt)} – {dateTimeLabel(endsAt(heldRange(r)))}
                  </Text>
                  <Text style={ui.caption}>
                    Có {state.settings.bufferMinutes} phút dọn bàn giữa các lượt khách.
                  </Text>
                </View>
              }
            />
          ))
        ) : (
          <Text style={ui.muted}>Chưa có khung giờ giữ bàn.</Text>
        )}
      </Section>
      <Section title="Các lịch khác liên quan">
        {otherRelated.length ? (
          otherRelated.map((r) => <ReservationListItem key={r.id} reservation={r} />)
        ) : (
          <Text style={ui.muted}>Không có lịch khác liên quan.</Text>
        )}
      </Section>
    </Screen>
  );
}

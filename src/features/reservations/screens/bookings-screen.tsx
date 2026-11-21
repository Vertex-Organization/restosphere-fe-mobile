import { router } from "expo-router";
import { useState } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import {
  Button,
  DateField,
  EmptyState,
  FilterChip,
  IconButton,
  SearchInput,
  Select,
  SectionHeader,
  ui,
} from "@/components/ui";
import { useApp } from "@/store/app-store";
import { dayKey, shiftDay } from "@/utils/dates";
import { ReservationListItem } from "../components/reservation-list-item";
import { STATUS_LABELS } from "../labels";
import { selectReservations } from "../rules";

export default function BookingsScreen() {
  const { state, now } = useApp();
  const [day, setDay] = useState(dayKey(now));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const data = selectReservations(state, day, query, status);
  const quickStatuses = [
    { value: "", label: "Tất cả" },
    { value: "PENDING", label: "Chờ xác nhận" },
    { value: "CONFIRMED", label: "Đã xác nhận" },
    { value: "ARRIVED", label: "Đã đến" },
  ];
  return (
    <Screen tabbed scroll={false}>
      <FlatList
        data={data}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.content}
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            <Button
              title="Tạo đặt bàn"
              icon="add-outline"
              onPress={() => router.push("/reception/reservations/form")}
            />
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              <IconButton
                icon="chevron-back"
                label="Ngày trước"
                onPress={() => setDay(shiftDay(day, -1))}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <DateField
                  label="Ngày đặt bàn"
                  value={new Date(`${day}T12:00:00`)}
                  onChange={(d) => setDay(dayKey(d))}
                />
              </View>
              <IconButton
                icon="chevron-forward"
                label="Ngày sau"
                onPress={() => setDay(shiftDay(day, 1))}
              />
            </View>
            {day !== dayKey(now) && (
              <Button title="Về hôm nay" variant="secondary" onPress={() => setDay(dayKey(now))} />
            )}
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <SearchInput value={query} onChangeText={setQuery} />
              </View>
              <IconButton
                icon="options-outline"
                label={filtersOpen ? "Ẩn bộ lọc" : "Mở bộ lọc trạng thái"}
                selected={filtersOpen}
                onPress={() => setFiltersOpen(!filtersOpen)}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {quickStatuses.map((s) => (
                <FilterChip
                  key={s.value}
                  title={s.label}
                  selected={status === s.value}
                  onPress={() => setStatus(s.value)}
                />
              ))}
            </ScrollView>
            {filtersOpen && (
              <View style={[ui.panel, { gap: 12 }]}>
                <Select
                  label="Tất cả trạng thái"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "", label: "Tất cả trạng thái" },
                    ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
                  ]}
                />
                {(!!query || !!status) && (
                  <Button
                    title="Xóa bộ lọc"
                    variant="secondary"
                    onPress={() => {
                      setQuery("");
                      setStatus("");
                    }}
                  />
                )}
              </View>
            )}
            {!quickStatuses.some((s) => s.value === status) && (
              <Text style={ui.muted}>
                Đang lọc: {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              </Text>
            )}
            <SectionHeader title="Lịch trong ngày" count={data.length} />
          </View>
        }
        renderItem={({ item }) => <ReservationListItem reservation={item} />}
        ListEmptyComponent={
          <EmptyState
            title={query || status ? "Không tìm thấy lịch phù hợp" : "Chưa có lịch trong ngày này"}
          />
        }
      />
    </Screen>
  );
}

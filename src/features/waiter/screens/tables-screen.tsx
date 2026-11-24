import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { FlatList, ScrollView, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { AppIcon, EmptyState, FilterChip, SearchInput, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { colors } from "@/theme";
import { normalizeSearch } from "@/utils/search";
import { needsCleaning, sessionBill, sessionItems, visibleSessions } from "../selectors";
import { SessionCard } from "../components/service-ui";

export default function WaiterTablesScreen() {
  const { state } = useApp();
  const { filter: requestedFilter } = useLocalSearchParams<{ filter?: string }>();
  const filter =
    requestedFilter &&
    ["mine", "pending", "ready", "serving", "payment", "cleaning", "all"].includes(requestedFilter)
      ? requestedFilter
      : "mine";
  const [query, setQuery] = useState("");
  const all = visibleSessions(state).filter((s) => !s.closedAt || needsCleaning(state, s));
  const filters = [
    {
      key: "mine",
      label: "Bàn của tôi",
      count: all.filter((s) => s.waiterId === state.session?.id).length,
    },
    { key: "pending", label: "Chờ tiếp nhận", count: all.filter((s) => !s.acceptedAt).length },
    {
      key: "ready",
      label: "Có món sẵn sàng",
      count: all.filter(
        (s) => !s.closedAt && sessionItems(state, s.id).some((i) => i.status === "READY"),
      ).length,
    },
    {
      key: "serving",
      label: "Đang phục vụ",
      count: all.filter(
        (s) => !!s.acceptedAt && !s.closedAt && sessionBill(state, s.id)?.status === "UNPAID",
      ).length,
    },
    {
      key: "payment",
      label: "Chờ thanh toán",
      count: all.filter((s) => sessionBill(state, s.id)?.status === "PAYMENT_REQUESTED").length,
    },
    {
      key: "cleaning",
      label: "Cần dọn",
      count: all.filter((s) => needsCleaning(state, s)).length,
    },
    { key: "all", label: "Tất cả", count: all.length },
  ];
  const data = all.filter((session) => {
    const table = state.tables.find((t) => t.id === session.tableId)!;
    const reservation = state.reservations.find((r) => r.id === session.reservationId)!;
    const text = `${table.code} ${state.areas.find((a) => a.id === table.areaId)?.name} ${reservation.customer.name}`;
    return (
      normalizeSearch(text).includes(normalizeSearch(query)) &&
      (filter === "all" ||
        (filter === "mine" && session.waiterId === state.session?.id) ||
        (filter === "pending" && !session.acceptedAt) ||
        (filter === "ready" &&
          !session.closedAt &&
          sessionItems(state, session.id).some((i) => i.status === "READY")) ||
        (filter === "serving" &&
          !!session.acceptedAt &&
          !session.closedAt &&
          sessionBill(state, session.id)?.status === "UNPAID") ||
        (filter === "payment" && sessionBill(state, session.id)?.status === "PAYMENT_REQUESTED") ||
        (filter === "cleaning" && needsCleaning(state, session)))
    );
  });
  return (
    <Screen tabbed scroll={false}>
      <FlatList
        data={data}
        keyExtractor={(session) => session.id}
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder="Mã bàn, khu vực, tên khách…"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {filters.map(({ key, label, count }) => (
                <FilterChip
                  key={key}
                  title={`${label} · ${count}`}
                  selected={filter === key}
                  onPress={() => router.setParams({ filter: key })}
                />
              ))}
            </ScrollView>
            <View style={[ui.row, { justifyContent: "space-between" }]}>
              <Text style={ui.label}>
                {filters.find((item) => item.key === filter)?.label} · {data.length} bàn
              </Text>
              <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                <AppIcon name="hand-left-outline" size={14} color={colors.muted} />
                <Text style={ui.caption}>Chạm để xử lý</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => <SessionCard session={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        ListEmptyComponent={
          <EmptyState
            title="Không có bàn phù hợp"
            description="Thay đổi bộ lọc hoặc từ khóa tìm kiếm."
          />
        }
      />
    </Screen>
  );
}

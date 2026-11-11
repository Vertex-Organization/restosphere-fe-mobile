import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/layout/screen";
import { Button, EmptyState, Field, FilterChip, IconButton, Select, SectionHeader, ui } from "@/components/ui";
import { useWideLayout } from "@/hooks/use-wide-layout";
import { useApp } from "@/store/app-store";
import { colors, layout, radius } from "@/theme";
import { TableItem } from "../components/table-item";
import { TABLE_LABELS } from "../labels";

export default function TablesScreen() {
  const { state } = useApp();
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = useWideLayout();
  // The sidebar takes part of the window on wide screens; size the grid to what is left.
  const width = windowWidth - (wide ? layout.sidebarWidth : 0);
  const columns = width < 360 || fontScale > 1.3 ? 1 : width >= 1000 ? 4 : width >= 700 ? 3 : 2;
  const cardWidth = (Math.min(width - insets.left - insets.right, layout.maxWidth) - layout.pagePadding * 2 - (columns - 1) * 12) / columns;
  const params = useLocalSearchParams<{ status?: string }>();
  const [area, setArea] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const status = params.status && params.status in TABLE_LABELS ? params.status : "";
  const setStatus = (value: string) => router.setParams({ status: value });
  const [capacity, setCapacity] = useState("");
  const valid = !capacity || /^\d+$/.test(capacity);
  const tables = state.tables.filter((t) => (!area || t.areaId === area) && (!status || t.status === status) && valid && (!capacity || t.capacity >= Number(capacity)));
  const areaTables = state.tables.filter((t) => !area || t.areaId === area);
  const counts = [
    { key: "AVAILABLE", label: "Sẵn sàng", color: colors.success },
    { key: "OCCUPIED", label: "Đang dùng", color: colors.info },
    { key: "CLEANING", label: "Đang dọn", color: colors.warning },
    { key: "OUT_OF_SERVICE", label: "Tạm ngưng", color: colors.danger },
  ];
  return (
    <Screen tabbed scroll={false}>
      <FlatList key={columns} numColumns={columns} data={tables} keyExtractor={(t) => t.id}
        keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}
        columnWrapperStyle={columns > 1 ? { gap: 12, alignItems: "stretch" } : undefined}
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            <Text style={ui.muted}>Theo dõi bàn và chọn vị trí phù hợp cho khách.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <FilterChip title="Tất cả khu vực" selected={!area} onPress={() => setArea("")} />
              {state.areas.map((a) => <FilterChip key={a.id} title={a.name} selected={area === a.id} onPress={() => setArea(a.id)} />)}
            </ScrollView>
            <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16, padding: 16, borderRadius: radius.panel, backgroundColor: colors.white }}>
              {counts.map((s) => <View key={s.key} style={{ flex: 1, minWidth: 60, alignItems: "center", gap: 4 }}>
                <Text style={[ui.heading, { color: s.color, fontVariant: ["tabular-nums"] }]}>{areaTables.filter((t) => t.status === s.key).length}</Text>
                <Text style={[ui.caption, { textAlign: "center" }]}>{s.label}</Text>
              </View>)}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1 }}><SectionHeader title="Danh sách bàn" count={tables.length} /></View>
              <IconButton icon="options-outline" label={filtersOpen ? "Ẩn bộ lọc bàn" : "Mở bộ lọc bàn"} selected={filtersOpen || !!status || !!capacity} onPress={() => setFiltersOpen(!filtersOpen)} />
            </View>
            {!!status && !filtersOpen && <View style={{ alignSelf: "flex-start" }}><FilterChip title={`${TABLE_LABELS[status as keyof typeof TABLE_LABELS]} · Bỏ lọc ×`} selected onPress={() => setStatus("")} /></View>}
            {filtersOpen && <View style={[ui.panel, { gap: 16 }]}>
              <Select label="Trạng thái vận hành" value={status} onChange={setStatus}
                options={[{ value: "", label: "Tất cả trạng thái" }, ...Object.entries(TABLE_LABELS).map(([value, label]) => ({ value, label }))]} />
              <Field label="Sức chứa tối thiểu" keyboardType="number-pad" value={capacity} onChangeText={setCapacity} placeholder="Số khách" error={valid ? undefined : "Nhập số nguyên không âm."} />
              {(!!status || !!capacity) && <Button title="Xóa bộ lọc bàn" variant="secondary" onPress={() => { setStatus(""); setCapacity(""); }} />}
            </View>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <TableItem table={item} compact />
          </View>
        )}
        ListEmptyComponent={<EmptyState title="Không có bàn phù hợp" description="Thử đổi khu vực, trạng thái hoặc số khách." />}
      />
    </Screen>
  );
}

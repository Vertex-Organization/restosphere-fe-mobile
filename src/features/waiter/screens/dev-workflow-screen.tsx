import { useState } from "react";
import { Redirect } from "expo-router";
import { Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Button, EmptyState, Message, Section, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import type { MockServiceEvent } from "@/mocks/service-workflow";
import { sessionItems, visibleSessions } from "../selectors";

export default function DevWorkflowScreen() {
  const { state, runDevelopmentMock } = useApp();
  const [error, setError] = useState("");
  if (!__DEV__) return <Redirect href="/waiter/overview" />;
  const mine = visibleSessions(state).filter((s) => s.waiterId === state.session?.id && !s.closedAt);
  const sessionIds = new Set(mine.map((s) => s.id));
  const items = mine.flatMap((s) => sessionItems(state, s.id).filter((i) => ["SUBMITTED", "PREPARING"].includes(i.status)).map((item) => ({ session: s, item })));
  const bills = state.bills.filter((b) => sessionIds.has(b.sessionId) && b.status === "PAYMENT_REQUESTED");
  const fire = (event: MockServiceEvent) => { try { runDevelopmentMock(event); setError(""); } catch (e) { setError((e as Error).message); } };
  return <Screen><Message kind="info">Công cụ dành cho kiểm thử phát triển. Các nút phát sự kiện từ vai trò Bếp / Thu ngân, không phải quyền của WAITER. Không có sự kiện tự chạy khi mở màn hình. Công cụ bị khóa trong bản production.</Message>
    {!!error && <Message>{error}</Message>}
    <Section title="Sự kiện từ bếp">{items.map(({ session, item }) => <View key={item.id} style={ui.panel}><Text style={ui.text}>Bàn {session.tableId} · {item.quantity} × {item.name}</Text>{item.status === "SUBMITTED" ? <><Button title="Phát sự kiện: bếp tiếp nhận" accessibilityLabel={`Bếp tiếp nhận ${item.name}, bàn ${session.tableId}`} variant="secondary" onPress={() => fire({ type: "kitchen-accept", itemId: item.id })} /><Button title="Phát sự kiện: hết nguyên liệu" accessibilityLabel={`Bếp từ chối ${item.name}, bàn ${session.tableId}`} variant="danger" onPress={() => fire({ type: "kitchen-reject", itemId: item.id, reason: "Bếp báo hết nguyên liệu trong lần kiểm thử." })} /></> : <Button title="Phát sự kiện: món hoàn thành" accessibilityLabel={`Bếp hoàn thành ${item.name}, bàn ${session.tableId}`} variant="secondary" onPress={() => fire({ type: "kitchen-ready", itemId: item.id })} />}</View>)}{!items.length && <EmptyState title="Không có món chờ bếp" description="Gửi món từ giỏ để kiểm thử tiến độ." />}</Section>
    <Section title="Sự kiện từ thu ngân">{bills.map((b) => <View key={b.id} style={ui.panel}><Text style={ui.text}>Bàn {mine.find((s) => s.id === b.sessionId)?.tableId}</Text><Button title="Phát sự kiện: đã thanh toán" accessibilityLabel={`Thu ngân xác nhận bàn ${mine.find((s) => s.id === b.sessionId)?.tableId}`} variant="secondary" onPress={() => fire({ type: "cashier-paid", billId: b.id })} /></View>)}{!bills.length && <Text style={ui.muted}>Chưa có yêu cầu thanh toán cần xử lý.</Text>}</Section>
  </Screen>;
}

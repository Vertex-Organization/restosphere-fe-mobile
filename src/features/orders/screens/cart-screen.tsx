import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/layout/screen";
import { Button, ConfirmDialog, EmptyState, Field, Message, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { FoodThumbnail } from "@/features/menu/components/food-thumbnail";
import { colors, radius } from "@/theme";
import { canOrder, money, sessionDrafts } from "@/features/waiter/selectors";
import { AmountRow, MissingSession, SessionHeading, openServiceScreen, useServiceSession, useWaiterAction } from "@/features/waiter/components/service-ui";
import { tableCode } from "@/features/tables/labels";

function DraftNote({ note, name, editable, save }: { note: string; name: string; editable: boolean; save(note: string): Promise<void> }) {
  const [text, setText] = useState(note);
  return <View style={{ gap: 8 }}>
    <Field label={`Ghi chú ${name}`} placeholder="Ít cay, không hành, ít đá…" multiline maxLength={300} value={text} editable={editable} onChangeText={setText} />
    {text !== note && <Button title="Lưu ghi chú" disabled={!editable} onPress={() => save(text)} />}
  </View>;
}

export default function CartScreen() {
  const { state } = useApp();
  const session = useServiceSession();
  const { act, error } = useWaiterAction();
  const [confirm, setConfirm] = useState(false);
  if (!session) return <MissingSession />;
  const drafts = sessionDrafts(state, session.id);
  const editable = canOrder(state, session);
  const total = drafts.reduce((n, d) => n + d.quantity * (state.menuItems.find((m) => m.id === d.menuItemId)?.price ?? 0), 0);
  const unavailable = drafts.some((d) => state.menuItems.find((m) => m.id === d.menuItemId)?.status !== "AVAILABLE");
  return <Screen>
    <SessionHeading session={session} />
    <Text style={ui.muted}>Món trong giỏ chưa gửi xuống bếp. Các lượt đã gửi được giữ nguyên.</Text>
    {!!error && <Message>{error}</Message>}
    {!editable && <Message kind="info">Lượt phục vụ đang khóa chỉnh sửa giỏ.</Message>}
    {!drafts.length && <EmptyState title="Giỏ món đang trống" description="Chọn món từ thực đơn trước khi gửi bếp." />}
    {drafts.map((draft) => { const menu = state.menuItems.find((m) => m.id === draft.menuItemId)!;
      const edit = (quantity: number, note = draft.note) => act({ type: "edit-draft", sessionId: session.id, draftId: draft.id, quantity, note });
      return <View key={draft.id} style={{ backgroundColor: colors.white, borderRadius: radius.control, borderCurve: "continuous", padding: 12, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><FoodThumbnail itemId={menu.id} name={menu.name} size={56} /><View style={{ flex: 1, gap: 4 }}><Text style={[ui.text, { fontWeight: "600" }]}>{menu.name}</Text><Text style={ui.caption}>{money(menu.price)} / phần</Text><Text selectable style={[ui.label, { color: colors.primary, fontVariant: ["tabular-nums"] }]}>{money(menu.price * draft.quantity)}</Text></View></View>
        {menu.status !== "AVAILABLE" && <Message>Món đã hết hoặc ngừng bán. Xóa khỏi giỏ để gửi những món còn lại.</Message>}
        <View style={ui.row}><Button title="−" accessibilityLabel={`Giảm số lượng ${menu.name}`} variant="secondary" disabled={!editable || draft.quantity <= 1} onPress={() => edit(draft.quantity - 1)} /><Text accessibilityLabel={`Số lượng ${menu.name}`} style={ui.heading}>{draft.quantity}</Text><Button title="+" accessibilityLabel={`Tăng số lượng ${menu.name}`} variant="secondary" disabled={!editable || draft.quantity >= 99 || menu.status !== "AVAILABLE"} onPress={() => edit(draft.quantity + 1)} /><Button title="Xóa món" accessibilityLabel={`Xóa ${menu.name} khỏi giỏ`} variant="danger" disabled={!editable} onPress={() => act({ type: "remove-draft", sessionId: session.id, draftId: draft.id })} /></View>
        <DraftNote key={`${draft.id}:${draft.note}`} name={menu.name} note={draft.note} editable={editable} save={(note) => edit(draft.quantity, note)} />
      </View>;
    })}
    <AmountRow label="Tạm tính lượt này" amount={total} />
    <Button title="Gửi xuống bếp" icon="send-outline" disabled={!editable || !drafts.length || unavailable} onPress={() => setConfirm(true)} />
    {editable && <Button title="Chọn thêm món" variant="secondary" onPress={() => openServiceScreen("menu", session)} />}
    {confirm && <ConfirmDialog title="Gửi lượt gọi món" message={`Gửi ${drafts.reduce((n, d) => n + d.quantity, 0)} phần cho bàn ${tableCode(state.tables, session.tableId)}? Món đã gửi sẽ không thể sửa trực tiếp.`} onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); act({ type: "submit", sessionId: session.id }, () => router.replace({ pathname: "/waiter/progress", params: { sessionId: session.id } })); }} />}
  </Screen>;
}

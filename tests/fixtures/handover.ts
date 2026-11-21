import type { ReceptionState } from "../../src/features/reservations/types";

/** Called by reception's handover transaction and by the v1 storage migration. */
export function syncHandovers(state: ReceptionState) {
  for (const r of state.reservations) {
    if (
      r.status !== "SEATED" ||
      !r.tableId ||
      !r.handedOverAt ||
      state.tableSessions.some((s) => s.reservationId === r.id)
    )
      continue;
    if (
      r.preorder !== undefined &&
      (!Array.isArray(r.preorder) ||
        r.preorder.some(
          (p) =>
            !p ||
            !Number.isInteger(p.quantity) ||
            p.quantity < 1 ||
            p.quantity > 99 ||
            (p.note !== undefined && (typeof p.note !== "string" || p.note.length > 300)) ||
            !state.menuItems.some((m) => m.id === p.menuItemId),
        ))
    )
      throw new Error("Món đặt trước không hợp lệ.");
    const sessionId = `ts${state.nextId++}`;
    state.tableSessions.push({
      id: sessionId,
      tableId: r.tableId,
      reservationId: r.id,
      handedOverAt: r.handedOverAt,
    });
    state.bills.push({ id: `bill${state.nextId++}`, sessionId, status: "UNPAID" });
    if (r.preorder?.length) {
      for (const p of r.preorder) {
        state.drafts.push({
          id: `draft${state.nextId++}`,
          sessionId,
          waiterId: "",
          menuItemId: p.menuItemId,
          quantity: p.quantity,
          note: p.note ?? "Món khách đặt trước",
        });
      }
    }
    state.waiterNotifications.unshift({
      id: `wn${state.nextId++}`,
      sessionId,
      kind: "HANDOVER",
      title: `Bàn ${r.tableId} chờ tiếp nhận`,
      body: `${r.actualGuests ?? r.guests} khách · ${r.customer.name}`,
      at: r.handedOverAt,
      readBy: [],
    });
  }
}

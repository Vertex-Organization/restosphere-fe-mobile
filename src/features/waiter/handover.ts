import type { ReceptionState } from "../reservations/types";

/** Called by reception's handover transaction and by the v1 storage migration. */
export function syncHandovers(state: ReceptionState) {
  for (const r of state.reservations) {
    if (r.status !== "SEATED" || !r.tableId || !r.handedOverAt || state.tableSessions.some((s) => s.reservationId === r.id)) continue;
    const sessionId = `ts${state.nextId++}`;
    state.tableSessions.push({ id: sessionId, tableId: r.tableId, reservationId: r.id, handedOverAt: r.handedOverAt });
    state.bills.push({ id: `bill${state.nextId++}`, sessionId, status: "UNPAID" });
    state.waiterNotifications.unshift({
      id: `wn${state.nextId++}`, sessionId, kind: "HANDOVER", title: `Bàn ${r.tableId} chờ tiếp nhận`,
      body: `${r.actualGuests ?? r.guests} khách · ${r.customer.name}`, at: r.handedOverAt, readBy: [],
    });
  }
}

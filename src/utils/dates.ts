export function dayKey(value: Date | string = new Date()): string {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function addMinutes(value: Date | string, minutes: number): Date {
  return new Date(new Date(value).getTime() + minutes * 60_000);
}
export function shiftDay(value: string, amount: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return dayKey(date);
}
export const timeLabel = (value: Date | string) =>
  new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
export const dateLabel = (value: Date | string) => new Date(value).toLocaleDateString("vi-VN");
export const dateTimeLabel = (value: Date | string) => `${timeLabel(value)} · ${dateLabel(value)}`;
export const lateMinutes = (r: { startsAt: string }, now: Date) =>
  Math.max(0, Math.floor((now.getTime() - new Date(r.startsAt).getTime()) / 60_000));

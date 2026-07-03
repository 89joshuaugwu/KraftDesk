import { formatDistanceToNow } from "date-fns";

export function safeParseDate(value: any): Date | null {
  if (value == null) return null;
  // Firestore Timestamp with toDate()
  if (typeof value?.toDate === "function") {
    const d = value.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  // Firestore-like object with seconds/nanoseconds
  if (typeof value === "object" && typeof value.seconds === "number") {
    const ms = value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  // numbers / ISO strings / Date objects
  const d = new Date(value as any);
  return isNaN(d.getTime()) ? null : d;
}

export function safeFormatDistanceToNow(value: any): string {
  const d = safeParseDate(value);
  if (!d) return "";
  return formatDistanceToNow(d, { addSuffix: true });
}

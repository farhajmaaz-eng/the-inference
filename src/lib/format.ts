export function dateLabel(value: string | null, full = false) {
  if (!value) return "Not disclosed";
  return new Intl.DateTimeFormat("en", {
    month: full ? "long" : "short",
    day: "numeric",
    year: full ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(new Date(value));
}
export function timeLabel(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}
export function relativeDate(value: string | null) {
  if (!value) return "";
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  if (elapsed < 60_000) return "Just now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  return dateLabel(value);
}
export function deskName(slug: string) {
  return slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
export function knownBoolean(
  value: boolean | null,
  yes = "Available",
  no = "Unavailable",
) {
  return value === null ? "Not disclosed" : value ? yes : no;
}
export function money(value: number | null) {
  return value === null
    ? "Not disclosed"
    : `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 3 })}`;
}

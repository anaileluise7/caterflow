export function parseBudget(b) {
  if (!b) return 0;
  const m = String(b).match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

export function fmtMoney(n) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n || 0);
}

export function asDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export function monthKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key) {
  const [y, m] = key.split("-");
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function inquiryValue(i) {
  if (!i) return 0;
  return (Number(i.guest_count) || 0) * parseBudget(i.budget_per_head);
}

export const CONFIRMED_STATUSES = ["Confirmed", "Invoiced", "Paid", "Completed"];
export const departments = [
  ["sales", "Sales Executive"], ["cashier", "Cashier at POS"],
  ["accounts", "Accountant"], ["logistics", "Logistics Executive"],
  ["deptmgr", "Department Manager"], ["ea", "Executive Assistant"],
  ["hr", "HR Executive"], ["marketing", "Marketing Executive"]
];

export const deptName = Object.fromEntries(departments);
export const categories = { M: "Basic maths", P: "Role & process", S: "Customer handling", D: "Discipline", B: "Lotus brand" };

export function parseEmployee(id, raw) {
  const safeParse = (value) => { try { return value ? JSON.parse(value) : null; } catch { return null; } };
  return { code: id, ...raw, test: raw.test || safeParse(raw.testJ), result: raw.result || safeParse(raw.resultJ), done: raw.done || {} };
}

export function dayNumber(start) {
  const joined = new Date(`${start || new Date().toISOString().slice(0, 10)}T00:00:00`);
  return Math.max(1, Math.floor((Date.now() - joined.getTime()) / 86400000) + 1);
}

export function fillRules(text, rules = {}) {
  return String(text || "").replaceAll("{pass}", rules.pass || "80").replaceAll("{delivery}", rules.delivery || "4–6").replaceAll("{happy}", rules.happy || "24");
}

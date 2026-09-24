// Five distinct allowances or trip lengths, always using live catalogue IDs.
export function selectPlans(packages, category = 'fixed') {
  const unlimited = category === 'unlimited';
  const amount = plan => Number(plan.dataGB) || Number(plan.dataMB) / 1024 || 0;
  const value = plan => unlimited ? Number(plan.duration) : amount(plan);
  const best = new Map();
  for (const plan of packages.filter(plan => Boolean(plan.unlimited) === unlimited)) {
    const previous = best.get(value(plan));
    if (!previous || Number(plan.price) < Number(previous.price) ||
      (Number(plan.price) === Number(previous.price) && Number(plan.duration) > Number(previous.duration))) best.set(value(plan), plan);
  }
  const remaining = [...best.values()];
  const selected = [];
  for (const target of unlimited ? [3, 5, 7, 15, 30] : [1, 3, 5, 10, 20]) {
    remaining.sort((a,b) => Math.abs(value(a)-target)-Math.abs(value(b)-target) || Number(a.price)-Number(b.price) || String(a.id).localeCompare(String(b.id)));
    const plan = remaining.shift();
    if (plan) selected.push(plan);
  }
  return selected.sort((a,b) => value(a)-value(b));
}

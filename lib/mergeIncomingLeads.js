export function mergeIncomingLeads(leads, incomingLeads) {
  const result = [...leads];
  for (const incoming of incomingLeads) {
    const index = result.findIndex(lead => lead.id === incoming.id);
    if (index < 0) {
      result.unshift(incoming);
      continue;
    }
    const existing = result[index];
    const merged = { ...existing, ...incoming };
    for (const field of ['notes', 'stage', 'status', 'counselor']) {
      if (existing[field]) merged[field] = existing[field];
    }
    result[index] = merged;
  }
  // Match JSON persistence: omit missing optional fields before SDK validation.
  return JSON.parse(JSON.stringify(result));
}

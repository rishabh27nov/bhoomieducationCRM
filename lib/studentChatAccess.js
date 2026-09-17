export const values = data => Object.values(data || {}).filter(Boolean);
const nameKey = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
export function phoneKey(value) {
  let digits = String(value || '').split(/[\/,;|]/).find(part => part.trim())?.replace(/\D/g, '') || '';
  if (digits.length === 10) digits = `91${digits}`;
  return /^\d{11,15}$/.test(digits) ? digits : '';
}
export function ownsLead(user, lead, employees) {
  if (!user?.id) return false;
  if (lead.counselorId) return String(lead.counselorId) === String(user.id);
  const matches = employees.filter(employee => nameKey(employee.name) === nameKey(lead.counselor));
  return matches.length === 1 && String(matches[0].id) === String(user.id);
}
export function canAccessPhone(user, phone, leads, employees) {
  const key = phoneKey(phone);
  if (!key) return false;
  if (user?.role === 'Admin' || user?.role === 'Institute') return true;
  const matches = leads.filter(lead => phoneKey(lead.phone) === key);
  // Shared numbers must not expose another counselor's student conversation.
  return matches.length > 0 && matches.every(lead => ownsLead(user, lead, employees));
}

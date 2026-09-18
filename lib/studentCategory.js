export const ACADEMIC_STAGES = ['Onboarding', 'Classes Ongoing', 'Follow-up Required', 'Course Completed'];

export function studentCategory(student, employees = []) {
  const explicit = String(student?.studentCategory || student?.category || '').trim().toLowerCase();
  if (explicit === 'academic') return 'Academic';
  if (explicit === 'sales') return 'Sales';
  if (String(student?.leadType || '').toLowerCase() === 'academic') return 'Academic';
  const counselor = String(student?.counselor || '').trim().toLowerCase();
  const owner = employees.find(employee => counselor && String(employee?.name || '').trim().toLowerCase() === counselor);
  return owner?.category === 'Academic' ? 'Academic' : 'Sales';
}

export function bulkRecipients(students, includeAcademic = false) {
  return students.filter(student => includeAcademic || studentCategory(student) !== 'Academic');
}

export function resolveRecipientCategory(recipient, students) {
  const phoneKey = value => String(value || '').split(/[\/,;|]/)[0].replace(/\D/g, '').slice(-10);
  const id = recipient.leadId || recipient.id;
  const matches = students.filter(student => (id && student.id === id) ||
    (phoneKey(recipient.phone) && phoneKey(student.phone) === phoneKey(recipient.phone)));
  // A shared phone must not bypass the Academic opt-in.
  return matches.some(student => studentCategory(student) === 'Academic')
    ? 'Academic' : studentCategory(matches[0] || recipient);
}

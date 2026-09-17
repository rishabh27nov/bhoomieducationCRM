export function matchesStudentSearch(student, query) {
  const text = String(query || '').trim().toLowerCase();
  if (!text) return true;
  if (String(student.name || '').toLowerCase().includes(text)) return true;
  const digits = text.replace(/\D/g, '');
  return digits.length > 0 && /^[+\d\s().-]+$/.test(text)
    && String(student.phone || '').replace(/\D/g, '').includes(digits);
}

export async function readWhatsAppResponse(response) {
  let data;
  try { data = await response.json(); }
  catch { throw new Error('Student chat service could not be reached. Restart the local app with npm run dev and retry.'); }
  if (!response.ok) throw new Error(data.error || 'Could not load student chats. Please retry.');
  return data;
}

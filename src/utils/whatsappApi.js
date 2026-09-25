import { auth } from '../firebase';

export async function whatsappFetch(url, options = {}) {
  const user = JSON.parse(localStorage.getItem('lakshya_user') || 'null');
  const headers = new Headers(options.headers);
  await auth.authStateReady();
  if (auth.currentUser) {
    headers.set('Authorization', `Bearer ${await auth.currentUser.getIdToken()}`);
  } else if (user?.password) {
    const bytes = new TextEncoder().encode(JSON.stringify({ id: user.id || user.username, password: user.password }));
    headers.set('Authorization', `Basic ${btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))}`);
  }
  return fetch(url, { ...options, headers, cache: 'no-store' });
}

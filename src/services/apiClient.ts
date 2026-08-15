import { auth } from "../firebase";
import { DEMO_AUTH_TOKEN, DEMO_USER_STORAGE_KEY } from "../AuthProvider";

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const currentUser = auth.currentUser;

  if (currentUser) {
    const token = await currentUser.getIdToken();
    headers.set("Authorization", `Bearer ${token}`);
  } else if (localStorage.getItem(DEMO_USER_STORAGE_KEY)) {
    headers.set("Authorization", `Bearer ${DEMO_AUTH_TOKEN}`);
    headers.set("X-AgroCare-Demo-User", "demo-farmer");
  }

  return fetch(input, {
    ...init,
    headers
  });
}

// FFL service worker: push notifications only.
// No fetch handler on purpose, so every request goes to the network and nobody sees a stale fund or stale scores.
const SB_URL = "https://jkbqpjqehzcjcsjnoobi.supabase.co";
const SB_KEY = "sb_publishable_Pn-9srwR262fL859vOOtsA_UEsnNT3f";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = {body: e.data ? e.data.text() : ""}; }
  e.waitUntil(self.registration.showNotification(d.title || "Fantasy Founders League", {
    body: d.body || "",
    icon: "icons/icon-192.png",
    badge: "icons/badge-96.png",
    tag: d.tag || undefined,
    data: {url: d.url || "/"}
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(list => {
    const open = list.find(c => c.url.startsWith(self.location.origin));
    if (open) return open.focus().then(c => (c && c.url !== url && "navigate" in c) ? c.navigate(url) : c);
    return self.clients.openWindow(url);
  }));
});

// The browser rotated the subscription: re-register it so the device keeps getting notifications.
self.addEventListener("pushsubscriptionchange", e => {
  const opts = e.oldSubscription && e.oldSubscription.options;
  if (!opts) return;
  e.waitUntil(self.registration.pushManager.subscribe(opts).then(sub => {
    const j = sub.toJSON();
    return fetch(SB_URL + "/rest/v1/rpc/push_subscribe", {
      method: "POST",
      headers: {apikey: SB_KEY, "Content-Type": "application/json"},
      body: JSON.stringify({p_token: null, p_endpoint: j.endpoint, p_keys: j.keys, p_platform: null})
    });
  }));
});

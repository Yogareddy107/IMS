// IntraSphere Labs IMS — Mobile & Desktop Push Notification Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle user clicking on a mobile notification toast or lock screen banner
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle push events sent from backend push services (VAPID / Web Push)
self.addEventListener('push', (event) => {
  let title = 'IntraSphere IMS Alert';
  let body = 'You have a new update in IntraSphere Labs IMS.';
  let url = '/';

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
      url = data.url || url;
    } catch {
      body = event.data.text() || body;
    }
  }

  const options = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: { url },
    tag: 'intrasphere-ims-push-' + Date.now(),
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(`IntraSphere IMS: ${title}`, options));
});

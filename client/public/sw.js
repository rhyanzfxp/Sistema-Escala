/* Service Worker - LouvorEscala */

// Instala sem forçar troca imediata (evita interromper canal de push)
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Ativa sem roubar controle de clientes existentes (evita "message channel closed")
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.resolve());
});

// Recebe notificação push do servidor
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Lembrete de Escala', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || '🎵 Lembrete de Escala';
  const options = {
    body: data.body || 'Você tem um culto agendado em breve.',
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    tag: data.tag || 'escala-reminder',
    requireInteraction: false,
    data: { url: data.url || self.registration.scope }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : self.registration.scope;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = { title: 'Nueva edición', body: 'Hay una edición nueva.', url: '/' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch { /* el aviso igual se muestra */ }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    data: { url: data.url || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const ruta = (event.notification.data && event.notification.data.url) || '/'
  const destino = new URL(ruta, self.location.origin).href
  event.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const ventana of ventanas) {
      if (new URL(ventana.url).origin !== self.location.origin) continue
      if ('navigate' in ventana) await ventana.navigate(destino)
      return ventana.focus()
    }
    await self.clients.openWindow(destino)
  })())
})

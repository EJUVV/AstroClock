// Service worker mínimo: existe para o navegador oferecer "Instalar app".
// Não guarda nada em cache; funcionar sem internet fica para a Fase 2.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()))

// Só repassa a abertura de páginas para a rede, sem cache.
self.addEventListener('fetch', (evento) => {
  if (evento.request.mode === 'navigate') evento.respondWith(fetch(evento.request))
})

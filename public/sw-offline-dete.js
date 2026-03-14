/**
 * sw-offline-detector.js
 * Script importado pelo Service Worker para detectar quando a VPS está offline
 * e notificar o app Vue para exibir o banner de redirecionamento local.
 *
 * Destino: public/sw-offline-detector.js
 */

// Intercepta todas as requisições para a VPS
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Só intercepta chamadas para a VPS Nitec
    if (!url.includes('.nitec.dev.br') && !url.includes('.nitec.localhost')) return;

    event.respondWith(
        fetch(event.request.clone())
            .then((response) => {
                // VPS respondeu — notifica o app que está online
                if (response.ok || response.status < 500) {
                    self.clients.matchAll().then(clients => {
                        clients.forEach(c => c.postMessage({ tipo: 'vps_online' }));
                    });
                }
                return response;
            })
            .catch(() => {
                // VPS não respondeu — notifica o app para mostrar o banner local
                self.clients.matchAll().then(clients => {
                    clients.forEach(c => c.postMessage({ tipo: 'vps_offline' }));
                });

                // Tenta retornar do cache se disponível
                return caches.match(event.request)
                    .then(cached => cached || Response.error());
            })
    );
});
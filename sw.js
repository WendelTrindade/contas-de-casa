/* Contas de Casa — service worker (guarda só a "casca" do aplicativo).
   Os dados financeiros NUNCA são guardados aqui: pedidos ao Firebase/Google passam direto. */
const VERSAO = 'contas-2.6.0';
const CASCA = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(CASCA)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'ATUALIZAR_AGORA') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // Firebase e Google: direto na internet
  // Sempre tenta a internet primeiro (pega versão nova); sem internet, usa a cópia guardada.
  e.respondWith(
    fetch(req).then(resp => {
      if (resp && resp.ok) {
        const copia = resp.clone();
        caches.open(VERSAO).then(c => c.put(req, copia));
      }
      return resp;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});

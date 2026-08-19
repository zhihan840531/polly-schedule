const CACHE='polly-workspace-v5';
const ASSETS=[
  './',
  './index.html',
  './manifest.webmanifest',
  './app-icon.png',
  './icon-192.png',
  './icon-512.png',
  './admissions.js',
  './workspace-enhancements.js'
];

function injectWorkspaceScripts(html){
  let out=html;
  if(!out.includes('admissions.js')){
    out=out.replace('</body>','<script src="./admissions.js?v=1"></script></body>');
  }
  if(!out.includes('workspace-enhancements.js')){
    out=out.replace('</body>','<script src="./workspace-enhancements.js?v=1"></script></body>');
  }
  return out;
}

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req=e.request;
  const url=new URL(req.url);
  const isAppPage=req.mode==='navigate' || url.pathname.endsWith('/polly-schedule/') || url.pathname.endsWith('/polly-schedule/index.html');

  if(isAppPage){
    e.respondWith((async()=>{
      try{
        const response=await fetch(req);
        const type=response.headers.get('content-type')||'';
        if(type.includes('text/html')){
          const html=injectWorkspaceScripts(await response.text());
          return new Response(html,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}});
        }
        return response;
      }catch(err){
        const cached=await caches.match('./index.html');
        if(cached){
          const html=injectWorkspaceScripts(await cached.text());
          return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});
        }
        throw err;
      }
    })());
    return;
  }

  e.respondWith(
    fetch(req)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return response;
      })
      .catch(() => caches.match(req))
  );
});

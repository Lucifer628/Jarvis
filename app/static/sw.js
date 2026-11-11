const CACHE="jarvis-x-v2";
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(["/","/static/styles.css","/static/app.js","/static/manifest.webmanifest"]))));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET" || new URL(event.request.url).pathname.startsWith("/api/")) return;
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));
});

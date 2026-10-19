/* Waddle offline support. The app opens from the saved copy and refreshes it in the background, so changes appear the next time it is opened. */
const CACHE="waddle-v1";
const CORE=["./","index.html","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(u.origin!==location.origin&&u.hostname!=="fonts.googleapis.com"&&u.hostname!=="fonts.gstatic.com")return;
  const nav=r.mode==="navigate";
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(r,{ignoreSearch:nav});
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque"))c.put(nav?"index.html":r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    const res=await net;
    if(res)return res;
    return nav?((await c.match("index.html"))||Response.error()):Response.error();
  }));
});

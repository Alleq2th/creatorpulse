// CreatorPulse service worker — network-first strategy.
//
// Why network-first: earlier versions of this app suffered badly from stale
// caching (uploaded fixes that never reached real devices for hours). This
// version always tries the network first and only falls back to the cache when
// the network fails, so a deploy reaches phones immediately.
//
// The CACHE_NAME still has to move forward on every shell change: it is what
// evicts the OLD precached index.html. Without the bump, a phone that is offline
// (or whose first request races the deploy) can be served the previous shell.
const CACHE_NAME = "creatorpulse-v23";

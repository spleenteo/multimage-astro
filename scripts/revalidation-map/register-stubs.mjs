import module from 'node:module';
import { resolve } from './hooks.mjs';

// Node >= 22.15: in-thread sync hooks, which compose with tsx. The off-thread
// module.register() chain breaks tsx's loading of the entry .ts on Node 24
// (script silently does not run), so it is only the fallback for older Node.
if (typeof module.registerHooks === 'function') {
  module.registerHooks({ resolve });
} else {
  module.register(new URL('./hooks.mjs', import.meta.url));
}

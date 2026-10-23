---
"@serenity-kit/opaque": patch
"@serenity-kit/opaque-p256": patch
---

Fix a memory leak when a client or server function is called with params of the wrong shape, for example a missing field, a number where a string belongs, or an unknown `keyStretching` value. Each such call leaked WASM memory, and after a few thousand of them the instance broke: every later call, valid or not, threw `RuntimeError: memory access out of bounds` until the process restarted. A server that passes unvalidated request bodies to `server.createRegistrationResponse`, `server.startLogin` or `server.finishLogin` could be pushed into that state by malformed requests. These calls now throw the same error as before and leave the instance usable. Types and error messages are unchanged.

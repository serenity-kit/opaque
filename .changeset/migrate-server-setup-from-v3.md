---
"@serenity-kit/opaque": minor
"@serenity-kit/opaque-p256": minor
---

Add `server.migrateSetupFromV3` (and a matching `migrate-server-setup-from-v3 <OLD_SERVER_SETUP>` CLI command) to convert a `serverSetup` produced by opaque-ke v3 (the version behind 0.9.x) into the format required by v4 (1.x). This is a re-encoding, not a key rotation: the OPRF seed and the real server AKE private key are copied through unchanged, since opaque-ke 4.0.0 only changed how the internal "dummy user" record is stored -- a private scalar in v3, the corresponding public key in v4. Existing `registrationRecord`s keep working against the migrated setup with no changes of their own. Only supports migrating within the same cipher suite (Ristretto255 or P-256) as the setup was originally created with -- the two curves are unrelated groups and neither substitutes for the other.

---
"@serenity-kit/opaque-p256": major
"@serenity-kit/opaque": major
---

Upgrade opaque-ke to 4.0.0 matching RFC9807

This includes breaking changes if you use a previous version of the library and created a server setup and registration records with it. You can write a Rust script to convert the server setup and registration records to the new format. See [https://github.com/facebook/opaque-ke/blob/main/CHANGELOG.md#400-october-23-2025](https://github.com/facebook/opaque-ke/blob/main/CHANGELOG.md#400-october-23-2025) for more details.

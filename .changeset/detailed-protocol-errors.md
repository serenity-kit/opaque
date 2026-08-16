---
"@serenity-kit/opaque": patch
"@serenity-kit/opaque-p256": patch
---

Include more detail in protocol error messages. Previously distinct failures were collapsed into a generic `Internal error encountered`, and length mismatches rendered unsubstituted placeholders (``Invalid length for `name`: expected `len`, but is actually `actual_len`.``). Errors now carry the underlying cause, e.g. `LibraryError(OprfError(Deserialization))` and `SizeError { name: "mac", len: 64, actual_len: 0 }`. Note that the text of these messages has changed; do not match on it programmatically.

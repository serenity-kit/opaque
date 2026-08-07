# Building the native libraries

The .NET package is a thin wrapper around a Rust crate compiled to a C-ABI shared library. Rust
produces one binary per platform, so the NuGet package ships one per supported runtime identifier.
Those binaries are committed to this repository.

**You normally do not need to build these by hand.** CI does it:

- **`.github/workflows/build-and-test.yaml`** compiles all six and runs the full test suite against
  each one on a runner of that architecture. It gates every pull request into `main`, and holds the
  build matrix.
- **`.github/workflows/native-binaries.yaml`** runs on a merge to `main`. It reuses the matrix above
  via `workflow_call` rather than duplicating it, then opens a pull request containing any libraries
  that changed.

Reach for the manual steps below when you are debugging a build failure, testing a change to `src/`
before pushing, or bringing up a new target.

## Supported targets

| RID | Rust target | Cargo output | Committed to `.Net/OPAQUE.Net/` as |
| --- | --- | --- | --- |
| `linux-x64` | `x86_64-unknown-linux-gnu` | `libopaque.so` | `libopaque.so` |
| `linux-arm64` | `aarch64-unknown-linux-gnu` | `libopaque.so` | `libopaque-linux-arm64.so` |
| `win-x64` | `x86_64-pc-windows-msvc` | `opaque.dll` | `opaque.dll` |
| `win-arm64` | `aarch64-pc-windows-msvc` | `opaque.dll` | `opaque-arm64.dll` |
| `osx-x64` | `x86_64-apple-darwin` | `libopaque.dylib` | `libopaque-x64.dylib` |
| `osx-arm64` | `aarch64-apple-darwin` | `libopaque.dylib` | `libopaque.dylib` |

The two Linux libraries are built against a **glibc 2.17 floor**, so the package still installs on
older distributions (Debian 11/12, RHEL 8/9, Amazon Linux 2, Ubuntu 20.04). A plain native build
would link against whatever glibc the build machine happens to have and quietly drop all of them,
so use `cargo-zigbuild` with the `.2.17` target suffix as shown below. CI asserts the resulting
floor on every build.

Several targets emit the same file name, which is why four of them are stored under a disambiguated
name. `OPAQUE.Net.csproj` renames each one back to the name .NET's P/Invoke loader probes for, both
when packing into `runtimes/<rid>/native/` and when copying into the build output.

The toolchain version is pinned in `rust-toolchain.toml`. `rustup` picks it up automatically, so no
extra setup is needed — just make sure you are running the commands from the repository root.

## Building for the machine you are on

This is the common case and needs nothing beyond `rustup`:

```sh
cargo build --release --locked --target <rust target from the table>
```

The result lands in `target/<rust target>/release/`. Copy it over the matching committed file:

```sh
# example: macOS on Apple silicon
cargo build --release --locked --target aarch64-apple-darwin
cp target/aarch64-apple-darwin/release/libopaque.dylib .Net/OPAQUE.Net/libopaque.dylib
```

Then run the tests, which pick up the library for your host RID automatically:

```sh
dotnet test .Net/Test/Test.csproj --configuration Release
```

## Cross-compiling to the other targets

macOS targets can only be built on macOS (Apple's SDK is not redistributable). Windows and Linux
targets can be built from any host using [`cargo-zigbuild`](https://github.com/rust-cross/cargo-zigbuild),
which uses [Zig](https://ziglang.org/download/) as the cross-linker.

Install it once:

```sh
cargo install cargo-zigbuild
```

### Linux, from any host

Note the `.2.17` suffix — that is the glibc floor, and it is what CI builds with. Building these
targets without it produces a library tied to your machine's glibc.

```sh
rustup target add x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu
cargo zigbuild --release --locked --target x86_64-unknown-linux-gnu.2.17
cargo zigbuild --release --locked --target aarch64-unknown-linux-gnu.2.17
```

The glibc suffix does not change the output directory:

```
target/x86_64-unknown-linux-gnu/release/libopaque.so   -> .Net/OPAQUE.Net/libopaque.so
target/aarch64-unknown-linux-gnu/release/libopaque.so  -> .Net/OPAQUE.Net/libopaque-linux-arm64.so
```

Check what you produced with:

```sh
objdump -T target/x86_64-unknown-linux-gnu/release/libopaque.so \
  | grep -oE 'GLIBC_[0-9.]+' | sort -V -u | tail -1
# GLIBC_2.17 or lower
```

### Windows, from a non-Windows host

The MSVC targets need the Microsoft linker, so cross-compiling uses the GNU/LLVM targets instead:

```sh
rustup target add x86_64-pc-windows-gnu aarch64-pc-windows-gnullvm
cargo zigbuild --release --locked --target x86_64-pc-windows-gnu
cargo zigbuild --release --locked --target aarch64-pc-windows-gnullvm
```

```
target/x86_64-pc-windows-gnu/release/opaque.dll         -> .Net/OPAQUE.Net/opaque.dll
target/aarch64-pc-windows-gnullvm/release/opaque.dll    -> .Net/OPAQUE.Net/opaque-arm64.dll
```

Both link fine for P/Invoke, but CI builds the MSVC targets natively on Windows runners, so a
cross-built DLL will not be byte-identical to what ends up committed. Use these for local testing
and let CI produce the binaries that ship.

### macOS, on a Mac

An Apple silicon Mac can build both macOS targets; an Intel Mac can only build `x86_64-apple-darwin`.

```sh
rustup target add aarch64-apple-darwin x86_64-apple-darwin
cargo build --release --locked --target aarch64-apple-darwin
cargo build --release --locked --target x86_64-apple-darwin
```

```
target/aarch64-apple-darwin/release/libopaque.dylib -> .Net/OPAQUE.Net/libopaque.dylib
target/x86_64-apple-darwin/release/libopaque.dylib  -> .Net/OPAQUE.Net/libopaque-x64.dylib
```

## Checking what you built

`.Net/OPAQUE.Net/` holds six similar-looking files, and putting one in the wrong slot fails quietly
rather than loudly — `Helpers/FunctionHelper.TryExecute` swallows the load exception and the API just
returns `false`. Confirm the architecture before committing:

```sh
file .Net/OPAQUE.Net/libopaque-linux-arm64.so
# ELF 64-bit LSB shared object, ARM aarch64, ...
```

CI runs the equivalent check on every build.

## CI secrets

`native-binaries.yaml` needs a repository secret named **`CI_BINARIES_TOKEN`** to push the
`ci/native-binaries` branch and open its pull request. Create a fine-grained personal access token
scoped to this repository with:

- **Contents:** read and write
- **Pull requests:** read and write

The default `GITHUB_TOKEN` is deliberately not used for this. GitHub blocks pull requests authored
by `GITHUB_TOKEN` from triggering workflows, so the `Build and test` checks would never report on
the binaries PR and it could never satisfy a required-status-check rule on `main` — it would sit at
"Expected — waiting for status to be reported" forever.

Two consequences worth knowing:

- The token has an expiry. Once it lapses, `propose_binaries` starts failing; the job prints an
  explicit error if the secret is missing entirely.
- The commit author is still `github-actions[bot]`, but the *pusher* is whoever owns the token. A
  GitHub App installation token avoids that at the cost of more setup.

**Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"** must
also be enabled.

## Adding a new target

1. Add a row to the table above.
2. Add a `<None Update="...">` entry to `.Net/OPAQUE.Net/OPAQUE.Net.csproj` with the RID's
   `PackagePath`, plus the `Link`/`CopyToOutputDirectory` pair conditioned on `OpaqueHostRid`.
3. Add the file name to the `OpaqueNativeAsset` list in the same file, so packing fails if it goes
   missing.
4. Add a matrix entry to `.github/workflows/build-and-test.yaml`, the file name to the `libs` list in
   `.github/workflows/native-binaries.yaml`, and the expected path to the verification step in
   `.github/workflows/publish.yaml`.
5. Add the RID to the supported-platforms table in `README.md`.

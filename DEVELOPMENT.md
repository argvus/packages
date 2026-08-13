# Development

This repository is both the source for the packages project page and the storage location for published binary packages.

## Layout

```text
public/arch/$arch/  pacman databases and .pkg.tar.zst files
public/debian/      reserved for future .deb packages
public/rpm/         reserved for future .rpm packages
src/                Astro directory-index UI
```

## Local site development

```sh
npm ci
npm run dev
npm run build
```

The Astro build copies `public/` as-is, so files under `public/arch/x86_64/` are served at:

```text
https://argvus.github.io/packages/arch/x86_64/
```

## Package retention

Keep only the latest 3 versions of each Arch package in `public/arch/x86_64/`
to prevent the repository from growing indefinitely. The cleanup script groups
files by package name, sorts package versions, and removes older
`.pkg.tar.zst` files plus their matching `.sig` files.

Preview the cleanup:

```sh
npm run packages:prune
```

Apply the cleanup:

```sh
npm run packages:prune:apply
```

The script also accepts custom values:

```sh
node scripts/prune-arch-packages.mjs --keep 5 --dir public/arch/x86_64 --apply
```

Run this after adding new packages and before committing the updated repository.
If the publish workflow regenerates the pacman database with `repo-add`, run the
retention cleanup before that database step so `argvus.db*` and `argvus.files*`
only index retained packages.

## greetd

`argvus-greeter` ships the login UI and the packaged greetd example config.
Keep the packaged greetd command on:

```text
argvus-greeter-session
```

Direct `start-hyprland -- --config ...` or `Hyprland --config ...conf` starts
can leak compositor output to the VT and should remain legacy-only. Installed
systems must re-run `argvus-greeter-setup` after this packaged config changes
because `/etc/greetd/config.toml` is managed by the local machine.
The launcher must not assume greetd provides a writable `HOME`; use the
passwd home or a per-UID fallback when resolving runtime logs.

## Runtime Defaults

Keep app launchers aligned with the system-default configuration model. Apps
that do not read `/usr/share/argvus` through `XDG_CONFIG_DIRS`, such as Kitty,
must be launched with their resolved config path. Hyprlock lockscreen wallpaper
caches belong under `$XDG_CACHE_HOME/argvus/hypr`, not legacy `~/.cache/hypr`.

## GitHub Pages

Pages is configured as:

```text
Source: GitHub Actions
URL: https://argvus.github.io/packages/
```

Do not add a `CNAME` file. Argvus does not use a custom domain.

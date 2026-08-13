# Argvus Packages

Binary package repository for Argvus, published as a GitHub Pages project page at:

```text
https://argvus.github.io/packages/
```

The repository stores package files under `public/` and builds browsable indexes with Astro.

## Package Architecture

`argvus` contains the main Argvus desktop defaults under `/usr/share/argvus`
and `/usr/bin/argvus-setup`. The desktop no longer copies all packaged
dotfiles into `~/.config` on first login. Runtime config is resolved as:
`$XDG_CONFIG_HOME/<app>` first, then `/usr/share/argvus/<app>`.

Installing `argvus` also installs the official component packages:
`argvus-appearance`, `argvus-storage`, `argvus-session` and `argvus-greeter`.

Use `argvus-setup --copy <app>` or `argvus-setup --copy-all` only when you want
to create user-owned overrides for customization. Existing user configs remain
overrides by design; move an old `~/.config/hypr`, `~/.config/waybar`,
`~/.config/rofi`, or similar directory aside if you want to test the current
packaged defaults cleanly.

Theme state lives in `~/.config/argvus`; both TTY and greetd sessions read that
state so Float themes apply matching Hyprland gaps and Waybar margins.
Wallpaper assets are installed by `argvus-appearance` under
`/usr/share/backgrounds/argvus`. Runtime wallpaper logs are written per user
under `$XDG_CACHE_HOME/argvus/hypr`, not under `/tmp`, so multiple users can
start Argvus independently. The lockscreen wallpaper cache also lives under
`$XDG_CACHE_HOME/argvus/hypr`, and the packaged Hyprland terminal binding
launches Kitty with the resolved Argvus `kitty.conf` so clean users receive the
default terminal theme immediately.

`argvus-session` provides the session infrastructure:

- `/usr/bin/argvus-session`: official graphical-session entrypoint.
- `/usr/bin/argvus-start`: internal launcher for Hyprland with the Argvus configuration.
- `/usr/bin/argvus-tty`: TTY entrypoint and fallback.
- `/usr/share/wayland-sessions/argvus.desktop`: display-manager entry for Argvus.

`argvus-session` is a component package used by `argvus` and starts Hyprland
with the user `$XDG_CONFIG_HOME/hypr/hyprland.lua` only when that override
exists; otherwise it starts `/usr/share/argvus/hypr/hyprland.lua`. It also
resets `XDG_CURRENT_DESKTOP` to `Hyprland` so greetd's greeter identity does
not leak into the real session.

`argvus-greeter` provides the graphical greetd login UI. After installing it,
apply the packaged greetd configuration with:

```sh
sudo argvus-greeter-setup --enable
```

Use `--now` to restart `greetd.service` immediately after writing the config.
Current packages start the greeter through `argvus-greeter-session`, which
clears VT1, redirects greeter compositor logs to the greeter user's state
directory or a per-UID fallback under `/tmp`, and starts the packaged
`/etc/argvus/hyprland-argvus-greeter.lua` file. If `/etc/greetd/config.toml`
still points directly to
`start-hyprland -- --config ...` or `Hyprland --config ...`, re-run:

```sh
sudo argvus-greeter-setup --now
```

For optional TTY auto-start, source `/usr/share/argvus/argvus/profile`
or call `argvus-tty`. A manual `~/.zprofile` entry should use `argvus-tty`, not
an old or misspelled command, and should not run when a display manager is in
control.

## Arch Linux

```sh
curl -fsSLo /tmp/argvus.gpg https://argvus.github.io/packages/arch/argvus.gpg
sudo pacman-key --add /tmp/argvus.gpg
ARGVUS_KEY="$(gpg --show-keys --with-colons /tmp/argvus.gpg | grep '^pub:' | head -n1 | cut -d: -f5)"
sudo pacman-key --lsign-key "$ARGVUS_KEY"
```

```text
[argvus]
SigLevel = Required
Server = https://argvus.github.io/packages/arch/$arch
```

## Documentation

- Package index: https://argvus.github.io/packages/arch/
- Development workflow: [DEVELOPMENT.md](./DEVELOPMENT.md)
- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)

## Related repositories

- [`argvus-pkgbuild`](https://github.com/argvus/argvus-pkgbuild)
- [`argvus`](https://github.com/argvus/argvus)
- [`argvus-appearance`](https://github.com/argvus/argvus-appearance)
- [`argvus-greeter`](https://github.com/argvus/argvus-greeter)
- [`argvus-session`](https://github.com/argvus/argvus-session)
- [`argvus-storage`](https://github.com/argvus/argvus-storage)

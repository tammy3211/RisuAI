# Lua LSP Bridge

Small bridge for connecting Monaco's WebSocket JSON-RPC client to `lua-language-server` over stdio.

The bridge is attached automatically in:

- Vite dev server: `pnpm dev` / `pnpm tauri dev`
- Node self-host server: `pnpm runserver`

In both cases, use the same host and port as the app with this WebSocket path:

```txt
/lua-lsp
```

## Standalone Run

```bash
pnpm lua:lsp
```

The default endpoint is:

```txt
ws://localhost:6011/lua-lsp
```

Health check:

```txt
http://localhost:6011/health
```

## Options

```bash
pnpm lua:lsp -- --port 6011 --cmd lua-language-server
```

When `lua-language-server` is not on `PATH`, pass the executable path:

```bash
pnpm lua:lsp -- --cmd "C:\path\to\lua-language-server.exe"
```

You can also use environment variables:

```bash
LUA_LSP_PORT=6011
LUA_LANGUAGE_SERVER=lua-language-server
LUA_LANGUAGE_SERVER_CWD=.
LUA_LANGUAGE_SERVER_ARGS=
```

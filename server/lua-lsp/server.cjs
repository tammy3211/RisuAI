const http = require('http');
const { attachLuaLspWebSocket } = require('./bridge.cjs');

const DEFAULT_PORT = 6011;

function readArg(name, fallback) {
    const index = process.argv.indexOf(name);
    if (index >= 0 && process.argv[index + 1]) {
        return process.argv[index + 1];
    }
    return fallback;
}

function readServerArgs() {
    const separator = process.argv.indexOf('--');
    if (separator >= 0) {
        return process.argv.slice(separator + 1);
    }

    return undefined;
}

const port = Number(readArg('--port', process.env.LUA_LSP_PORT || DEFAULT_PORT));
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
    }

    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Use WebSocket endpoint /lua-lsp\n');
});

attachLuaLspWebSocket(server, {
    command: readArg('--cmd', process.env.LUA_LANGUAGE_SERVER),
    cwd: readArg('--cwd', process.env.LUA_LANGUAGE_SERVER_CWD || process.cwd()),
    args: readServerArgs(),
});

server.listen(port, () => {
    console.log(`[lua-lsp] Bridge listening on ws://localhost:${port}/lua-lsp`);
    console.log(`[lua-lsp] Health check: http://localhost:${port}/health`);
});

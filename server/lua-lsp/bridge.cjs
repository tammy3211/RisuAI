const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const DEFAULT_COMMAND = process.platform === 'win32' ? 'lua-language-server.exe' : 'lua-language-server';

function getBundledCommand() {
    const command = process.platform === 'win32' ? 'lua-language-server.exe' : 'lua-language-server';
    const bundledPath = path.join(process.cwd(), 'public', 'lua-language-server', 'bin', command);
    return existsSync(bundledPath) ? bundledPath : null;
}

function readServerArgs(options = {}) {
    if (Array.isArray(options.args)) {
        return options.args;
    }

    if (process.env.LUA_LANGUAGE_SERVER_ARGS) {
        return process.env.LUA_LANGUAGE_SERVER_ARGS.split(' ').filter(Boolean);
    }

    return [];
}

function encodeLspMessage(message) {
    const json = typeof message === 'string' ? message : JSON.stringify(message);
    const bytes = Buffer.byteLength(json, 'utf8');
    return `Content-Length: ${bytes}\r\n\r\n${json}`;
}

function createLspParser(onMessage) {
    let buffer = Buffer.alloc(0);

    return (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);

        while (true) {
            const headerEnd = buffer.indexOf('\r\n\r\n');
            if (headerEnd < 0) {
                return;
            }

            const header = buffer.slice(0, headerEnd).toString('ascii');
            const lengthMatch = /Content-Length:\s*(\d+)/i.exec(header);
            if (!lengthMatch) {
                buffer = buffer.slice(headerEnd + 4);
                continue;
            }

            const length = Number(lengthMatch[1]);
            const bodyStart = headerEnd + 4;
            const bodyEnd = bodyStart + length;

            if (buffer.length < bodyEnd) {
                return;
            }

            const body = buffer.slice(bodyStart, bodyEnd).toString('utf8');
            buffer = buffer.slice(bodyEnd);

            try {
                onMessage(JSON.parse(body));
            } catch (error) {
                console.error('[lua-lsp] Failed to parse LSP message:', error);
            }
        }
    };
}

function startLanguageServer(ws, options = {}) {
    const command = options.command || process.env.LUA_LANGUAGE_SERVER || getBundledCommand() || DEFAULT_COMMAND;
    const cwd = options.cwd || process.env.LUA_LANGUAGE_SERVER_CWD || process.cwd();
    const args = readServerArgs(options);
    const child = spawn(command, args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
    });

    const sendToClient = (message) => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(message));
        }
    };

    child.stdout.on('data', createLspParser(sendToClient));
    child.stderr.on('data', (chunk) => {
        process.stderr.write(`[lua-lsp stderr] ${chunk}`);
    });

    child.on('error', (error) => {
        console.error('[lua-lsp] Failed to start lua-language-server:', error);
        ws.close(1011, 'Failed to start lua-language-server');
    });

    child.on('exit', (code, signal) => {
        console.log(`[lua-lsp] lua-language-server exited code=${code} signal=${signal}`);
        if (ws.readyState === ws.OPEN) {
            ws.close(1011, 'lua-language-server exited');
        }
    });

    ws.on('message', (data) => {
        if (!child.stdin.writable) {
            return;
        }

        const text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
        child.stdin.write(encodeLspMessage(text));
    });

    ws.on('close', () => {
        child.kill();
    });

    ws.on('error', () => {
        child.kill();
    });

    console.log(`[lua-lsp] Connected client to ${command}${args.length ? ` ${args.join(' ')}` : ''}`);
}

function attachLuaLspWebSocket(server, options = {}) {
    const endpoint = options.endpoint || '/lua-lsp';
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        if (url.pathname !== endpoint) {
            return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', (ws) => {
        startLanguageServer(ws, options);
    });

    console.log(`[lua-lsp] Bridge attached at ${endpoint}`);
    return wss;
}

module.exports = {
    attachLuaLspWebSocket,
    startLanguageServer,
};

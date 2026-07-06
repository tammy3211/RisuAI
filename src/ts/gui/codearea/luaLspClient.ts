import * as monaco from 'monaco-editor';

type JsonRpcMessage = {
    id?: number | string;
    method?: string;
    params?: any;
    result?: any;
    error?: any;
};

type PendingRequest = {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
};

const luaSettings = {
    Lua: {
        runtime: {
            version: 'Lua 5.4',
        },
        workspace: {
            checkThirdParty: false,
            library: [
                'file:///risuai-lua-workspace/risuai-types.lua',
                'file:///risuai-lua-workspace/json.lua',
            ],
        },
        diagnostics: {
            globals: [
                'onOutput',
                'onInput',
                'onStart',
                'onButtonClick',
                'Promise',
                'throw',
            ],
        },
        telemetry: {
            enable: false,
        },
    },
};

let providerRegistered = false;
let client: LuaLspClient | null = null;
let nextLuaModelId = 1;

function getLuaLspUrl() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${location.host}/lua-lsp`;
}

function asLspPosition(position: monaco.Position) {
    return {
        line: position.lineNumber - 1,
        character: position.column - 1,
    };
}

function asMonacoRange(range: any) {
    return new monaco.Range(
        range.start.line + 1,
        range.start.character + 1,
        range.end.line + 1,
        range.end.character + 1
    );
}

function asMarkerSeverity(severity: number | undefined) {
    switch (severity) {
        case 1:
            return monaco.MarkerSeverity.Error;
        case 2:
            return monaco.MarkerSeverity.Warning;
        case 3:
            return monaco.MarkerSeverity.Info;
        case 4:
            return monaco.MarkerSeverity.Hint;
        default:
            return monaco.MarkerSeverity.Warning;
    }
}

function asCompletionKind(kind: number | undefined) {
    switch (kind) {
        case 2:
            return monaco.languages.CompletionItemKind.Method;
        case 3:
            return monaco.languages.CompletionItemKind.Function;
        case 4:
            return monaco.languages.CompletionItemKind.Constructor;
        case 5:
            return monaco.languages.CompletionItemKind.Field;
        case 6:
            return monaco.languages.CompletionItemKind.Variable;
        case 7:
            return monaco.languages.CompletionItemKind.Class;
        case 9:
            return monaco.languages.CompletionItemKind.Module;
        case 14:
            return monaco.languages.CompletionItemKind.Keyword;
        case 15:
            return monaco.languages.CompletionItemKind.Snippet;
        default:
            return monaco.languages.CompletionItemKind.Text;
    }
}

function asMarkdownString(value: any): string {
    if (!value) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(asMarkdownString).filter(Boolean).join('\n\n');
    }
    if (typeof value.value === 'string') {
        if (value.language) {
            return `\`\`\`${value.language}\n${value.value}\n\`\`\``;
        }
        return value.value;
    }
    return '';
}

function getTextEditRange(item: any, fallbackRange: monaco.Range) {
    const textEdit = item.textEdit || item.textEditText;
    if (textEdit?.range) {
        return asMonacoRange(textEdit.range);
    }
    return fallbackRange;
}

class LuaLspClient {
    private socket: WebSocket | null = null;
    private sequence = 1;
    private pending = new Map<number | string, PendingRequest>();
    private ready: Promise<void> | null = null;
    private initialized = false;
    private models = new Map<string, { model: monaco.editor.ITextModel; version: number }>();
    private libraryOpened = false;

    async start() {
        if (this.ready) {
            return this.ready;
        }

        this.ready = new Promise((resolve, reject) => {
            const socket = new WebSocket(getLuaLspUrl());
            this.socket = socket;

            socket.onopen = async () => {
                try {
                    await this.initialize();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            socket.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            socket.onerror = () => {
                reject(new Error('Lua LSP WebSocket connection failed'));
            };

            socket.onclose = () => {
                this.initialized = false;
                this.ready = null;
                for (const request of this.pending.values()) {
                    request.reject(new Error('Lua LSP WebSocket closed'));
                }
                this.pending.clear();
            };
        });

        return this.ready;
    }

    attachModel(model: monaco.editor.ITextModel) {
        const uri = model.uri.toString();
        const state = { model, version: 1 };
        this.models.set(uri, state);

        this.start().then(() => {
            if (!this.models.has(uri)) {
                return;
            }
            this.openLibraries();
            this.notify('textDocument/didOpen', {
                textDocument: {
                    uri,
                    languageId: 'lua',
                    version: state.version,
                    text: model.getValue(),
                },
            });
        }).catch((error) => {
            console.warn('[lua-lsp] Failed to attach model:', error);
        });

        let changeTimer: ReturnType<typeof setTimeout> | undefined;
        const changeDisposable = model.onDidChangeContent(() => {
            clearTimeout(changeTimer);
            changeTimer = setTimeout(() => {
                if (!this.initialized || !this.models.has(uri)) {
                    return;
                }
                state.version += 1;
                this.notify('textDocument/didChange', {
                    textDocument: {
                        uri,
                        version: state.version,
                    },
                    contentChanges: [{ text: model.getValue() }],
                });
            }, 150);
        });

        return {
            dispose: () => {
                clearTimeout(changeTimer);
                changeDisposable.dispose();
                this.models.delete(uri);
                monaco.editor.setModelMarkers(model, 'lua-lsp', []);
                if (this.initialized) {
                    this.notify('textDocument/didClose', {
                        textDocument: { uri },
                    });
                }
            },
        };
    }

    async completion(model: monaco.editor.ITextModel, position: monaco.Position) {
        await this.start();
        const result = await this.request('textDocument/completion', {
            textDocument: { uri: model.uri.toString() },
            position: asLspPosition(position),
            context: { triggerKind: 1 },
        });

        const items = Array.isArray(result) ? result : result?.items || [];
        const word = model.getWordUntilPosition(position);
        const fallbackRange = new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
        );

        return {
            suggestions: items.map((item: any) => {
                const insertText = item.textEdit?.newText || item.insertText || item.label;
                return {
                    label: item.label,
                    kind: asCompletionKind(item.kind),
                    detail: item.detail,
                    documentation: item.documentation ? { value: asMarkdownString(item.documentation) } : undefined,
                    insertText,
                    range: getTextEditRange(item, fallbackRange),
                    sortText: item.sortText,
                    filterText: item.filterText,
                    insertTextRules: item.insertTextFormat === 2
                        ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        : undefined,
                };
            }),
        };
    }

    async hover(model: monaco.editor.ITextModel, position: monaco.Position) {
        await this.start();
        const result = await this.request('textDocument/hover', {
            textDocument: { uri: model.uri.toString() },
            position: asLspPosition(position),
        });

        const value = asMarkdownString(result?.contents);
        if (!value) {
            return null;
        }

        return {
            range: result.range ? asMonacoRange(result.range) : undefined,
            contents: [{ value }],
        };
    }

    private async initialize() {
        if (this.initialized) {
            return;
        }

        await this.request('initialize', {
            processId: null,
            rootUri: 'file:///risuai-lua-workspace',
            capabilities: {
                textDocument: {
                    completion: {
                        completionItem: {
                            snippetSupport: true,
                            documentationFormat: ['markdown', 'plaintext'],
                        },
                    },
                    hover: {
                        contentFormat: ['markdown', 'plaintext'],
                    },
                    synchronization: {
                        didSave: false,
                        dynamicRegistration: false,
                    },
                },
                workspace: {
                    configuration: true,
                },
            },
            initializationOptions: luaSettings,
        });

        this.initialized = true;
        this.notify('initialized', {});
        this.notify('workspace/didChangeConfiguration', {
            settings: luaSettings,
        });
    }

    private async openLibraries() {
        if (this.libraryOpened) {
            return;
        }
        this.libraryOpened = true;

        await Promise.all([
            this.openLibraryFile('/lua/risuai-types.lua', 'file:///risuai-lua-workspace/risuai-types.lua'),
            this.openLibraryFile('/lua/json.lua', 'file:///risuai-lua-workspace/json.lua'),
        ]);
    }

    private async openLibraryFile(sourceUrl: string, uri: string) {
        try {
            const response = await fetch(sourceUrl);
            if (!response.ok) {
                return;
            }
            this.notify('textDocument/didOpen', {
                textDocument: {
                    uri,
                    languageId: 'lua',
                    version: 1,
                    text: await response.text(),
                },
            });
        } catch (error) {
            console.warn(`[lua-lsp] Failed to open Lua library ${sourceUrl}:`, error);
        }
    }

    private request(method: string, params?: any): Promise<any> {
        const id = this.sequence++;
        this.send({ jsonrpc: '2.0', id, method, params });
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
        });
    }

    private notify(method: string, params?: any) {
        this.send({ jsonrpc: '2.0', method, params });
    }

    private respond(id: number | string, result: any) {
        this.send({ jsonrpc: '2.0', id, result });
    }

    private send(message: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }

    private handleMessage(raw: string) {
        const message = JSON.parse(raw) as JsonRpcMessage;
        if (message.id !== undefined && !message.method) {
            const request = this.pending.get(message.id);
            if (!request) {
                return;
            }
            this.pending.delete(message.id);
            if (message.error) {
                request.reject(message.error);
            } else {
                request.resolve(message.result);
            }
            return;
        }

        if (message.id !== undefined && message.method) {
            this.handleServerRequest(message);
            return;
        }

        if (message.method === 'textDocument/publishDiagnostics') {
            this.handleDiagnostics(message.params);
        }
    }

    private handleServerRequest(message: JsonRpcMessage) {
        switch (message.method) {
            case 'workspace/configuration': {
                const items = message.params?.items || [];
                this.respond(message.id!, items.map(() => luaSettings.Lua));
                return;
            }
            case 'client/registerCapability':
            case 'client/unregisterCapability':
            case 'workspace/workspaceFolders': {
                this.respond(message.id!, null);
                return;
            }
            default: {
                this.respond(message.id!, null);
            }
        }
    }

    private handleDiagnostics(params: any) {
        const model = this.models.get(params?.uri)?.model;
        if (!model) {
            return;
        }

        const markers = (params.diagnostics || []).map((diagnostic: any) => ({
            severity: asMarkerSeverity(diagnostic.severity),
            message: diagnostic.message,
            source: diagnostic.source || 'lua-lsp',
            startLineNumber: diagnostic.range.start.line + 1,
            startColumn: diagnostic.range.start.character + 1,
            endLineNumber: diagnostic.range.end.line + 1,
            endColumn: diagnostic.range.end.character + 1,
        }));

        monaco.editor.setModelMarkers(model, 'lua-lsp', markers);
    }
}

export function createLuaModel(value: string) {
    return monaco.editor.createModel(
        value,
        'lua',
        monaco.Uri.parse(`file:///risuai-lua-workspace/script-${nextLuaModelId++}.lua`)
    );
}

export function registerLuaLsp(monacoEditor: typeof monaco) {
    if (!monacoEditor.languages.getLanguages().some((language) => language.id === 'lua')) {
        monacoEditor.languages.register({ id: 'lua', extensions: ['.lua'], aliases: ['Lua', 'lua'] });
    }

    if (providerRegistered) {
        return;
    }
    providerRegistered = true;

    const getClient = () => {
        client ??= new LuaLspClient();
        return client;
    };

    monacoEditor.languages.registerCompletionItemProvider('lua', {
        triggerCharacters: ['.', ':', '"', "'", '('],
        provideCompletionItems(model, position) {
            return getClient().completion(model, position);
        },
    });

    monacoEditor.languages.registerHoverProvider('lua', {
        provideHover(model, position) {
            return getClient().hover(model, position);
        },
    });
}

export function attachLuaLsp(model: monaco.editor.ITextModel) {
    client ??= new LuaLspClient();
    return client.attachModel(model);
}

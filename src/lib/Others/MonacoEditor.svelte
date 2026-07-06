<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as monaco from 'monaco-editor';
    import { registerCBSMonaco } from 'src/ts/gui/codearea/cbsMonaco';
    import { attachLuaLsp, createLuaModel, registerLuaLsp } from 'src/ts/gui/codearea/luaLspClient';
    import jsonWorkerUrl from 'monaco-editor/esm/vs/language/json/json.worker?url';
    import cssWorkerUrl from 'monaco-editor/esm/vs/language/css/css.worker?url';
    import htmlWorkerUrl from 'monaco-editor/esm/vs/language/html/html.worker?url';
    import tsWorkerUrl from 'monaco-editor/esm/vs/language/typescript/ts.worker?url';
    import editorWorkerUrl from 'monaco-editor/esm/vs/editor/editor.worker?url';

    // Set up workers once globally
    if (!('MonacoEnvironment' in self)) {
        (self as any).MonacoEnvironment = {
            getWorker(_: string, label: string) {
                switch (label) {
                    case 'json':
                        return new Worker(jsonWorkerUrl, { type: 'module' });
                    case 'css':
                    case 'scss':
                    case 'less':
                        return new Worker(cssWorkerUrl, { type: 'module' });
                    case 'html':
                    case 'handlebars':
                    case 'razor':
                        return new Worker(htmlWorkerUrl, { type: 'module' });
                    case 'typescript':
                    case 'javascript':
                        return new Worker(tsWorkerUrl, { type: 'module' });
                    default:
                        return new Worker(editorWorkerUrl, { type: 'module' });
                }
            }
        };
    }


    registerCBSMonaco()
    registerLuaLsp(monaco)

    interface Props {
        value: string;
        language?: string;
        theme?: string;
        readonly?: boolean;
        onchange?: (value: string) => void;
    }

    let {
        value = $bindable(''),
        language = 'markdown',
        theme = 'vs-dark',
        readonly = false,
        onchange,
    }: Props = $props();

    let container: HTMLDivElement;
    let editor: monaco.editor.IStandaloneCodeEditor;
    let model: monaco.editor.ITextModel;
    let luaLspDisposable: { dispose: () => void } | undefined;
    let disposed = false;

    function cleanup() {
        if (disposed) {
            return;
        }
        disposed = true;
        luaLspDisposable?.dispose();
        editor?.dispose();
        model?.dispose();
    }

    onMount(() => {
        model = language === 'lua'
            ? createLuaModel(value)
            : monaco.editor.createModel(value, language);

        editor = monaco.editor.create(container, {
            model,
            theme,
            readOnly: readonly,
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            padding: { top: 8, bottom: 8 },
            renderLineHighlight: 'gutter',
            overviewRulerBorder: false,
            scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
            },
        });

        if (language === 'lua') {
            luaLspDisposable = attachLuaLsp(model);
        }

        editor.onDidChangeModelContent(() => {
            const newValue = editor.getValue();
            value = newValue;
            onchange?.(newValue);
        });

        return () => {
            cleanup();
        };
    });

    onDestroy(() => {
        cleanup();
    });

    // Sync external value changes into editor without triggering onDidChangeModelContent loop
    $effect(() => {
        if (editor && editor.getValue() !== value) {
            const model = editor.getModel();
            if (model) {
                model.pushEditOperations(
                    [],
                    [{ range: model.getFullModelRange(), text: value }],
                    () => null
                );
            }
        }
    });
</script>

<div bind:this={container} class="w-full h-full"></div>

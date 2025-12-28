import { writable } from "svelte/store";
import type { character } from "./storage/database.svelte";

export const currentSaveFolderBot = writable<{
    character: character,
    folderName: string,
    isDirty: boolean,
    sourceMap: Record<string, string>
} | null>(null)
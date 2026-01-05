/**
 * Lua 모듈 레지스트리 - 표준 라이브러리와 커스텀 모듈 관리
 */
export class ModuleRegistry {
    private modules = new Map<string, string>();
    private loadPromises = new Map<string, Promise<string>>();
    private standardModules = ['json']; // 확장 가능

    /**
     * 표준 모듈들을 사전 로드
     */
    async preloadStandardModules(): Promise<void> {
        const loadPromises = this.standardModules.map(name => 
            this.loadModuleFromPath(name, `/lua/${name}.lua`)
        );
        
        await Promise.all(loadPromises);
    }

    /**
     * 파일 경로에서 모듈 로드
     */
    private async loadModuleFromPath(name: string, path: string): Promise<void> {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                console.warn(`Failed to load module '${name}' from ${path}`);
                return;
            }
            
            const code = await response.text();
            this.registerModule(name, code);
        } catch (error) {
            console.error(`Error loading module '${name}':`, error);
        }
    }

    /**
     * 모듈 등록
     */
    registerModule(name: string, code: string): void {
        this.modules.set(name, code);
    }

    /**
     * 여러 모듈 일괄 등록
     */
    registerModules(modules: Record<string, string>): void {
        for (const [name, code] of Object.entries(modules)) {
            this.registerModule(name, code);
        }
    }

    /**
     * 모듈 가져오기
     */
    getModule(name: string): string | null {
        return this.modules.get(name) ?? null;
    }

    /**
     * 모듈 존재 확인
     */
    hasModule(name: string): boolean {
        return this.modules.has(name);
    }

    /**
     * 여러 모듈 한번에 가져오기
     */
    getModules(names: string[]): Record<string, string> {
        const result: Record<string, string> = {};
        
        for (const name of names) {
            const code = this.modules.get(name);
            if (code) {
                result[name] = code;
            }
        }
        
        return result;
    }

    /**
     * 등록된 모든 모듈 이름 반환
     */
    getModuleNames(): string[] {
        return Array.from(this.modules.keys());
    }

    /**
     * 모듈 제거
     */
    removeModule(name: string): boolean {
        return this.modules.delete(name);
    }

    /**
     * 모든 모듈 초기화
     */
    clear(): void {
        this.modules.clear();
        this.loadPromises.clear();
    }

    /**
     * 통계 정보
     */
    getStats() {
        return {
            totalModules: this.modules.size,
            standardModules: this.standardModules.length,
            customModules: this.modules.size - this.standardModules.filter(name => 
                this.modules.has(name)
            ).length,
            moduleNames: this.getModuleNames()
        };
    }
}

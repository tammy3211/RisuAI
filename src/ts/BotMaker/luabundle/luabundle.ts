import { ModuleRegistry } from './luaModules';
import { BundleCache } from './luaBundleCache';

export interface LuaBundleOptions {
    code: string;
    customModules?: Record<string, string>;
    enableCache?: boolean;
    preloadedModules?: string[];
}

export interface BundleResult {
    bundled: string;
    modules: string[];
    fromCache: boolean;
}

/**
 * Lua 5.4 호환 번들러
 * - 실시간 번들링 최적화
 * - 의존성 자동 분석
 * - 캐싱 시스템
 */
export class LuaBundler {
    private moduleRegistry: ModuleRegistry;
    private bundleCache: BundleCache;
    private initialized = false;

    constructor() {
        this.moduleRegistry = new ModuleRegistry();
        this.bundleCache = new BundleCache();
    }

    /**
     * 번들러 초기화 (표준 모듈 로드)
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;
        
        await this.moduleRegistry.preloadStandardModules();
        this.initialized = true;
    }

    /**
     * 코드에서 require 호출 찾기
     */
    private analyzeDependencies(code: string): string[] {
        const requires = new Set<string>();
        
        // 다양한 require 패턴 매칭
        const patterns = [
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,  // require("module")
            /require\s*\(\s*'([^']+)'\s*\)/g,         // require('module')
            /require\s*['"]([^'"]+)['"]/g,            // require 'module'
            /require\s*'([^']+)'/g,                   // require'module'
        ];
        
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                requires.add(match[1]);
            }
        }
        
        return Array.from(requires);
    }

    /**
     * 코드 들여쓰기
     */
    private indent(code: string, spaces: number): string {
        const indentation = ' '.repeat(spaces);
        return code.split('\n').map(line => 
            line.trim() ? indentation + line : line
        ).join('\n');
    }

    /**
     * 번들 코드 생성
     */
    private generateBundleCode(
        userCode: string,
        modules: Record<string, string>
    ): string {
        const moduleEntries = Object.entries(modules);
        
        // 모듈이 없으면 그냥 반환
        if (moduleEntries.length === 0) {
            return userCode;
        }

        const moduleDefs = moduleEntries
            .map(([name, code]) => {
                // 모듈이 이미 return을 포함하는지 확인
                const hasReturn = /\breturn\b/.test(code);
                const wrappedCode = hasReturn ? code : `${code}\nreturn ${this.extractModuleName(code)}`;
                
                return `  __modules['${name}'] = function()
${this.indent(wrappedCode, 4)}
  end`;
            })
            .join('\n\n');

        return `do
  local __modules = {}
  local __loaded = {}
  
  local function require(name)
    if __loaded[name] ~= nil then
      return __loaded[name]
    end
    
    local mod = __modules[name]
    if not mod then
      error("module '" .. name .. "' not found")
    end
    
    local result = mod()
    if result == nil then
      result = true
    end
    __loaded[name] = result
    return result
  end

${moduleDefs}

  -- User code
${this.indent(userCode, 2)}
end`;
    }

    /**
     * 모듈 코드에서 메인 변수명 추출 (예: json, utils 등)
     */
    private extractModuleName(code: string): string {
        // local moduleName = {...} 패턴 찾기
        const match = code.match(/local\s+(\w+)\s*=/);
        return match ? match[1] : 'module';
    }

    /**
     * 재귀적으로 의존성 해결
     */
    private resolveDependencies(
        deps: string[],
        modules: Record<string, string>,
        resolved = new Set<string>()
    ): string[] {
        for (const dep of deps) {
            if (resolved.has(dep)) continue;
            
            const modCode = modules[dep];
            if (!modCode) continue;
            
            resolved.add(dep);
            
            // 모듈 내부의 의존성도 분석
            const nestedDeps = this.analyzeDependencies(modCode);
            this.resolveDependencies(nestedDeps, modules, resolved);
        }
        
        return Array.from(resolved);
    }

    /**
     * 메인 번들링 함수
     */
    async bundle(options: LuaBundleOptions): Promise<BundleResult> {
        const { 
            code, 
            customModules = {}, 
            enableCache = true,
            preloadedModules = []
        } = options;

        // 초기화 확인
        if (!this.initialized) {
            await this.initialize();
        }

        // 커스텀 모듈 등록
        if (Object.keys(customModules).length > 0) {
            this.moduleRegistry.registerModules(customModules);
        }

        // 1. 의존성 분석
        const directDeps = this.analyzeDependencies(code);
        
        // 2. 필요한 모듈 수집
        const availableModules = this.moduleRegistry.getModules([
            ...directDeps,
            ...preloadedModules
        ]);
        
        // 3. 재귀적으로 의존성 해결
        const allDeps = this.resolveDependencies(
            directDeps, 
            availableModules
        );
        
        // 4. 캐시 확인
        if (enableCache) {
            const cached = this.bundleCache.get(code, allDeps);
            if (cached) {
                return { 
                    bundled: cached, 
                    modules: allDeps, 
                    fromCache: true 
                };
            }
        }
        
        // 5. 번들 생성
        const bundledModules = this.moduleRegistry.getModules(allDeps);
        const bundled = this.generateBundleCode(code, bundledModules);
        
        // 6. 캐시 저장
        if (enableCache) {
            this.bundleCache.set(code, allDeps, bundled);
        }
        
        return { 
            bundled, 
            modules: allDeps, 
            fromCache: false 
        };
    }

    /**
     * 모듈 사전 로드
     */
    async preloadModules(modules: Record<string, string>): Promise<void> {
        this.moduleRegistry.registerModules(modules);
    }

    /**
     * 캐시 초기화
     */
    clearCache(): void {
        this.bundleCache.clear();
    }

    /**
     * 통계 정보
     */
    getStats() {
        return {
            cache: this.bundleCache.getStats(),
            modules: this.moduleRegistry.getStats()
        };
    }
}

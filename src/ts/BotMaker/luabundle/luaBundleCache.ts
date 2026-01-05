/**
 * LRU 캐시로 번들 결과를 저장하여 반복적인 번들링 방지
 */
export class BundleCache {
    private cache = new Map<string, { bundled: string; timestamp: number }>();
    private maxSize: number;
    private hits = 0;
    private misses = 0;

    constructor(maxSize = 100) {
        this.maxSize = maxSize;
    }

    /**
     * 캐시 키 생성 (코드 + 모듈 목록 해시)
     */
    private getCacheKey(code: string, modules: string[]): string {
        const moduleStr = modules.sort().join(',');
        return `${this.simpleHash(code)}_${this.simpleHash(moduleStr)}`;
    }

    /**
     * 간단한 해시 함수
     */
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32비트 정수로 변환
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * 캐시 조회
     */
    get(code: string, modules: string[]): string | null {
        const key = this.getCacheKey(code, modules);
        const cached = this.cache.get(key);
        
        if (cached) {
            this.hits++;
            // 접근 시간 갱신 (LRU)
            cached.timestamp = Date.now();
            this.cache.delete(key);
            this.cache.set(key, cached);
            return cached.bundled;
        }
        
        this.misses++;
        return null;
    }

    /**
     * 캐시 저장
     */
    set(code: string, modules: string[], bundled: string): void {
        const key = this.getCacheKey(code, modules);
        
        // 캐시 크기 초과시 가장 오래된 항목 제거
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        
        this.cache.set(key, {
            bundled,
            timestamp: Date.now()
        });
    }

    /**
     * 캐시 초기화
     */
    clear(): void {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * 캐시 통계
     */
    getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? (this.hits / total * 100).toFixed(2) : '0.00';
        
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: `${hitRate}%`
        };
    }
}

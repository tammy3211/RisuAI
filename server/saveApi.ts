import fs from 'fs-extra';
import path from 'path';
import type { Connect } from 'vite';

const SAVE_DIR = path.resolve(process.cwd(), 'save');

/**
 * Save 폴더 API 핸들러
 */
export function createSaveApiHandler(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url;
    
    console.log('[SaveAPI] Request URL:', url);
    
    // API 경로가 아니면 다음 핸들러로
    if (!url?.startsWith('/api/save')) {
      return next();
    }

    // Query String 제거
    const pathname = url.split('?')[0];

    console.log('[SaveAPI] Handling request:', pathname);

    try {
      // PUT /api/save/:folder/character.json - 캐릭터 저장
      if (req.method === 'PUT' && pathname.match(/^\/api\/save\/[^/]+\/character\.json$/)) {
        const match = pathname.match(/^\/api\/save\/([^/]+)\/character\.json$/);
        if (match) {
          const folderName = match[1];
          const filePath = path.join(SAVE_DIR, folderName, 'character.json');
          
          // 보안 체크
          if (!filePath.startsWith(SAVE_DIR)) {
            res.statusCode = 403;
            res.end('Access denied');
            return;
          }

          // Body 읽기
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = Buffer.concat(chunks).toString();
          
          // JSON 파싱 확인
          try {
            JSON.parse(body);
          } catch (e) {
            res.statusCode = 400;
            res.end('Invalid JSON');
            return;
          }

          await fs.writeFile(filePath, body, 'utf-8');
          console.log('[SaveAPI] Saved character.json for:', folderName);
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }

      // GET /api/save/list - 폴더 목록
      if (pathname === '/api/save/list') {
        console.log('[SaveAPI] Listing folders from:', SAVE_DIR);
        
        // save 폴더가 존재하는지 확인
        if (!(await fs.pathExists(SAVE_DIR))) {
          console.warn('[SaveAPI] Save directory does not exist:', SAVE_DIR);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ folders: [] }));
          return;
        }
        
        const folders = await fs.readdir(SAVE_DIR);
        console.log('[SaveAPI] Found items in save dir:', folders);
        const botFolders = [];
        
        for (const folder of folders) {
          const folderPath = path.join(SAVE_DIR, folder);
          const stat = await fs.stat(folderPath);
          
          if (stat.isDirectory()) {
            const charJsonPath = path.join(folderPath, 'character.json');
            const exists = await fs.pathExists(charJsonPath);
            console.log('[SaveAPI] Checking folder:', folder, 'has character.json:', exists);
            if (exists) {
              botFolders.push(folder);
            }
          }
        }
        
        console.log('[SaveAPI] Returning bot folders:', botFolders);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ folders: botFolders }));
        return;
      }

      // GET /api/save/:folderName/mtime - 폴더 최종 수정 시간 조회
      const mtimeMatch = pathname.match(/^\/api\/save\/([^/]+)\/mtime$/);
      if (mtimeMatch && req.method === 'GET') {
        const folderName = decodeURIComponent(mtimeMatch[1]);
        const folderPath = path.join(SAVE_DIR, folderName);
        
        if (!(await fs.pathExists(folderPath))) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Folder not found' }));
          return;
        }
        
        // 폴더 내 모든 파일의 최신 mtime 찾기
        async function getLatestMtime(dir: string): Promise<number> {
          let latestMtime = 0;
          
          const items = await fs.readdir(dir, { withFileTypes: true });
          
          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            const stat = await fs.stat(fullPath);
            
            if (item.isDirectory()) {
              const subMtime = await getLatestMtime(fullPath);
              latestMtime = Math.max(latestMtime, subMtime);
            } else {
              latestMtime = Math.max(latestMtime, stat.mtimeMs);
            }
          }
          
          return latestMtime;
        }
        
        const mtime = await getLatestMtime(folderPath);
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ mtime }));
        return;
      }

      // GET /api/save/:folderName/character.json
      const characterJsonMatch = pathname.match(/^\/api\/save\/([^/]+)\/character\.json$/);
      if (characterJsonMatch && req.method === 'GET') {
        const folderName = decodeURIComponent(characterJsonMatch[1]);
        const filePath = path.join(SAVE_DIR, folderName, 'character.json');
        
        if (!(await fs.pathExists(filePath))) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'File not found' }));
          return;
        }
        
        const content = await fs.readFile(filePath, 'utf-8');
        res.setHeader('Content-Type', 'application/json');
        res.end(content);
        return;
      }

      // GET /api/save/:folderName/file/* - 임의 파일 읽기
      const fileMatch = pathname.match(/^\/api\/save\/([^/]+)\/file\/(.+)$/);
      if (fileMatch && req.method === 'GET') {
        const folderName = decodeURIComponent(fileMatch[1]);
        const filePath = decodeURIComponent(fileMatch[2]);
        const fullPath = path.join(SAVE_DIR, folderName, filePath);
        
        // 보안: SAVE_DIR 밖으로 나가는 경로 차단
        if (!fullPath.startsWith(SAVE_DIR)) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'Access denied' }));
          return;
        }
        
        if (!(await fs.pathExists(fullPath))) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'File not found' }));
          return;
        }
        
        const content = await fs.readFile(fullPath);
        
        // Content-Type 설정
        const ext = path.extname(fullPath).toLowerCase();
        let contentType = 'application/octet-stream';
        
        const mimeTypes: Record<string, string> = {
          '.json': 'application/json',
          '.md': 'text/markdown',
          '.txt': 'text/plain',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'text/javascript'
        };

        if (mimeTypes[ext]) {
          contentType = mimeTypes[ext];
        }
        
        res.setHeader('Content-Type', contentType);
        res.end(content);
        return;
      }

      // POST /api/save/:folderName/file/* - 임의 파일 쓰기 (텍스트/바이너리 모두 지원)
      if (fileMatch && req.method === 'POST') {
        const folderName = decodeURIComponent(fileMatch[1]);
        const filePath = decodeURIComponent(fileMatch[2]);
        const fullPath = path.join(SAVE_DIR, folderName, filePath);
        
        // 보안: SAVE_DIR 밖으로 나가는 경로 차단
        if (!fullPath.startsWith(SAVE_DIR)) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'Access denied' }));
          return;
        }

        // 폴더가 없으면 생성
        await fs.ensureDir(path.dirname(fullPath));

        // Body 읽기 (바이너리로)
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const body = Buffer.concat(chunks);

        // Content-Type 확인하여 텍스트/바이너리 판단
        const contentType = req.headers['content-type'] || '';
        
        if (contentType.includes('text/') || contentType.includes('application/json')) {
          // 텍스트로 저장
          await fs.writeFile(fullPath, body.toString('utf-8'), 'utf-8');
        } else {
          // 바이너리로 저장
          await fs.writeFile(fullPath, body);
        }
        
        console.log('[SaveAPI] Saved file:', fullPath, 'size:', body.length, 'bytes');
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // POST /api/save/:folderName/character.json - character.json 쓰기
      if (characterJsonMatch && req.method === 'POST') {
        const folderName = decodeURIComponent(characterJsonMatch[1]);
        const filePath = path.join(SAVE_DIR, folderName, 'character.json');
        
        // 폴더가 없으면 생성
        await fs.ensureDir(path.dirname(filePath));
        
        // 요청 본문 읽기
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            // JSON 검증
            JSON.parse(body);
            
            // 파일 쓰기
            await fs.writeFile(filePath, body, 'utf-8');
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }

      // 지원하지 않는 경로
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
      
    } catch (error) {
      console.error('[SaveAPI] Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  };
}

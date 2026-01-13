#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 재현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CLI 인자 파싱 ====================
const options = {
  input: {
    type: 'string',
    short: 'i',
    description: 'Input JSON file path (relative to save/)'
  },
  threshold: {
    type: 'string',
    short: 't',
    default: '100',
    description: 'Minimum character length to split (default: 100)'
  },
  output: {
    type: 'string',
    short: 'o',
    description: 'Output directory (default: auto-detect based on type)'
  },
  backup: {
    type: 'boolean',
    short: 'b',
    default: true,
    description: 'Create backup file (default: true)'
  },
  'dry-run': {
    type: 'boolean',
    short: 'd',
    default: false,
    description: 'Dry-run mode (preview only, no files created)'
  },
  help: {
    type: 'boolean',
    short: 'h',
    description: 'Show help'
  }
};

let args;
try {
  const parsed = parseArgs({ options, allowPositionals: false });
  args = parsed.values;
} catch (error) {
  console.error(`❌ Error parsing arguments: ${error.message}`);
  showHelp();
  process.exit(1);
}

// Help 출력
if (args.help) {
  showHelp();
  process.exit(0);
}

function showHelp() {
  console.log(`
📝 JSON Content Splitter

Usage:
  node .tool/split-json-content.js --input <path> [options]

Options:
  -i, --input <path>       Input JSON file path (required)
                          Example: save/char1/lorebook.json
  
  -t, --threshold <num>    Minimum character length to split (default: 100)
  
  -o, --output <path>      Output directory (default: auto-detect)
                          - lorebook: save/{folder}/content/lorebook
                          - customscript: save/{folder}/scripts/customscript
  
  -b, --backup            Create backup file (default: true)
      --no-backup         Don't create backup file
  
  -d, --dry-run           Dry-run mode (preview only)
  
  -h, --help              Show this help

Examples:
  # Process lorebook.json (auto-detects output to content/lorebook/)
  node .tool/split-json-content.js -i save/char1/lorebook.json
  
  # Process with custom threshold
  node .tool/split-json-content.js -i save/char1/lorebook.json -t 200
  
  # Dry-run to preview changes
  node .tool/split-json-content.js -i save/char1/lorebook.json --dry-run

Security:
  ⚠️  Only files within save/ directory can be processed
  ⚠️  Path traversal attempts will be blocked
`);
}

// ==================== 설정 검증 ====================
if (!args.input) {
  console.error('❌ Error: --input argument is required\n');
  showHelp();
  process.exit(1);
}

const threshold = parseInt(args.threshold, 10);
if (isNaN(threshold) || threshold < 0) {
  console.error('❌ Error: --threshold must be a positive number\n');
  process.exit(1);
}

const dryRun = args['dry-run'];
const createBackup = args.backup;

// ==================== 보안: 경로 검증 ====================
const TOOL_DIR = __dirname;
const SAVE_DIR = path.resolve(TOOL_DIR, '..', 'save');

function validatePath(filePath, description) {
  const absolutePath = path.resolve(TOOL_DIR, '..', filePath);
  
  if (!absolutePath.startsWith(SAVE_DIR)) {
    console.error(`❌ Security Error: ${description} must be within save/ directory`);
    console.error(`   Attempted path: ${filePath}`);
    console.error(`   Resolved path: ${absolutePath}`);
    console.error(`   Allowed base: ${SAVE_DIR}`);
    process.exit(1);
  }
  
  return absolutePath;
}

const inputPath = validatePath(args.input, 'Input file');

// 출력 경로 결정
let outputDir;
if (args.output) {
  outputDir = validatePath(args.output, 'Output directory');
} else {
  if (fs.existsSync(inputPath)) {
    try {
      const content = fs.readFileSync(inputPath, 'utf-8');
      const jsonData = JSON.parse(content);
      
      if (jsonData.type === 'risu') {
        const baseDir = path.dirname(inputPath);
        outputDir = path.join(baseDir, 'content', 'lorebook');
      } else if (jsonData.type === 'regex') {
        const baseDir = path.dirname(inputPath);
        outputDir = path.join(baseDir, 'scripts', 'customscript');
      } else {
        outputDir = path.dirname(inputPath);
      }
    } catch (error) {
      outputDir = path.dirname(inputPath);
    }
  } else {
    outputDir = path.dirname(inputPath);
  }
}

// ==================== 파일명 생성 함수 ====================
function sanitizeFileName(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

function generateFileName(item, index, type, outputBase, inputFileDir, usedNames) {
  if (type === 'lorebook') {
    let baseName = item.comment || item.key || `entry-${index}`;
    
    baseName = baseName.split(',')[0].trim();
    baseName = baseName.replace(/^-+\s*/, '').replace(/\s*-+$/, '');
    baseName = baseName.replace(/[🛠️🌐🏛️👥📍⚙️🔧]/g, '').trim();
    
    const sanitized = sanitizeFileName(baseName);
    let fileName = `${sanitized || `entry-${index}`}.md`;
    
    const baseFileName = fileName.replace('.md', '');
    let finalFileName = fileName;
    let counter = 1;
    
    while (usedNames.has(finalFileName)) {
      finalFileName = `${baseFileName}(${counter}).md`;
      counter++;
    }
    
    usedNames.add(finalFileName);
    
    const relativePath = path.relative(inputFileDir, outputBase);
    if (relativePath) {
      return path.join(relativePath, finalFileName).replace(/\\/g, '/');
    }
    return finalFileName;
    
  } else if (type === 'customscript') {
    const scriptType = item.type || 'script';
    const sanitized = sanitizeFileName(scriptType);
    
    let fileName = `${sanitized}-${index}.md`;
    
    const baseFileName = fileName.replace('.md', '');
    let finalFileName = fileName;
    let counter = 1;
    
    while (usedNames.has(finalFileName)) {
      finalFileName = `${baseFileName}(${counter}).md`;
      counter++;
    }
    
    usedNames.add(finalFileName);
    
    const relativePath = path.relative(inputFileDir, outputBase);
    if (relativePath) {
      return path.join(relativePath, finalFileName).replace(/\\/g, '/');
    }
    return finalFileName;
  }
  
  return `content/item-${index}.md`;
}

// ==================== 파일 처리 함수 ====================
function processFile(filePath, outputBase) {
  console.log(`\n📄 Processing: ${path.relative(TOOL_DIR, filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }
  
  let jsonData;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    jsonData = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error: Failed to parse JSON: ${error.message}`);
    process.exit(1);
  }
  
  let type;
  if (jsonData.type === 'risu') {
    type = 'lorebook';
    console.log(`   Type: Lorebook (risu)`);
  } else if (jsonData.type === 'regex') {
    type = 'customscript';
    console.log(`   Type: Custom Script (regex)`);
  } else {
    console.error(`❌ Error: Unknown or unsupported type: "${jsonData.type}"`);
    console.error(`   Expected "risu" (lorebook) or "regex" (customscript)`);
    process.exit(1);
  }
  
  if (!Array.isArray(jsonData.data)) {
    console.error(`❌ Error: No data array found in JSON`);
    process.exit(1);
  }
  
  console.log(`   Items: ${jsonData.data.length}`);
  console.log(`   Threshold: ${threshold} characters`);
  console.log(`   Output directory: ${path.relative(TOOL_DIR, outputBase)}`);
  
  const inputFileDir = path.dirname(filePath);
  
  let processedCount = 0;
  let skippedRef = 0;
  let skippedShort = 0;
  const createdFiles = [];
  const usedNames = new Set();
  
  for (let i = 0; i < jsonData.data.length; i++) {
    const item = jsonData.data[i];
    
    const fieldName = type === 'lorebook' ? 'content' : 'out';
    const value = item[fieldName];
    
    if (value && typeof value === 'object' && value.$ref) {
      skippedRef++;
      continue;
    }
    
    if (typeof value !== 'string') {
      continue;
    }
    
    if (value.length < threshold) {
      skippedShort++;
      continue;
    }
    
    const fileName = generateFileName(item, i, type, outputBase, inputFileDir, usedNames);
    const fullPath = path.join(outputBase, path.basename(fileName));
    
    if (!fullPath.startsWith(SAVE_DIR)) {
      console.error(`❌ Security Error: Generated path outside save/ directory`);
      console.error(`   Generated path: ${fullPath}`);
      process.exit(1);
    }
    
    if (!dryRun) {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, value, 'utf-8');
    }
    
    item[fieldName] = { "$ref": fileName };
    
    processedCount++;
    createdFiles.push({ 
      path: fileName, 
      size: value.length,
      fullPath: path.relative(TOOL_DIR, fullPath)
    });
  }
  
  console.log(`\n📊 Statistics:`);
  console.log(`   Total items: ${jsonData.data.length}`);
  console.log(`   Processed: ${processedCount}`);
  console.log(`   Skipped (already $ref): ${skippedRef}`);
  console.log(`   Skipped (below threshold): ${skippedShort}`);
  
  if (createdFiles.length > 0) {
    console.log(`\n📁 Files to create:`);
    createdFiles.forEach(f => {
      console.log(`   ✓ ${f.fullPath} (${f.size} chars)`);
    });
  }
  
  if (processedCount === 0) {
    console.log(`\n✨ No changes needed!`);
    return;
  }
  
  if (dryRun) {
    console.log(`\n⚠️  DRY-RUN MODE: No files were actually created`);
    console.log(`   Remove --dry-run flag to apply changes`);
    return;
  }
  
  if (createBackup) {
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    console.log(`\n💾 Backup created: ${path.relative(TOOL_DIR, backupPath)}`);
  }
  
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`✅ Updated: ${path.relative(TOOL_DIR, filePath)}`);
  
  console.log(`\n✨ Done!`);
}

// ==================== 메인 실행 ====================
console.log('🚀 JSON Content Splitter\n');
console.log(`   Tool directory: ${TOOL_DIR}`);
console.log(`   Save directory: ${SAVE_DIR}`);

try {
  processFile(inputPath, outputDir);
} catch (error) {
  console.error(`\n❌ Fatal Error: ${error.message}`);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Design System Compliance Scanner - Phase 8
 * 
 * Scans codebase for violations of the global design system (Phases 0-7)
 * Run with: node scripts/design-system-check.ts
 * Or: npx tsx scripts/design-system-check.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Violation {
  file: string;
  line: number;
  type: string;
  content: string;
}

const violations: Violation[] = [];

// Patterns to detect
const VIOLATION_PATTERNS = {
  directHexColor: /(?:bg|text|border)-\[#[0-9a-fA-F]{3,8}\]/g,
  directRgbaColor: /(?:bg|text|border)-\[rgba?\([^)]+\)\]/g,
  pixelFontSize: /text-\[\d+px\]/g,
  tailwindSizes: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)(?!\-)/g,
  arbitrarySpacing: /(?:mt|mb|pt|pb|px|py|gap|space-[xy])-\[\d+px\]/g,
  arbitraryDuration: /duration-\[\d+m?s\]/g,
  inlineStyle: /<[^>]+\sstyle=["']/g,
};

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip Hub and Clubhouse files (they have their own dark theme tokens)
    if (filePath.includes('/hub/') || filePath.includes('/clubhouse/')) {
      return;
    }

    Object.entries(VIOLATION_PATTERNS).forEach(([type, pattern]) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            file: filePath,
            line: index + 1,
            type,
            content: match,
          });
        });
      }
    });
  });
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('build')) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else if (/\.(tsx?|jsx?)$/.test(file) && !/\.(test|spec)\.(tsx?|jsx?)$/.test(file)) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function run() {
  console.log('🔍 Scanning codebase for design system violations...\n');

  // Scan all TSX/TS files
  const files = getAllFiles('src');

  files.forEach(scanFile);

  // Report results
  console.log(`📊 Scanned ${files.length} files\n`);

  if (violations.length === 0) {
    console.log('✅ No design system violations found!\n');
    process.exit(0);
  }

  console.log(`❌ Found ${violations.length} violations:\n`);

  // Group by type
  const byType: Record<string, Violation[]> = {};
  violations.forEach(v => {
    if (!byType[v.type]) byType[v.type] = [];
    byType[v.type].push(v);
  });

  Object.entries(byType).forEach(([type, items]) => {
    console.log(`\n📌 ${type} (${items.length} occurrences):`);
    items.slice(0, 10).forEach(v => {
      console.log(`   ${v.file}:${v.line} → ${v.content}`);
    });
    if (items.length > 10) {
      console.log(`   ... and ${items.length - 10} more`);
    }
  });

  console.log('\n');
  console.log('🔧 Fix these violations by using global design tokens:');
  console.log('   Colors: bg-background, bg-surface-card, bg-surface-slate, bg-surface-alt, bg-primary-accent');
  console.log('   Text: text-primary, text-secondary, text-tertiary');
  console.log('   Typography: text-display-lg, text-heading-lg/md, text-body-lg/md/sm, text-meta');
  console.log('   Motion: duration-motion-ultrafast/fast/medium, ease-standard/out-soft');
  console.log('   Spacing: Use Tailwind scale (mt-1, mt-2, gap-3, etc.)');
  console.log('\n');

  // Fail in CI if STRICT_DESIGN_SYSTEM=true
  if (process.env.STRICT_DESIGN_SYSTEM === 'true') {
    console.error('❌ Build failed due to design system violations (STRICT_DESIGN_SYSTEM=true)\n');
    process.exit(1);
  } else {
    console.log('⚠️ Violations detected but not blocking build. Set STRICT_DESIGN_SYSTEM=true to enforce.\n');
    process.exit(0);
  }
}

run().catch(console.error);

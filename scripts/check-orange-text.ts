#!/usr/bin/env node
/**
 * Orange Text Regression Guard
 * 
 * Scans codebase for improper use of orange (#F7931E) as text color.
 * Orange should ONLY be used for:
 * - Primary CTA button backgrounds/text
 * - LIVE badges
 * - XP/achievement highlights
 * - Explicit accent components
 * 
 * Run with: npx tsx scripts/check-orange-text.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Violation {
  file: string;
  line: number;
  content: string;
  type: string;
}

const violations: Violation[] = [];

// Orange color patterns to detect
const ORANGE_PATTERNS = {
  textPrimary: /\btext-primary(?!-accent|-foreground)\b/g,  // text-primary (not text-primary-accent or text-primary-foreground)
  textPrimaryAccent: /\btext-primary-accent\b/g,            // text-primary-accent on non-accent elements
  directHex: /text-\[#[fF]7931[eE]\]/g,                     // direct hex orange
};

// Whitelist: Classes/contexts where orange text IS allowed
const ACCENT_WHITELIST_PATTERNS = [
  /className="[^"]*btn-primary/,
  /className="[^"]*badge-live/,
  /className="[^"]*tag-live/,
  /className="[^"]*xp-accent/,
  /className="[^"]*achievement/,
  /data-variant="primary"/,
];

function isWhitelisted(lineContent: string): boolean {
  return ACCENT_WHITELIST_PATTERNS.some(pattern => pattern.test(lineContent));
}

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip Hub and Clubhouse files (they have their own dark theme)
    if (filePath.includes('/hub/') || filePath.includes('/clubhouse/')) {
      return;
    }

    // Skip if line is whitelisted (accent component)
    if (isWhitelisted(line)) {
      return;
    }

    // Check for text-primary (which resolves to orange)
    const textPrimaryMatches = line.match(ORANGE_PATTERNS.textPrimary);
    if (textPrimaryMatches) {
      textPrimaryMatches.forEach(match => {
        violations.push({
          file: filePath,
          line: index + 1,
          content: match,
          type: 'text-primary (resolves to orange)',
        });
      });
    }

    // Check for direct hex orange
    const hexMatches = line.match(ORANGE_PATTERNS.directHex);
    if (hexMatches) {
      hexMatches.forEach(match => {
        violations.push({
          file: filePath,
          line: index + 1,
          content: match,
          type: 'direct hex orange',
        });
      });
    }
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
  console.log('🔍 Scanning for orange text violations...\n');

  const files = getAllFiles('src');
  files.forEach(scanFile);

  console.log(`📊 Scanned ${files.length} files\n`);

  if (violations.length === 0) {
    console.log('✅ No orange text violations found!\n');
    console.log('All text uses semantic tokens correctly:\n');
    console.log('  ✓ text-foreground (for primary text)');
    console.log('  ✓ text-secondary (for secondary text)');
    console.log('  ✓ text-tertiary (for tertiary/placeholder text)');
    console.log('  ✓ text-primary-accent (only for explicit accent elements)\n');
    process.exit(0);
  }

  console.log(`❌ Found ${violations.length} orange text violations:\n`);

  // Group by type
  const byType: Record<string, Violation[]> = {};
  violations.forEach(v => {
    if (!byType[v.type]) byType[v.type] = [];
    byType[v.type].push(v);
  });

  Object.entries(byType).forEach(([type, items]) => {
    console.log(`\n🚫 ${type} (${items.length} occurrences):`);
    items.slice(0, 20).forEach(v => {
      console.log(`   ${v.file}:${v.line} → ${v.content}`);
    });
    if (items.length > 20) {
      console.log(`   ... and ${items.length - 20} more`);
    }
  });

  console.log('\n\n🔧 How to fix:');
  console.log('   Replace text-primary with:');
  console.log('     • text-foreground (for main text)');
  console.log('     • text-secondary (for supporting text)');
  console.log('     • text-tertiary (for subtle/placeholder text)');
  console.log('   \n   Only use text-primary-accent for:');
  console.log('     • CTA button text');
  console.log('     • Badge/tag labels (LIVE, Hot, etc.)');
  console.log('     • XP/achievement numbers\n');

  // Fail in CI if STRICT_ORANGE_CHECK=true
  if (process.env.STRICT_ORANGE_CHECK === 'true') {
    console.error('❌ Build failed due to orange text violations (STRICT_ORANGE_CHECK=true)\n');
    process.exit(1);
  } else {
    console.log('⚠️ Violations detected but not blocking build. Set STRICT_ORANGE_CHECK=true to enforce.\n');
    process.exit(0);
  }
}

run().catch(console.error);

/**
 * Link validation tests using lychee
 *
 * Requires lychee to be installed: brew install lychee
 * If lychee is not available, tests will skip with a warning.
 */

import { spawnSync } from 'child_process';
import * as path from 'path';

export {}; // Make this a module for TypeScript

function isLycheeInstalled(): boolean {
  const result = spawnSync('which', ['lychee'], { encoding: 'utf-8' });
  return result.status === 0;
}

function runLychee(args: string[]): { success: boolean; output: string } {
  const result = spawnSync('lychee', args, {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf-8',
    timeout: 120000, // 2 minute timeout
  });

  return {
    success: result.status === 0,
    output: (result.stdout || '') + (result.stderr || ''),
  };
}

describe('Link Validation', () => {
  const lycheeAvailable = isLycheeInstalled();

  beforeAll(() => {
    if (!lycheeAvailable) {
      console.warn(
        '\n⚠️  lychee is not installed. Link validation tests will be skipped.\n' +
          '   Install with: brew install lychee\n'
      );
    }
  });

  describe('Internal Links', () => {
    const skipMessage = 'lychee not installed - skipping link validation';

    test('all internal links in MDX files are valid', () => {
      if (!lycheeAvailable) {
        console.warn(skipMessage);
        return;
      }

      const result = runLychee([
        'pages/**/*.mdx',
        '--offline', // Only check local/internal links
        '--include-verbatim', // Check links in code blocks too
        '--no-progress',
        '--format',
        'detailed',
      ]);

      if (!result.success) {
        console.error('Broken links found:\n', result.output);
      }

      expect(result.success).toBe(true);
    });

    test('all internal links in TSX components are valid', () => {
      if (!lycheeAvailable) {
        console.warn(skipMessage);
        return;
      }

      const result = runLychee([
        'components/**/*.tsx',
        '--offline',
        '--no-progress',
        '--format',
        'detailed',
      ]);

      if (!result.success) {
        console.error('Broken links found:\n', result.output);
      }

      expect(result.success).toBe(true);
    });
  });

  describe('External Links', () => {
    const skipMessage = 'lychee not installed - skipping link validation';

    // External link checking is slower, so it's in a separate describe block
    // Can be skipped in CI with: jest --testPathIgnorePatterns="links"
    test('all external links are reachable', () => {
      if (!lycheeAvailable) {
        console.warn(skipMessage);
        return;
      }

      const result = runLychee([
        'pages/**/*.mdx',
        'components/**/*.tsx',
        '--no-progress',
        '--format',
        'detailed',
        '--timeout',
        '30', // 30 second timeout per request
        '--max-retries',
        '2',
        // Exclude common flaky/rate-limited domains
        '--exclude',
        'github.com/.*/edit', // GitHub edit links may not resolve without auth
        '--exclude',
        'localhost',
        '--exclude',
        '127.0.0.1',
      ]);

      if (!result.success) {
        console.error('Broken or unreachable links found:\n', result.output);
      }

      expect(result.success).toBe(true);
    }, 180000); // 3 minute timeout for external checks
  });
});

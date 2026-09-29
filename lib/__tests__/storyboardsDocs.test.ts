/**
 * Offline checks for the Investigation Storyboards docs and the pages that
 * link to them: every internal link resolves to a page and, when it has one,
 * to a heading anchor on that page; the navigation lists every storyboards
 * page; and the privacy and evidence statements that were once wrong stay
 * fixed. Unlike links.test.ts this needs no dev server and no lychee.
 */

import * as fs from 'fs';
import * as path from 'path';

const CONTENT = path.resolve(__dirname, '../../content');

/** Pages this suite checks: the storyboards section plus every page that
 *  documents or links into it. */
const PAGES = [
  'ui/storyboards/index.mdx',
  'ui/storyboards/claude.mdx',
  'ui/storyboards/evidence.mdx',
  'ui/storyboards/public-links.mdx',
  'ui/storyboards/self-hosted.mdx',
  'ui/agent-outcomes/install-claude-plugin.mdx',
  'ui/agent-outcomes/install-cursor-plugin.mdx',
  'ui/agent-outcomes/install-gemini-plugin.mdx',
  'ui/mcp-clients.mdx',
  'ui/install/environment.mdx',
];

function read(rel: string): string {
  return fs.readFileSync(path.join(CONTENT, rel), 'utf-8');
}

/** The MDX file a site path such as /ui/storyboards/claude is built from. */
function pageFile(sitePath: string): string | null {
  const rel = sitePath.replace(/^\//, '').replace(/\/$/, '');
  for (const candidate of [`${rel}.mdx`, `${rel}/index.mdx`]) {
    if (fs.existsSync(path.join(CONTENT, candidate))) return candidate;
  }
  return null;
}

/** Markdown with fenced code blocks removed, so a `# comment` in a bash
 *  block is not taken for a heading. */
function withoutCode(md: string): string {
  return md.replace(/^```[\s\S]*?^```/gm, '');
}

/** github-slugger's algorithm (what Nextra uses for heading ids), applied to
 *  a heading's rendered text. ASCII only: these pages' headings are ASCII. */
function slugsOf(md: string): Set<string> {
  const seen = new Map<string, number>();
  const out = new Set<string>();
  for (const line of withoutCode(md).split('\n')) {
    const m = /^#{1,6}\s+(.*)$/.exec(line);
    if (!m) continue;
    const text = m[1]
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[`*]/g, '')
      .trim();
    let slug = text
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, '')
      .replace(/ /g, '-');
    const n = seen.get(slug) ?? 0;
    seen.set(slug, n + 1);
    if (n > 0) slug = `${slug}-${n}`;
    out.add(slug);
  }
  return out;
}

/** Internal links: markdown links whose target starts with / or #. */
function internalLinks(md: string): string[] {
  const links: string[] = [];
  const re = /\]\(((?:\/|#)[^)\s]*)\)/g;
  const text = withoutCode(md);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) links.push(m[1]);
  return links;
}

describe('storyboards docs: internal links', () => {
  test.each(PAGES)('%s: every internal link and anchor resolves', (rel) => {
    const md = read(rel);
    const broken: string[] = [];
    for (const link of internalLinks(md)) {
      const [target, anchor] = link.split('#');
      if (/\.(png|jpe?g|svg|gif|webp)$/.test(target)) continue;
      const file = target === '' ? rel : pageFile(target);
      if (!file) {
        broken.push(`${link} (no page)`);
        continue;
      }
      if (anchor && !slugsOf(read(file)).has(anchor)) broken.push(`${link} (no heading #${anchor} in ${file})`);
    }
    expect(broken).toEqual([]);
  });
});

describe('storyboards docs: navigation', () => {
  test('the Cardinal UI nav lists Investigation Storyboards', () => {
    expect(read('ui/_meta.ts')).toContain("storyboards: 'Investigation Storyboards'");
  });

  test('the storyboards nav lists exactly the pages in the folder', () => {
    const meta = read('ui/storyboards/_meta.ts');
    const keys: string[] = [];
    const re = /^\s*'?([a-z-]+)'?:\s*'/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(meta)) !== null) keys.push(m[1]);
    keys.sort();
    const files = fs
      .readdirSync(path.join(CONTENT, 'ui/storyboards'))
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => f.replace(/\.mdx$/, ''))
      .sort();
    expect(keys).toEqual(files);
  });

  test('there is no second storyboards page beside the folder', () => {
    expect(fs.existsSync(path.join(CONTENT, 'ui/storyboards.mdx'))).toBe(false);
  });
});

describe('storyboards docs: statements that must stay correct', () => {
  const plugin = read('ui/agent-outcomes/install-claude-plugin.mdx');
  const storyboards = PAGES.filter((p) => p.startsWith('ui/storyboards/')).map(read).join('\n');

  test('the Claude plugin privacy copy no longer says tool outputs are never captured', () => {
    expect(plugin).not.toContain('tool inputs/outputs are never captured');
    const privacy = plugin.slice(plugin.indexOf('## Privacy'), plugin.indexOf('## Disconnect'));
    expect(privacy).toContain('kept **locally** as evidence');
    expect(privacy).toContain('uploaded only when you cite them in a storyboard');
    expect(privacy).toContain('`cardinal-evidence off`');
  });

  test('the Cursor and Gemini privacy copy mentions local evidence and its opt-out', () => {
    for (const rel of ['ui/agent-outcomes/install-cursor-plugin.mdx', 'ui/agent-outcomes/install-gemini-plugin.mdx']) {
      const md = read(rel);
      expect(md).toContain('`~/.cardinal/evidence/`');
      expect(md).toContain('`CARDINAL_EVIDENCE_CAPTURE=0`');
    }
  });

  test('authoring is not described as Claude Code only', () => {
    expect(storyboards).not.toMatch(/Authoring\*\* is supported in Claude Code/);
    expect(storyboards).not.toMatch(/other agent plugins don't ship the storyboard skills/);
    expect(storyboards).toContain('https://app.cardinalhq.io/mcp');
    expect(storyboards).toContain('claude mcp add --transport http cardinal https://app.cardinalhq.io/mcp');
  });

  test('failed read-only calls are documented as getting a receipt', () => {
    expect(storyboards).not.toMatch(/What gets no receipt:\*\*[^\n]*failed calls/);
    expect(storyboards).toContain('A failed call still gets a receipt.');
    expect(storyboards).toContain('`/error/message`');
  });

  test('sharing is no longer described as org-only', () => {
    expect(storyboards).not.toContain('There are no public links or exports yet');
  });

  test('the three evidence tiers and the reported-only warning are documented', () => {
    for (const term of ['**witnessed**', '**captured**', '**reported**', '`claim_reported_only`', '`storyboard__record_evidence`']) {
      expect(storyboards).toContain(term);
    }
  });

  test('public links: published only, org policy defaults, raw evidence opt-in', () => {
    const links = read('ui/storyboards/public-links.mdx');
    expect(links).toContain('**Published storyboards only.** A draft can never be shared publicly.');
    expect(links).toContain('**Public storyboard links**');
    expect(links).toMatch(/Team orgs[^\n]*\| \*\*Off\*\*/);
    expect(links).toMatch(/Personal workspaces[^\n]*\| \*\*On\*\*/);
    expect(links).toContain('**Include raw evidence**');
    expect(links).toContain('Who wrote it: session id, API key, client, uploader | Never | Never');
    // The public summary always carries the query and its redacted args
    // (publicReceiptSummary in maestro); the docs must not promise otherwise.
    expect(links).toMatch(/\| Receipt summary: [^\n]*arguments including the query text \(credentials redacted\)[^\n]*\| Yes \| Yes \|/);
    expect(links).toContain("| The full result the investigation saw (credentials redacted), including a failed call's error text | No | Yes |");
    expect(links).not.toContain('and the query text');
    expect(links).toContain('The query and its arguments are always visible on a public link, raw evidence or not.');
    for (const err of ['`public_links_disabled`', '`storyboard_not_published`', '`share_host_not_configured`']) {
      expect(links).toContain(err);
    }
  });

  test('self-hosted: in-VPC path first, OAuth needs DCR or a pre-registered client', () => {
    const selfHosted = read('ui/storyboards/self-hosted.mdx');
    expect(selfHosted.indexOf('## Connect Claude inside your VPC')).toBeGreaterThan(-1);
    expect(selfHosted.indexOf('## Connect Claude inside your VPC')).toBeLessThan(
      selfHosted.indexOf('## The OAuth connector (optional)'),
    );
    expect(selfHosted).toContain('**Dynamic client registration (DCR).**');
    expect(selfHosted).toContain('**A pre-registered client.**');
    expect(selfHosted).toContain('**The Dex bundled with the chart has no DCR.**');
    for (const env of ['`MCP_OAUTH_ENABLED`', '`MCP_OAUTH_SELF_SIGNUP=true`', '`SHARE_HOST`']) {
      expect(selfHosted).toContain(env);
    }
  });

  test('every storyboards env var documented on the self-hosted page is in the environment reference', () => {
    const env = read('ui/install/environment.mdx');
    for (const name of [
      'SHARE_HOST',
      'STORYBOARD_SIGNUP_URL',
      'MCP_OAUTH_ENABLED',
      'MCP_OAUTH_AUDIENCE',
      'MCP_OAUTH_AS_METADATA_PROXY',
      'MCP_OAUTH_SCOPES',
      'MCP_OAUTH_SELF_SIGNUP',
      'PERSONAL_WORKSPACE_MAX_PUBLISHES_PER_DAY',
      'PERSONAL_WORKSPACE_MAX_EVIDENCE_BYTES_PER_DAY',
      'PERSONAL_WORKSPACE_MAX_PUBLIC_VIEWS_PER_DAY',
      'GATEWAY_AGGREGATOR_ENABLED',
    ]) {
      expect(env).toContain(`| \`${name}\` |`);
    }
  });
});

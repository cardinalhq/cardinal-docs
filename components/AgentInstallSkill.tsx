import fs from 'fs';
import path from 'path';
import { Code, Pre } from 'nextra/components';

// public/ holds the single copy, so the page and the raw URL can't drift apart.
export default function AgentInstallSkill() {
  const skill = fs.readFileSync(path.join(process.cwd(), 'public/data-lake/agent-install.md'), 'utf8');
  return (
    <Pre data-copy="" data-language="markdown">
      <Code>{skill}</Code>
    </Pre>
  );
}

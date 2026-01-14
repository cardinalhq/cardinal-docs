'use client';

import Link from 'next/link';
import styles from './QuickAccessCards.module.css';

const items = [
  {
    title: 'Agents',
    description: 'AI-powered assistants',
    href: '/agent-builder/product/assets/agents',
    icon: '🤖',
  },
  {
    title: 'Connectors',
    description: 'Data source integration',
    href: '/agent-builder/product/assets/connectors',
    icon: '🔌',
  },
  {
    title: 'Knowledge',
    description: 'Custom context & runbooks',
    href: '/agent-builder/product/assets/knowledge',
    icon: '📚',
  },
  {
    title: 'Reports',
    description: 'Insights & analysis',
    href: '/agent-builder/product/assets/reports',
    icon: '📊',
  },
  {
    title: 'Queries',
    description: 'Natural language search',
    href: '/agent-builder/product/assets/queries',
    icon: '🔍',
  },
  {
    title: 'Workflows',
    description: 'Automation & logic',
    href: '/agent-builder/product/assets/workflows',
    icon: '⚙️',
  },
  {
    title: 'Scripts',
    description: 'Custom automation',
    href: '/agent-builder/product/assets/scripts',
    icon: '📝',
  },
  {
    title: 'Org Settings',
    description: 'Team setup and controls',
    href: '/agent-builder/product/org-settings',
    icon: '🏢',
  },
  {
    title: 'Chat Modes',
    description: 'Single & Multi-Agent',
    href: '/agent-builder/product/chat-modes',
    icon: '💬',
  },
];

export default function QuickAccessCards() {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={styles.card}>
          <span className={styles.icon}>{item.icon}</span>
          <div>
            <div className={styles.title}>{item.title}</div>
            <div className={styles.description}>{item.description}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

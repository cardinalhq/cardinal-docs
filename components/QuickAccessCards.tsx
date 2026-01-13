'use client';

import Link from 'next/link';
import styles from './QuickAccessCards.module.css';

const items = [
  {
    title: 'Agents',
    description: 'AI-powered assistants',
    href: '/agent-builder/product/assets#1-agents',
    icon: '🤖',
  },
  {
    title: 'Connectors',
    description: 'Data source integration',
    href: '/agent-builder/product/assets#2-connectors',
    icon: '🔌',
  },
  {
    title: 'Knowledge',
    description: 'Custom context & runbooks',
    href: '/agent-builder/product/assets#3-knowledge',
    icon: '📚',
  },
  {
    title: 'Reports',
    description: 'Insights & analysis',
    href: '/agent-builder/product/assets#4-reports',
    icon: '📊',
  },
  {
    title: 'Queries',
    description: 'Natural language search',
    href: '/agent-builder/product/assets#5-queries',
    icon: '🔍',
  },
  {
    title: 'Workflows',
    description: 'Automation & logic',
    href: '/agent-builder/product/assets#6-workflows',
    icon: '⚙️',
  },
  {
    title: 'Scripts',
    description: 'Custom automation',
    href: '/agent-builder/product/assets#7-scripts',
    icon: '📝',
  },
  {
    title: 'Chat Modes',
    description: 'Single & Multi-Agent',
    href: '/agent-builder/product/assets#8-chat-modes',
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

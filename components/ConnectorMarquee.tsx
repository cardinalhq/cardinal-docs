'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './ConnectorMarquee.module.css';
import connectorIcons from './connectorIcons';

const connectors = [
  { name: 'PostgreSQL', href: '/agent-builder/connectors/postgres' },
  { name: 'BigQuery', href: '/agent-builder/connectors/bigquery' },
  { name: 'BigQuery Insights', href: '/agent-builder/connectors/bigquery-insights' },
  { name: 'AWS Athena', href: '/agent-builder/connectors/athena' },
  { name: 'ClickHouse', href: '/agent-builder/connectors/clickhouse' },
  { name: 'Snowflake', href: '/agent-builder/connectors/snowflake' },
  { name: 'AWS CloudWatch', href: '/agent-builder/connectors/cloudwatch' },
  { name: 'Datadog', href: '/agent-builder/connectors/datadog' },
  { name: 'Elasticsearch', href: '/agent-builder/connectors/elasticsearch' },
  { name: 'Grafana', href: '/agent-builder/connectors/grafana' },
  { name: 'Prometheus', href: '/agent-builder/connectors/prometheus' },
  { name: 'Thanos', href: '/agent-builder/connectors/thanos' },
  { name: 'New Relic', href: '/agent-builder/connectors/newrelic' },
  { name: 'Google Cloud Monitoring', href: '/agent-builder/connectors/gcp-monitoring' },
  { name: 'Lakerunner', href: '/agent-builder/connectors/lakerunner' },
  { name: 'Slack', href: '/agent-builder/connectors/slack' },
  { name: 'GitHub', href: '/agent-builder/connectors/github' },
  { name: 'HTTP MCP Server', href: '/agent-builder/connectors/httpmcp' },
  { name: 'AWS Lambda', href: '/agent-builder/connectors/lambda' },
  { name: 'Cardinal Release Agent', href: '/agent-builder/release-agent' },
];

function ConnectorItem({ name, href }: { name: string; href: string }) {
  const iconPath = connectorIcons[name];
  const isImage = iconPath?.endsWith('.png');

  return (
    <Link href={href} className={styles.item} aria-label={name}>
      {isImage ? (
        <Image
          src={iconPath}
          alt={name}
          width={40}
          height={40}
          className={styles.icon}
        />
      ) : (
        <span className={styles.emoji}>{iconPath || '🔌'}</span>
      )}
      <span className={styles.label}>{name}</span>
    </Link>
  );
}

export default function ConnectorMarquee() {
  return (
    <div className={styles.marquee} role="region" aria-label="Connector icons">
      <div className={styles.track}>
        <div className={styles.group}>
          {connectors.map((connector) => (
            <ConnectorItem key={connector.href} {...connector} />
          ))}
        </div>
        <div className={styles.group} aria-hidden="true">
          {connectors.map((connector) => (
            <ConnectorItem key={`${connector.href}-dup`} {...connector} />
          ))}
        </div>
      </div>
    </div>
  );
}

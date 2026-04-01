'use client';

import { useState } from 'react';
import styles from './QuickStartSteps.module.css';

interface Step {
  number: number;
  title: string;
  content: React.ReactNode;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Sign up for a Cardinal account',
    content: (
      <p>
        Create your free account at{' '}
        <a href="https://app.cardinalhq.io" target="_blank" rel="noopener noreferrer">
          app.cardinalhq.io
        </a>
        .
      </p>
    ),
  },
  {
    number: 2,
    title: 'Download your Lakerunner Trial license',
    content: <p>After signing in, download your trial license from the Cardinal dashboard.</p>,
  },
  {
    number: 3,
    title: 'Create the namespace',
    content: (
      <div className={styles.codeBlock}>
        <div className={styles.codeHeader}>
          <span className={styles.codeLang}>bash</span>
          <CopyButton text="kubectl create namespace lakerunner" />
        </div>
        <pre>
          <code>kubectl create namespace lakerunner</code>
        </pre>
      </div>
    ),
  },
  {
    number: 4,
    title: 'Install using Helm',
    content: (
      <>
        <p>
          Use the{' '}
          <a href="/lakerunner/install" target="_blank" rel="noopener noreferrer">
            Installation Wizard
          </a>{' '}
          to generate a <code>values.yaml</code> tailored to your environment, then install:
        </p>
        <div className={styles.codeBlock}>
          <div className={styles.codeHeader}>
            <span className={styles.codeLang}>bash</span>
            <CopyButton
              text={`helm install lakerunner oci://public.ecr.aws/cardinalhq.io/lakerunner \\
  --values values.yaml \\
  --namespace lakerunner`}
            />
          </div>
          <pre>
            <code>{`helm install lakerunner oci://public.ecr.aws/cardinalhq.io/lakerunner \\
  --values values.yaml \\
  --namespace lakerunner`}</code>
          </pre>
        </div>
      </>
    ),
  },
  {
    number: 5,
    title: 'Verify the installation',
    content: (
      <>
        <p>Wait for all pods to become ready:</p>
        <div className={styles.codeBlock}>
          <div className={styles.codeHeader}>
            <span className={styles.codeLang}>bash</span>
            <CopyButton text="kubectl get pods -n lakerunner -w" />
          </div>
          <pre>
            <code>kubectl get pods -n lakerunner -w</code>
          </pre>
        </div>
      </>
    ),
  },
  {
    number: 6,
    title: 'Access Grafana',
    content: (
      <>
        <p>If Grafana was included in your installation, port-forward it to your local machine:</p>
        <div className={styles.codeBlock}>
          <div className={styles.codeHeader}>
            <span className={styles.codeLang}>bash</span>
            <CopyButton text="kubectl port-forward -n lakerunner svc/grafana 3000:3000" />
          </div>
          <pre>
            <code>kubectl port-forward -n lakerunner svc/grafana 3000:3000</code>
          </pre>
        </div>
        <p>
          Open{' '}
          <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
            http://localhost:3000
          </a>{' '}
          in your browser. Lakerunner&apos;s data source is pre-configured, but you won&apos;t see any data yet — that comes in the next step.
        </p>
      </>
    ),
  },
  {
    number: 7,
    title: 'Send data',
    content: (
      <>
        <p>
          Install{' '}
          <a href="/lakerunner/collectors" target="_blank" rel="noopener noreferrer">
            OpenTelemetry Collectors
          </a>{' '}
          to monitor your cluster and write telemetry to S3.
        </p>
        <p>
          Generate data from your real applications, or use the{' '}
          <a href="/lakerunner/otel-demo" target="_blank" rel="noopener noreferrer">
            OTel Demo Application
          </a>{' '}
          to produce realistic logs, metrics, and traces right away.
        </p>
      </>
    ),
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className={styles.copyBtn} onClick={handleCopy} aria-label="Copy to clipboard">
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

const nextSteps = [
  {
    icon: '📡',
    title: 'Install OpenTelemetry Collectors',
    description: 'Deploy the agent, poller, and gateway to monitor your cluster and write to S3',
    href: '/lakerunner/collectors',
  },
  {
    icon: '🛍️',
    title: 'Install the OTel Demo Application',
    description: 'Deploy a microservices e-commerce app that generates realistic telemetry',
    href: '/lakerunner/otel-demo',
  },
  {
    icon: '🚀',
    title: 'Production deployment',
    description: 'Generate a production values.yaml with S3 and PostgreSQL',
    href: '/lakerunner/install',
  },
  {
    icon: '🏗️',
    title: 'Architecture',
    description: 'Learn how ingestion, materialization, and query work',
    href: '/lakerunner/architecture',
  },
];

export default function QuickStartSteps() {
  return (
    <div className={styles.wrapper}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Quick Start
        </div>
        <h2 className={styles.heroTitle}>Up and running in minutes</h2>
        <p className={styles.heroSub}>
          Get Lakerunner deployed on a local Kubernetes cluster — no cloud account required.
        </p>
      </div>

      {/* Prerequisites */}
      <div className={styles.prereqs}>
        <h3 className={styles.prereqTitle}>Prerequisites</h3>
        <div className={styles.prereqGrid}>
          <div className={styles.prereqItem}>
            <span className={styles.prereqIcon}>⎈</span>
            <div>
              <strong>Kubernetes 1.33+</strong>
              <span className={styles.prereqAlt}>
                or{' '}
                <a href="https://kind.sigs.k8s.io/" target="_blank" rel="noopener noreferrer">
                  kind
                </a>
                ,{' '}
                <a href="https://minikube.sigs.k8s.io/" target="_blank" rel="noopener noreferrer">
                  minikube
                </a>
                , etc.
              </span>
            </div>
          </div>
          <div className={styles.prereqItem}>
            <span className={styles.prereqIcon}>⬡</span>
            <div>
              <strong>Helm 3.14+</strong>
              <span className={styles.prereqAlt}>
                <a href="https://helm.sh/docs/intro/install/" target="_blank" rel="noopener noreferrer">
                  Install guide
                </a>
              </span>
            </div>
          </div>
          <div className={styles.prereqItem}>
            <span className={styles.prereqIcon}>▸</span>
            <div>
              <strong>kubectl</strong>
              <span className={styles.prereqAlt}>
                <a
                  href="https://kubernetes.io/docs/tasks/tools/#kubectl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Install guide
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className={styles.timeline}>
        {steps.map((step, i) => (
          <div key={step.number} className={styles.step} style={{ animationDelay: `${i * 80}ms` }}>
            <div className={styles.stepRail}>
              <div className={styles.stepNumber}>{step.number}</div>
              {i < steps.length - 1 && <div className={styles.stepLine} />}
            </div>
            <div className={styles.stepBody}>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <div className={styles.stepContent}>{step.content}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className={styles.nextSection}>
        <h3 className={styles.nextTitle}>What&apos;s next?</h3>
        <div className={styles.nextGrid}>
          {nextSteps.map((item) => (
            <a key={item.href} href={item.href} className={styles.nextCard}>
              <span className={styles.nextIcon}>{item.icon}</span>
              <div>
                <div className={styles.nextCardTitle}>{item.title}</div>
                <div className={styles.nextCardDesc}>{item.description}</div>
              </div>
              <svg
                className={styles.nextArrow}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

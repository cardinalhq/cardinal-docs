'use client';

import { useState } from 'react';
import { HowToHero, Prerequisites, Steps, Step, NextSteps } from './HowTo';
import styles from './HowTo/HowTo.module.css';

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLang}>{lang}</span>
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
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const HELM_INSTALL = `helm install lakerunner oci://public.ecr.aws/cardinalhq.io/lakerunner \\
  --values values.yaml \\
  --namespace lakerunner`;

export default function QuickStartSteps() {
  return (
    <>
      <HowToHero
        badge="Quick Start"
        title="Up and running in minutes"
        lede="Get Lakerunner deployed on a local Kubernetes cluster — no cloud account required."
      />

      <Prerequisites
        items={[
          {
            icon: '⎈',
            title: 'Kubernetes 1.33+',
            alt: (
              <>
                or{' '}
                <a href="https://kind.sigs.k8s.io/" target="_blank" rel="noopener noreferrer">
                  kind
                </a>
                ,{' '}
                <a href="https://minikube.sigs.k8s.io/" target="_blank" rel="noopener noreferrer">
                  minikube
                </a>
                , etc.
              </>
            ),
          },
          {
            icon: '⬡',
            title: 'Helm 3.14+',
            alt: (
              <a href="https://helm.sh/docs/intro/install/" target="_blank" rel="noopener noreferrer">
                Install guide
              </a>
            ),
          },
          {
            icon: '▸',
            title: 'kubectl',
            alt: (
              <a href="https://kubernetes.io/docs/tasks/tools/#kubectl" target="_blank" rel="noopener noreferrer">
                Install guide
              </a>
            ),
          },
        ]}
      />

      <Steps>
        <Step title="Sign up for a Cardinal account">
          <p>
            Create your free account at{' '}
            <a href="https://app.cardinalhq.io" target="_blank" rel="noopener noreferrer">
              app.cardinalhq.io
            </a>
            .
          </p>
        </Step>
        <Step title="Download your Lakerunner Trial license">
          <p>After signing in, download your trial license from the Cardinal dashboard.</p>
        </Step>
        <Step title="Create the namespace">
          <CodeBlock lang="bash" code="kubectl create namespace lakerunner" />
        </Step>
        <Step title="Install using Helm">
          <p>
            Use the{' '}
            <a href="/lakerunner/install" target="_blank" rel="noopener noreferrer">
              Installation Wizard
            </a>{' '}
            to generate a <code>values.yaml</code> tailored to your environment, then install:
          </p>
          <CodeBlock lang="bash" code={HELM_INSTALL} />
        </Step>
        <Step title="Verify the installation">
          <p>Wait for all pods to become ready:</p>
          <CodeBlock lang="bash" code="kubectl get pods -n lakerunner -w" />
        </Step>
        <Step title="Access Grafana">
          <p>If Grafana was included in your installation, port-forward it to your local machine:</p>
          <CodeBlock lang="bash" code="kubectl port-forward -n lakerunner svc/grafana 3000:3000" />
          <p>
            Open{' '}
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
              http://localhost:3000
            </a>{' '}
            in your browser. Lakerunner&apos;s data source is pre-configured, but you won&apos;t see any data
            yet — that comes in the next step.
          </p>
        </Step>
        <Step title="Send data">
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
        </Step>
      </Steps>

      <NextSteps
        items={[
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
        ]}
      />
    </>
  );
}

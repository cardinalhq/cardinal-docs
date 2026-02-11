import React from 'react';

const ManagedCollectorDiagram: React.FC = () => {
  return (
    <div className="collector-diagram-container">
      <svg
        viewBox="0 0 900 520"
        xmlns="http://www.w3.org/2000/svg"
        className="collector-diagram"
      >
        {/* Background */}
        <rect width="900" height="520" className="diagram-bg" />

        {/* Kubernetes Cluster boundary */}
        <rect
          x="20"
          y="20"
          width="580"
          height="480"
          rx="12"
          className="cluster-boundary"
        />
        <text x="40" y="48" className="cluster-label">Kubernetes Cluster</text>

        {/* === LEFT COLUMN: Nodes with Agent Collectors === */}

        {/* Node 1 */}
        <rect x="40" y="70" width="200" height="190" rx="8" className="node-box" />
        <text x="60" y="95" className="node-label">Node 1</text>

        {/* Items on Node 1 */}
        <rect x="55" y="110" width="50" height="35" rx="4" className="pod-box" />
        <text x="80" y="125" className="pod-label">Node</text>
        <text x="80" y="137" className="pod-label">Metrics</text>
        <rect x="115" y="110" width="50" height="35" rx="4" className="pod-box" />
        <text x="140" y="132" className="pod-label">Pod</text>
        <rect x="175" y="110" width="50" height="35" rx="4" className="pod-box" />
        <text x="200" y="132" className="pod-label">Pod</text>

        {/* Agent Collector on Node 1 */}
        <rect x="80" y="165" width="120" height="50" rx="6" className="agent-box" />
        <text x="140" y="187" className="collector-label">Agent</text>
        <text x="140" y="203" className="collector-label">Collector</text>

        {/* Arrows from pods to agent */}
        <path d="M80 145 L100 165" className="arrow-line" markerEnd="url(#arrowhead)" />
        <path d="M140 145 L140 165" className="arrow-line" markerEnd="url(#arrowhead)" />
        <path d="M200 145 L180 165" className="arrow-line" markerEnd="url(#arrowhead)" />

        {/* Node 2 */}
        <rect x="40" y="290" width="200" height="190" rx="8" className="node-box" />
        <text x="60" y="315" className="node-label">Node 2</text>

        {/* Items on Node 2 */}
        <rect x="55" y="330" width="50" height="35" rx="4" className="pod-box" />
        <text x="80" y="345" className="pod-label">Node</text>
        <text x="80" y="357" className="pod-label">Metrics</text>
        <rect x="115" y="330" width="50" height="35" rx="4" className="pod-box" />
        <text x="140" y="352" className="pod-label">Pod</text>
        <rect x="175" y="330" width="50" height="35" rx="4" className="pod-box" />
        <text x="200" y="352" className="pod-label">Pod</text>

        {/* Agent Collector on Node 2 */}
        <rect x="80" y="385" width="120" height="50" rx="6" className="agent-box" />
        <text x="140" y="407" className="collector-label">Agent</text>
        <text x="140" y="423" className="collector-label">Collector</text>

        {/* Arrows from pods to agent on node 2 */}
        <path d="M80 365 L100 385" className="arrow-line" markerEnd="url(#arrowhead)" />
        <path d="M140 365 L140 385" className="arrow-line" markerEnd="url(#arrowhead)" />
        <path d="M200 365 L180 385" className="arrow-line" markerEnd="url(#arrowhead)" />

        {/* === MIDDLE COLUMN: Polling Collector === */}

        {/* Data sources for Polling - horizontal layout */}
        <rect x="270" y="70" width="100" height="50" rx="4" className="source-box" />
        <text x="320" y="100" className="source-label">K8s API</text>

        <rect x="390" y="70" width="100" height="50" rx="4" className="source-box" />
        <text x="440" y="92" className="source-label">Prometheus</text>
        <text x="440" y="107" className="source-label-small">targets</text>

        {/* Polling Collector */}
        <rect x="305" y="160" width="130" height="65" rx="6" className="polling-box" />
        <text x="370" y="188" className="collector-label">Polling</text>
        <text x="370" y="206" className="collector-label">Collector</text>

        {/* Arrows from sources to polling */}
        <path d="M320 120 L350 160" className="arrow-line" markerEnd="url(#arrowhead)" />
        <path d="M440 120 L390 160" className="arrow-line" markerEnd="url(#arrowhead)" />

        {/* === GATEWAY COLLECTOR (center bottom) === */}
        <rect x="305" y="380" width="130" height="75" rx="6" className="gateway-box" />
        <text x="370" y="412" className="gateway-label">Gateway</text>
        <text x="370" y="432" className="gateway-label">Collector</text>

        {/* Arrows to Gateway */}
        <path d="M200 190 L305 405" className="arrow-line-thick" markerEnd="url(#arrowhead)" />
        <path d="M200 410 L305 418" className="arrow-line-thick" markerEnd="url(#arrowhead)" />
        <path d="M370 225 L370 380" className="arrow-line-thick" markerEnd="url(#arrowhead)" />

        {/* === RIGHT SIDE: Destinations (outside cluster) === */}

        {/* Lakerunner */}
        <rect x="640" y="320" width="160" height="60" rx="8" className="destination-box" />
        <text x="720" y="345" className="destination-label">Lakerunner</text>
        <text x="720" y="363" className="destination-label-small">(Object Storage)</text>

        {/* OTLP Destination */}
        <rect x="640" y="410" width="160" height="60" rx="8" className="destination-box" />
        <text x="720" y="435" className="destination-label">OTLP</text>
        <text x="720" y="453" className="destination-label-small">Destination</text>

        {/* Arrows from Gateway to destinations */}
        <path d="M435 400 L640 350" className="arrow-line-thick" markerEnd="url(#arrowhead)" />
        <path d="M435 430 L640 440" className="arrow-line-thick" markerEnd="url(#arrowhead)" />

        {/* Arrow definitions */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" className="arrowhead" />
          </marker>
        </defs>
      </svg>

      <style jsx>{`
        .collector-diagram-container {
          margin: 2rem 0;
          padding: 1rem;
          border-radius: 12px;
          background: var(--diagram-container-bg);
        }
        .collector-diagram {
          width: 100%;
          max-width: 900px;
          height: auto;
        }
        .diagram-bg {
          fill: var(--diagram-bg);
        }
        .cluster-boundary {
          fill: none;
          stroke: var(--cluster-stroke);
          stroke-width: 2;
          stroke-dasharray: 8 4;
        }
        .cluster-label {
          font-size: 14px;
          font-weight: 600;
          fill: var(--text-secondary);
        }
        .node-box {
          fill: var(--node-bg);
          stroke: var(--node-stroke);
          stroke-width: 1.5;
        }
        .node-label {
          font-size: 12px;
          font-weight: 600;
          fill: var(--text-primary);
        }
        .pod-box {
          fill: var(--pod-bg);
          stroke: var(--pod-stroke);
          stroke-width: 1;
        }
        .pod-label {
          font-size: 10px;
          fill: var(--text-secondary);
          text-anchor: middle;
        }
        .agent-box {
          fill: var(--agent-bg);
          stroke: var(--agent-stroke);
          stroke-width: 2;
        }
        .polling-box {
          fill: var(--polling-bg);
          stroke: var(--polling-stroke);
          stroke-width: 2;
        }
        .gateway-box {
          fill: var(--gateway-bg);
          stroke: var(--gateway-stroke);
          stroke-width: 2;
        }
        .collector-label {
          font-size: 12px;
          font-weight: 600;
          fill: var(--collector-text);
          text-anchor: middle;
        }
        .gateway-label {
          font-size: 14px;
          font-weight: 700;
          fill: var(--gateway-text);
          text-anchor: middle;
        }
        .source-box {
          fill: var(--source-bg);
          stroke: var(--source-stroke);
          stroke-width: 1.5;
        }
        .source-label {
          font-size: 11px;
          fill: var(--text-secondary);
          text-anchor: middle;
        }
        .source-label-small {
          font-size: 9px;
          fill: var(--text-muted);
          text-anchor: middle;
        }
        .destination-box {
          fill: var(--destination-bg);
          stroke: var(--destination-stroke);
          stroke-width: 2;
        }
        .destination-label {
          font-size: 13px;
          font-weight: 600;
          fill: var(--destination-text);
          text-anchor: middle;
        }
        .destination-label-small {
          font-size: 10px;
          fill: var(--destination-text-secondary);
          text-anchor: middle;
        }
        .arrow-line {
          fill: none;
          stroke: var(--arrow-color);
          stroke-width: 1.5;
        }
        .arrow-line-thick {
          fill: none;
          stroke: var(--arrow-color-strong);
          stroke-width: 2.5;
        }
        .arrowhead {
          fill: var(--arrow-color-strong);
        }

        /* Light mode (default) */
        :global(:root) {
          --diagram-container-bg: #f8f9fa;
          --diagram-bg: #ffffff;
          --cluster-stroke: #6b7280;
          --text-primary: #1f2937;
          --text-secondary: #4b5563;
          --text-muted: #9ca3af;
          --node-bg: #f3f4f6;
          --node-stroke: #d1d5db;
          --pod-bg: #e0e7ff;
          --pod-stroke: #a5b4fc;
          --agent-bg: #dbeafe;
          --agent-stroke: #3b82f6;
          --polling-bg: #fef3c7;
          --polling-stroke: #f59e0b;
          --gateway-bg: #dcfce7;
          --gateway-stroke: #22c55e;
          --gateway-text: #166534;
          --collector-text: #1e40af;
          --source-bg: #f5f5f5;
          --source-stroke: #a1a1aa;
          --destination-bg: #fff7ed;
          --destination-stroke: #ff5722;
          --destination-text: #9a3412;
          --destination-text-secondary: #c2410c;
          --arrow-color: #9ca3af;
          --arrow-color-strong: #6b7280;
        }

        /* Dark mode */
        :global(.dark) {
          --diagram-container-bg: #1a1a2e;
          --diagram-bg: #16213e;
          --cluster-stroke: #64748b;
          --text-primary: #f1f5f9;
          --text-secondary: #cbd5e1;
          --text-muted: #64748b;
          --node-bg: #1e293b;
          --node-stroke: #475569;
          --pod-bg: #312e81;
          --pod-stroke: #6366f1;
          --agent-bg: #1e3a5f;
          --agent-stroke: #60a5fa;
          --polling-bg: #451a03;
          --polling-stroke: #fbbf24;
          --gateway-bg: #14532d;
          --gateway-stroke: #4ade80;
          --gateway-text: #bbf7d0;
          --collector-text: #93c5fd;
          --source-bg: #27272a;
          --source-stroke: #71717a;
          --destination-bg: #431407;
          --destination-stroke: #ff8a5c;
          --destination-text: #fed7aa;
          --destination-text-secondary: #fdba74;
          --arrow-color: #64748b;
          --arrow-color-strong: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default ManagedCollectorDiagram;

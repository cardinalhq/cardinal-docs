import React from 'react';

const ManagedCollectorDiagram: React.FC = () => {
  return (
    <div className="collector-diagram-container">
      <svg
        viewBox="0 0 800 500"
        xmlns="http://www.w3.org/2000/svg"
        className="collector-diagram"
      >
        {/* Background */}
        <rect width="800" height="500" className="diagram-bg" />

        {/* Kubernetes Cluster boundary */}
        <rect
          x="30"
          y="30"
          width="540"
          height="440"
          rx="12"
          className="cluster-boundary"
        />
        <text x="50" y="58" className="cluster-label">Kubernetes Cluster</text>

        {/* Node 1 */}
        <rect x="50" y="80" width="230" height="180" rx="8" className="node-box" />
        <text x="70" y="105" className="node-label">Node 1</text>

        {/* Pods on Node 1 */}
        <rect x="70" y="120" width="60" height="40" rx="4" className="pod-box" />
        <text x="100" y="145" className="pod-label">Pod</text>
        <rect x="140" y="120" width="60" height="40" rx="4" className="pod-box" />
        <text x="170" y="145" className="pod-label">Pod</text>
        <rect x="70" y="170" width="60" height="40" rx="4" className="pod-box" />
        <text x="100" y="195" className="pod-label">Pod</text>

        {/* Agent Collector on Node 1 */}
        <rect x="150" y="170" width="110" height="50" rx="6" className="agent-box" />
        <text x="205" y="192" className="collector-label">Agent</text>
        <text x="205" y="208" className="collector-label">Collector</text>

        {/* Arrows from pods to agent */}
        <path d="M130 140 L160 185" className="arrow-line" markerEnd="url(#arrowhead)" />
        <path d="M170 160 L185 175" className="arrow-line" markerEnd="url(#arrowhead)" />
        <path d="M130 190 L150 195" className="arrow-line" markerEnd="url(#arrowhead)" />

        {/* Node 2 */}
        <rect x="50" y="280" width="230" height="180" rx="8" className="node-box" />
        <text x="70" y="305" className="node-label">Node 2</text>

        {/* Pods on Node 2 */}
        <rect x="70" y="320" width="60" height="40" rx="4" className="pod-box" />
        <text x="100" y="345" className="pod-label">Pod</text>
        <rect x="140" y="320" width="60" height="40" rx="4" className="pod-box" />
        <text x="170" y="345" className="pod-label">Pod</text>

        {/* Agent Collector on Node 2 */}
        <rect x="150" y="370" width="110" height="50" rx="6" className="agent-box" />
        <text x="205" y="392" className="collector-label">Agent</text>
        <text x="205" y="408" className="collector-label">Collector</text>

        {/* Arrows from pods to agent on node 2 */}
        <path d="M130 360 L175 375" className="arrow-line" markerEnd="url(#arrowhead)" />
        <path d="M170 360 L190 375" className="arrow-line" markerEnd="url(#arrowhead)" />

        {/* Polling Collector */}
        <rect x="320" y="120" width="120" height="70" rx="6" className="polling-box" />
        <text x="380" y="150" className="collector-label">Polling</text>
        <text x="380" y="168" className="collector-label">Collector</text>

        {/* K8s API, Prometheus targets */}
        <rect x="330" y="220" width="100" height="35" rx="4" className="source-box" />
        <text x="380" y="242" className="source-label">K8s API</text>
        <rect x="330" y="265" width="100" height="35" rx="4" className="source-box" />
        <text x="380" y="287" className="source-label">Prometheus</text>
        <text x="380" y="300" className="source-label-small">targets</text>

        {/* Arrows from sources to polling */}
        <path d="M380 220 L380 190" className="arrow-line" markerEnd="url(#arrowhead)" />
        <path d="M380 265 L380 190" className="arrow-line" markerEnd="url(#arrowhead)" />

        {/* Gateway Collector */}
        <rect x="320" y="360" width="120" height="80" rx="6" className="gateway-box" />
        <text x="380" y="395" className="gateway-label">Gateway</text>
        <text x="380" y="415" className="gateway-label">Collector</text>

        {/* Arrows to Gateway */}
        <path d="M260 195 L320 395" className="arrow-line-thick" markerEnd="url(#arrowhead)" />
        <path d="M260 395 L320 400" className="arrow-line-thick" markerEnd="url(#arrowhead)" />
        <path d="M380 190 L380 360" className="arrow-line-thick" markerEnd="url(#arrowhead)" />

        {/* External destinations */}
        {/* Lakerunner / Object Storage */}
        <rect x="600" y="300" width="160" height="60" rx="8" className="destination-box" />
        <text x="680" y="325" className="destination-label">Lakerunner</text>
        <text x="680" y="345" className="destination-label-small">(Object Storage)</text>

        {/* OTLP Destination */}
        <rect x="600" y="400" width="160" height="60" rx="8" className="destination-box" />
        <text x="680" y="425" className="destination-label">OTLP</text>
        <text x="680" y="445" className="destination-label-small">Destination</text>

        {/* Arrows from Gateway to destinations */}
        <path d="M440 385 L600 330" className="arrow-line-thick" markerEnd="url(#arrowhead)" />
        <path d="M440 410 L600 430" className="arrow-line-thick" markerEnd="url(#arrowhead)" />

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
          max-width: 800px;
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
          font-size: 11px;
          font-weight: 600;
          fill: var(--collector-text);
          text-anchor: middle;
        }
        .gateway-label {
          font-size: 13px;
          font-weight: 700;
          fill: var(--gateway-text);
          text-anchor: middle;
        }
        .source-box {
          fill: var(--source-bg);
          stroke: var(--source-stroke);
          stroke-width: 1;
        }
        .source-label {
          font-size: 10px;
          fill: var(--text-secondary);
          text-anchor: middle;
        }
        .source-label-small {
          font-size: 8px;
          fill: var(--text-muted);
          text-anchor: middle;
        }
        .destination-box {
          fill: var(--destination-bg);
          stroke: var(--destination-stroke);
          stroke-width: 2;
        }
        .destination-label {
          font-size: 12px;
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

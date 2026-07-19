export const PLANE_ORDER = Object.freeze([
  'workflow',
  'evidence',
  'authority',
  'adoption',
  'value'
]);

export const PLANE_LABELS = Object.freeze({
  workflow: 'Workflow friction',
  evidence: 'Evidence + readiness',
  authority: 'Human authority',
  adoption: 'Adoption + ownership',
  value: 'Measurable value'
});

export const DEFAULT_SCENARIO_ID = 'prior-auth-completeness';

const freezeScenario = value => Object.freeze({
  ...value,
  path: Object.freeze(value.path.map(item => Object.freeze({ ...item }))),
  measurement: Object.freeze([...value.measurement]),
  sourceNotes: Object.freeze([...value.sourceNotes])
});

export const SCENARIOS = Object.freeze([
  freezeScenario({
    id: 'prior-auth-completeness',
    shortLabel: 'Prior authorization',
    title: 'Prior authorization completeness',
    illustrative: true,
    problem: 'Incomplete or misrouted submissions can create avoidable rework before clinical review.',
    path: [
      { plane: 'workflow', nodeId: 'submission-completeness', label: 'Submission completeness', detail: 'Identify missing information before avoidable pend or reroute.', x: -1.25 },
      { plane: 'evidence', nodeId: 'policy-submission-evidence', label: 'Policy + submission evidence', detail: 'Ground assistance in requirements, submitted documentation, and system context.', x: -0.6 },
      { plane: 'authority', nodeId: 'coverage-authority', label: 'Human coverage authority retained', detail: 'AI supports completeness and routing; qualified people retain coverage decisions.', x: 0.15 },
      { plane: 'adoption', nodeId: 'um-ownership', label: 'UM workflow ownership', detail: 'Embed with clear exception handling, training, and accountable process ownership.', x: 0.75 },
      { plane: 'value', nodeId: 'rework-turnaround-evidence', label: 'Less rework, clearer turnaround evidence', detail: 'Measure completeness, rework, turnaround, quality, and user adoption.', x: 1.35 }
    ],
    owner: 'Utilization Management workflow owner',
    adoptionBurden: 'Moderate: workflow integration, criteria stewardship, training, and exception design.',
    measurement: ['submission completeness', 'avoidable rework', 'turnaround time', 'quality / risk', 'adoption'],
    disposition: {
      label: 'Advance to controlled proof',
      tone: 'advance',
      basis: 'Illustrative discovery hypothesis grounded in the public role mandate and Highmark’s human-at-the-helm AI policy.'
    },
    publicBoundary: 'Not a claim about Highmark’s internal prior-authorization workflow or current project portfolio.',
    sourceNotes: ['Highmark AI: human at the helm', 'J281843: assess processes, systems, data and proof designs']
  }),
  freezeScenario({
    id: 'claim-exception-triage',
    shortLabel: 'Claims exceptions',
    title: 'Claim exception triage',
    illustrative: true,
    problem: 'Complex exceptions can consume skilled attention before root cause and ownership are clear.',
    path: [
      { plane: 'workflow', nodeId: 'exception-triage', label: 'Exception triage', detail: 'Separate recurring operating patterns from genuinely complex exceptions.', x: 1.2 },
      { plane: 'evidence', nodeId: 'claim-rule-history', label: 'Claim + rule + history context', detail: 'Use source-grounded transaction, configuration, and prior-resolution evidence.', x: 0.45 },
      { plane: 'authority', nodeId: 'payment-authority', label: 'Payment authority retained', detail: 'AI recommends routing and explanation; authorized staff retain adjudication authority.', x: -0.25 },
      { plane: 'adoption', nodeId: 'claims-ownership', label: 'Claims operations ownership', detail: 'Install clear escalation, feedback, and root-cause learning routines.', x: -0.85 },
      { plane: 'value', nodeId: 'ownership-learning', label: 'Faster ownership and reusable learning', detail: 'Measure exception age, rework, routing accuracy, repeat causes, and adoption.', x: -1.35 }
    ],
    owner: 'Claims Operations workflow owner',
    adoptionBurden: 'Moderate-high: system integration, rule provenance, exception taxonomy, and feedback discipline.',
    measurement: ['exception age', 'routing accuracy', 'repeat causes', 'rework', 'adoption'],
    disposition: {
      label: 'Assist while evidence develops',
      tone: 'assist',
      basis: 'Illustrative posture; evidence quality and authoritative rule context determine whether a controlled proof is appropriate.'
    },
    publicBoundary: 'Not a claim about Highmark claim volumes, platforms, or adjudication rules.',
    sourceNotes: ['J281843: technical assessment and implementation planning', 'Highmark AI: rigorous risk assessment']
  }),
  freezeScenario({
    id: 'provider-data-confidence',
    shortLabel: 'Provider data',
    title: 'Provider-data confidence',
    illustrative: true,
    problem: 'Conflicting provider attributes can create downstream member and provider friction.',
    path: [
      { plane: 'workflow', nodeId: 'record-confidence', label: 'Provider record confidence', detail: 'Identify fields that require verification rather than treating every record equally.', x: -0.85 },
      { plane: 'evidence', nodeId: 'multi-source-evidence', label: 'Multi-source field evidence', detail: 'Compare authoritative sources, recency, conflict, and provenance at field level.', x: 0.1 },
      { plane: 'authority', nodeId: 'data-stewardship', label: 'Data stewardship retained', detail: 'AI surfaces confidence and conflicts; accountable stewards approve material changes.', x: 1.0 },
      { plane: 'adoption', nodeId: 'network-data-ownership', label: 'Network data ownership', detail: 'Align verification queues, source stewardship, and downstream consumers.', x: 0.45 },
      { plane: 'value', nodeId: 'downstream-decisions', label: 'Cleaner downstream decisions', detail: 'Measure conflict resolution, verified-field freshness, failed contacts, and adoption.', x: -0.55 }
    ],
    owner: 'Provider Data / Network Operations owner',
    adoptionBurden: 'High: cross-source governance, accountable stewardship, and downstream change coordination.',
    measurement: ['field conflict resolution', 'data freshness', 'failed-contact signals', 'rework', 'adoption'],
    disposition: {
      label: 'Hold for readiness',
      tone: 'hold',
      basis: 'Illustrative posture where source authority and stewardship must be explicit before automation expands.'
    },
    publicBoundary: 'Not a claim about Highmark provider-directory accuracy or current data architecture.',
    sourceNotes: ['J281843: systems, data and infrastructure assessment', 'Highmark AI: privacy, legal and technical review']
  }),
  freezeScenario({
    id: 'member-service-preparation',
    shortLabel: 'Member service',
    title: 'Member-service preparation',
    illustrative: true,
    problem: 'Agents may spend valuable interaction time assembling context across systems before helping a member.',
    path: [
      { plane: 'workflow', nodeId: 'interaction-preparation', label: 'Interaction preparation', detail: 'Assemble relevant context before the conversation without overwhelming the agent.', x: 0.7 },
      { plane: 'evidence', nodeId: 'source-linked-context', label: 'Source-linked member context', detail: 'Use permitted, current, traceable information with clear uncertainty.', x: -0.25 },
      { plane: 'authority', nodeId: 'agent-judgment', label: 'Agent judgment retained', detail: 'AI prepares and explains; the agent owns the member interaction and resolution.', x: -1.05 },
      { plane: 'adoption', nodeId: 'service-ownership', label: 'Service leadership ownership', detail: 'Fit the pre-brief into existing work, coaching, escalation, and quality routines.', x: -0.25 },
      { plane: 'value', nodeId: 'meaningful-service', label: 'More time for meaningful service', detail: 'Measure preparation effort, repeat work, quality, trust, and adoption.', x: 0.95 }
    ],
    owner: 'Member Services workflow owner',
    adoptionBurden: 'Moderate: context design, privacy controls, quality review, coaching, and workflow fit.',
    measurement: ['preparation effort', 'repeat work', 'quality', 'member trust signals', 'adoption'],
    disposition: {
      label: 'Human-led; AI support bounded',
      tone: 'human',
      basis: 'Illustrative posture aligned to Highmark’s public description of AI as a teammate with humans at the helm.'
    },
    publicBoundary: 'Not a claim about Highmark service-center tools, handle time, or member-data access.',
    sourceNotes: ['Highmark AI: AI as teammate, not replacement', 'Highmark AI: safe, protected workforce enablement']
  })
]);

const scenariosById = new Map(SCENARIOS.map(item => [item.id, item]));

export function getScenario(id) {
  const scenario = scenariosById.get(id);
  if (!scenario) throw new Error(`Unknown topology scenario: ${id}`);
  return scenario;
}

/** Real backend LangGraph / heuristic nodes — do not invent extras. */
export const PIPELINE_NODES = [
  'validate',
  'safety',
  'classify_extract',
  'retrieve_similar',
  'cluster',
  'rag_departments',
  'route_department',
  'priority',
  'evaluate',
] as const;

export type PipelineNode = (typeof PIPELINE_NODES)[number];

export const PIPELINE_LABEL: Record<PipelineNode, string> = {
  validate: 'Validate',
  safety: 'Safety',
  classify_extract: 'Classify',
  retrieve_similar: 'Similar',
  cluster: 'Cluster',
  rag_departments: 'Departments',
  route_department: 'Route',
  priority: 'Priority',
  evaluate: 'Evaluate',
};

/** Government panel refresh — one step per live API call. */
export const GOV_REFRESH_STAGES = [
  'complaints',
  'clusters',
  'overview',
  'briefing',
  'trends',
  'departments',
] as const;

export const GOV_REFRESH_LABEL: Record<(typeof GOV_REFRESH_STAGES)[number], string> = {
  complaints: 'Complaint queue',
  clusters: 'Issue clusters',
  overview: 'Operations overview',
  briefing: 'Intelligence briefing',
  trends: 'Filing trends',
  departments: 'Department ranks',
};

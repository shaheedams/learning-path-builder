export interface AvailableComponent {
  id: string;
  title: string;
  shortDescription: string;
  type: 'unit' | 'assessment';
  approximateDurationMinutes: number;
  metadata: {
    assessment?: {
      maxScore: number;
      passingScore: number;
    };
    unit?: {
      recommendedMinutes: number;
    };
  };
}

export interface CanvasState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeConfig {
  approximateDurationMinutes?: number;
  assessment?: {
    maxScore: number;
    passingScore: number;
  };
  unit?: {
    recommendedMinutes: number;
  };
}

export interface CanvasNode {
  id: string;
  componentId: string;
  type: 'start' | 'unit' | 'assessment' | 'end';
  label: string;
  description?: string;
  position: NodePosition;
  config?: NodeConfig;
}

export interface ConditionRule {
  id: string;
  sourceType: 'unit' | 'assessment';
  sourceNodeId: string;
  metric:
    | 'completion'
    | 'passed'
    | 'score'
    | 'score_range'
    | 'time_spent_minutes'
    | 'percentage_completion';
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
  value?: boolean | number | string;
  range?: {
    min: number;
    max: number;
    minInclusive?: boolean;
    maxInclusive?: boolean;
  };
}

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  priority?: number;
  isDefault?: boolean;
  conditions: {
    operator: 'AND' | 'OR';
    rules: ConditionRule[];
  };
}

export interface LearningPath {
  id?: string;
  name: string;
  description?: string;
  status: 'draft' | 'published';
  version?: number;
  canvas: CanvasState;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

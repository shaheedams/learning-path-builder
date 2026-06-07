import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import {
  AvailableComponent,
  LearningPath,
  CanvasNode,
  CanvasEdge,
  ConditionRule,
} from '../models/learning-path.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  // Global States using Angular Signals
  availableComponents = signal<AvailableComponent[]>([]);
  savedPaths = signal<LearningPath[]>([]);

  currentPath = signal<LearningPath>({
    name: 'New Path',
    status: 'draft',
    canvas: { zoom: 1.0, offsetX: 0, offsetY: 0 },
    nodes: [],
    edges: [],
  });

  selectedNodeId = signal<string | null>(null);
  selectedEdgeId = signal<string | null>(null);
  connectingSourceNodeId = signal<string | null>(null);
  selectedPath = signal<string>(environment.defaultId);

  // Computed signals
  selectedNode = computed(() => {
    const id = this.selectedNodeId();
    return id ? this.currentPath().nodes.find((n) => n.id === id) || null : null;
  });

  selectedEdge = computed(() => {
    const id = this.selectedEdgeId();
    return id ? this.currentPath().edges.find((e) => e.id === id) || null : null;
  });

  constructor(private apiService: ApiService) {
    this.loadInitialData();
  }

  loadInitialData() {
    this.apiService.getComponents().subscribe({
      next: (res) => this.availableComponents.set(res.items || []),
      error: (err) => console.error('Failed to load components', err),
    });
    this.refreshPathsList();
  }

  refreshPathsList() {
    this.apiService.getLearningPaths().subscribe({
      next: (paths) => {
        this.savedPaths.set(paths || []);
        const samplePath = paths.find((p) => p.id === this.selectedPath());
        if (samplePath && samplePath.id) {
          this.loadPath(samplePath.id);
        } else {
          this.createNewPath();
        }
      },
      error: (err) => {
        console.error('Failed to load saved paths', err);
        this.createNewPath();
      },
    });
  }

  createNewPath() {
    const startNodeId = 'start-' + Math.random().toString(36).substr(2, 9);
    const endNodeId = 'end-' + Math.random().toString(36).substr(2, 9);

    const newPath: LearningPath = {
      id: undefined,
      name: 'Untitled Path',
      description: 'Create customized learner traversal flows',
      status: 'draft',
      version: 1,
      canvas: { zoom: 1.0, offsetX: 0, offsetY: 0 },
      nodes: [
        {
          id: startNodeId,
          componentId: 'system-start',
          type: 'start',
          label: 'Start Assessment',
          position: { x: 50, y: 200 },
        },
        {
          id: endNodeId,
          componentId: 'system-end',
          type: 'end',
          label: 'Complete Assessment',
          position: { x: 750, y: 200 },
        },
      ],
      edges: [],
    };
    this.currentPath.set(newPath);
    this.deselectAll();
  }

  loadPath(id: string) {
    this.apiService.getLearningPathById(id).subscribe({
      next: (path) => {
        // Self-healing check: Ensure start and end nodes exist in the loaded path
        let updated = false;
        const nodes = [...path.nodes];

        const hasStart = nodes.some((n) => n.type === 'start');
        const hasEnd = nodes.some((n) => n.type === 'end');

        if (!hasStart) {
          const startNodeId = 'start-' + Math.random().toString(36).substr(2, 9);
          nodes.push({
            id: startNodeId,
            componentId: 'system-start',
            type: 'start',
            label: 'Start Assessment',
            position: { x: 50, y: 200 },
          });
          updated = true;
        }

        if (!hasEnd) {
          const endNodeId = 'end-' + Math.random().toString(36).substr(2, 9);
          nodes.push({
            id: endNodeId,
            componentId: 'system-end',
            type: 'end',
            label: 'Complete Assessment',
            position: { x: 750, y: 200 },
          });
          updated = true;
        }

        if (updated) {
          path.nodes = nodes;
          // Auto-save the repaired path back to the H2 database
          this.apiService.saveLearningPath(path).subscribe({
            next: (saved) => {
              this.currentPath.set(saved);
              this.refreshPathsList();
              this.deselectAll();
            },
            error: (err) => {
              console.error('Failed to auto-save self-healed path', err);
              this.currentPath.set(path);
              this.deselectAll();
            },
          });
        } else {
          this.currentPath.set(path);
          this.deselectAll();
        }
      },
      error: (err) => console.error('Failed to load path', err),
    });
  }

  savePath() {
    const path = this.currentPath();
    this.apiService.saveLearningPath(path).subscribe({
      next: (saved) => {
        this.currentPath.set(saved);
        this.refreshPathsList();
        this.selectedPath.set(saved?.id!);
      },
      error: (err) => console.error('Failed to save learning path', err),
    });
  }

  // --- NODE ACTIONS ---

  addNode(component: AvailableComponent, x: number, y: number) {
    const path = this.currentPath();
    const nodeId = 'node-' + Math.random().toString(36).substr(2, 9);

    const nodeConfig: any = {
      approximateDurationMinutes: component.approximateDurationMinutes,
    };
    if (component.type === 'assessment' && component.metadata.assessment) {
      nodeConfig.assessment = {
        maxScore: component.metadata.assessment.maxScore,
        passingScore: component.metadata.assessment.passingScore,
      };
    }
    if (component.type === 'unit' && component.metadata.unit) {
      nodeConfig.unit = {
        recommendedMinutes: component.metadata.unit.recommendedMinutes,
      };
    }

    const newNode: CanvasNode = {
      id: nodeId,
      componentId: component.id,
      type: component.type,
      label: component.title,
      description: component.shortDescription,
      position: { x, y },
      config: nodeConfig,
    };

    this.currentPath.set({
      ...path,
      nodes: [...path.nodes, newNode],
    });
    this.selectedNodeId.set(nodeId);
    this.selectedEdgeId.set(null);
  }

  updateNodePosition(id: string, x: number, y: number) {
    const path = this.currentPath();
    this.currentPath.set({
      ...path,
      nodes: path.nodes.map((n) => (n.id === id ? { ...n, position: { x, y } } : n)),
    });
  }

  updateNodeLabelAndConfig(
    id: string,
    label: string,
    description: string,
    duration?: number,
    maxScore?: number,
    passingScore?: number,
    recommendedMinutes?: number
  ) {
    const path = this.currentPath();
    this.currentPath.set({
      ...path,
      nodes: path.nodes.map((n) => {
        if (n.id !== id) return n;
        const config = { ...n.config };
        if (duration !== undefined) config.approximateDurationMinutes = duration;
        if (n.type === 'assessment' && maxScore !== undefined && passingScore !== undefined) {
          config.assessment = { maxScore, passingScore };
        }
        if (n.type === 'unit' && recommendedMinutes !== undefined) {
          config.unit = { recommendedMinutes };
        }
        return { ...n, label, description, config };
      }),
    });
  }

  deleteNode(id: string) {
    const node = this.currentPath().nodes.find((n) => n.id === id);
    if (node && (node.type === 'start' || node.type === 'end')) return; // Cannot delete terminal system nodes

    const path = this.currentPath();
    this.currentPath.set({
      ...path,
      nodes: path.nodes.filter((n) => n.id !== id),
      // Clean up connection links connected to this node
      edges: path.edges.filter((e) => e.sourceNodeId !== id && e.targetNodeId !== id),
    });
    if (this.selectedNodeId() === id) {
      this.selectedNodeId.set(null);
    }
  }

  // --- CONNECTION (EDGE) ACTIONS ---

  startConnection(sourceId: string) {
    this.connectingSourceNodeId.set(sourceId);
  }

  completeConnection(targetId: string) {
    const sourceId = this.connectingSourceNodeId();
    this.connectingSourceNodeId.set(null);

    if (!sourceId || sourceId === targetId) return;

    const path = this.currentPath();

    // Prevent duplicate connections between same nodes
    const exists = path.edges.some(
      (e) => e.sourceNodeId === sourceId && e.targetNodeId === targetId
    );
    if (exists) return;

    const edgeId = 'edge-' + Math.random().toString(36).substr(2, 9);
    const newEdge: CanvasEdge = {
      id: edgeId,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      label: 'Transition',
      priority: 1,
      isDefault: false,
      conditions: {
        operator: 'AND',
        rules: [],
      },
    };

    this.currentPath.set({
      ...path,
      edges: [...path.edges, newEdge],
    });
    this.selectedEdgeId.set(edgeId);
    this.selectedNodeId.set(null);
  }

  updateEdgeConfig(
    id: string,
    label: string,
    priority: number,
    isDefault: boolean,
    operator: 'AND' | 'OR'
  ) {
    const path = this.currentPath();
    this.currentPath.set({
      ...path,
      edges: path.edges.map((e) =>
        e.id === id
          ? {
              ...e,
              label,
              priority,
              isDefault,
              conditions: {
                ...e.conditions,
                operator,
              },
            }
          : e
      ),
    });
  }

  deleteEdge(id: string) {
    const path = this.currentPath();
    this.currentPath.set({
      ...path,
      edges: path.edges.filter((e) => e.id !== id),
    });
    if (this.selectedEdgeId() === id) {
      this.selectedEdgeId.set(null);
    }
  }

  // --- CONDITION RULES MANAGEMENT ---

  addConditionRule(edgeId: string, rule: Omit<ConditionRule, 'id'>) {
    const path = this.currentPath();
    const ruleId = 'rule-' + Math.random().toString(36).substr(2, 9);
    const newRule: ConditionRule = {
      ...rule,
      id: ruleId,
    };

    this.currentPath.set({
      ...path,
      edges: path.edges.map((e) => {
        if (e.id !== edgeId) return e;
        return {
          ...e,
          conditions: {
            ...e.conditions,
            rules: [...e.conditions.rules, newRule],
          },
        };
      }),
    });
  }

  deleteConditionRule(edgeId: string, ruleId: string) {
    const path = this.currentPath();
    this.currentPath.set({
      ...path,
      edges: path.edges.map((e) => {
        if (e.id !== edgeId) return e;
        return {
          ...e,
          conditions: {
            ...e.conditions,
            rules: e.conditions.rules.filter((r) => r.id !== ruleId),
          },
        };
      }),
    });
  }

  // --- CANVAS VIEW CONTROL ACTIONS ---

  updateCanvasPan(offsetX: number, offsetY: number) {
    const path = this.currentPath();
    this.currentPath.set({
      ...path,
      canvas: { ...path.canvas, offsetX, offsetY },
    });
  }

  updateCanvasZoom(zoom: number) {
    const path = this.currentPath();
    this.currentPath.set({
      ...path,
      canvas: { ...path.canvas, zoom },
    });
  }

  deselectAll() {
    this.selectedNodeId.set(null);
    this.selectedEdgeId.set(null);
    this.connectingSourceNodeId.set(null);
  }
}

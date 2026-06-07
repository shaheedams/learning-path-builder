import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../services/state.service';
import { CanvasNode, CanvasEdge, ConditionRule } from '../../models/learning-path.model';

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './right-panel.component.html',
  styleUrl: './right-panel.component.css'
})
export class RightPanelComponent {
  // New Rule Form Bindings
  ruleSourceId: string = '';
  ruleMetric: string = '';
  ruleOperator: string = '';
  
  // Polymorphic values
  ruleValueBool: boolean = true;
  ruleValueNum: number = 0;
  ruleValueStr: string = '';
  
  // Range values
  ruleRangeMin: number = 0;
  ruleRangeMax: number = 100;
  ruleMinInc: boolean = true;
  ruleMaxInc: boolean = true;

  constructor(public stateService: StateService) {}

  // --- GENERAL PATH SAVE FIELD UPDATES ---

  updatePathMeta(field: 'name' | 'description' | 'status', event: Event) {
    const val = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
    const current = this.stateService.currentPath();
    this.stateService.currentPath.set({
      ...current,
      [field]: val
    });
  }

  // --- SELECTED NODE CONFIG UPDATES ---

  onNodeLabelChange(node: CanvasNode, event: Event) {
    const label = (event.target as HTMLInputElement).value;
    this.stateService.updateNodeLabelAndConfig(
      node.id, 
      label, 
      node.description || '',
      node.config?.approximateDurationMinutes,
      node.config?.assessment?.maxScore,
      node.config?.assessment?.passingScore
    );
  }

  onNodeDescChange(node: CanvasNode, event: Event) {
    const desc = (event.target as HTMLTextAreaElement).value;
    this.stateService.updateNodeLabelAndConfig(
      node.id,
      node.label,
      desc,
      node.config?.approximateDurationMinutes,
      node.config?.assessment?.maxScore,
      node.config?.assessment?.passingScore
    );
  }

  onNodeDurationChange(node: CanvasNode, event: Event) {
    const dur = parseInt((event.target as HTMLInputElement).value) || 0;
    this.stateService.updateNodeLabelAndConfig(
      node.id,
      node.label,
      node.description || '',
      dur,
      node.config?.assessment?.maxScore,
      node.config?.assessment?.passingScore
    );
  }

  onNodeScoresChange(node: CanvasNode, type: 'max' | 'passing', event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value) || 0;
    const currentMax = node.config?.assessment?.maxScore || 100;
    const currentPass = node.config?.assessment?.passingScore || 50;
    
    const max = type === 'max' ? val : currentMax;
    const pass = type === 'passing' ? val : currentPass;

    this.stateService.updateNodeLabelAndConfig(
      node.id,
      node.label,
      node.description || '',
      node.config?.approximateDurationMinutes,
      max,
      pass
    );
  }

  onNodeRecMinutesChange(node: CanvasNode, event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value) || 0;
    this.stateService.updateNodeLabelAndConfig(
      node.id,
      node.label,
      node.description || '',
      node.config?.approximateDurationMinutes,
      node.config?.assessment?.maxScore,
      node.config?.assessment?.passingScore,
      val
    );
  }

  onDeleteNode(nodeId: string) {
    this.stateService.deleteNode(nodeId);
  }

  // --- SELECTED CONNECTION (EDGE) CONFIG UPDATES ---

  onEdgeChange(edge: CanvasEdge, field: 'label' | 'priority' | 'isDefault' | 'operator', event: Event) {
    const label = field === 'label' ? (event.target as HTMLInputElement).value : edge.label || 'Transition';
    const priority = field === 'priority' ? parseInt((event.target as HTMLInputElement).value) || 1 : edge.priority || 1;
    const isDefault = field === 'isDefault' ? (event.target as HTMLInputElement).checked : edge.isDefault || false;
    const operator = field === 'operator' ? (event.target as HTMLSelectElement).value as 'AND' | 'OR' : edge.conditions.operator;

    this.stateService.updateEdgeConfig(edge.id, label, priority, isDefault, operator);
  }

  onDeleteEdge(edgeId: string) {
    this.stateService.deleteEdge(edgeId);
  }

  // --- CONDITIONAL RULES FORM CONTROL LOGIC ---

  getAvailableSources(): CanvasNode[] {
    const edge = this.stateService.selectedEdge();
    if (!edge) return [];

    // Filter nodes on canvas, excluding start, end, and target node to avoid circular routing references
    return this.stateService.currentPath().nodes.filter(
      n => n.type !== 'start' && n.type !== 'end' && n.id !== edge.targetNodeId
    );
  }

  onSourceNodeChange() {
    this.ruleMetric = '';
    this.ruleOperator = '';
    const node = this.stateService.currentPath().nodes.find(n => n.id === this.ruleSourceId);
    if (node) {
      if (node.type === 'assessment') {
        this.ruleMetric = 'completion';
      } else {
        this.ruleMetric = 'completion';
      }
      this.onMetricChange();
    }
  }

  onMetricChange() {
    if (this.ruleMetric === 'completion' || this.ruleMetric === 'passed') {
      this.ruleOperator = 'eq';
    } else {
      this.ruleOperator = 'gte';
    }
  }

  getSourceNodeTypeName(): string {
    const node = this.stateService.currentPath().nodes.find(n => n.id === this.ruleSourceId);
    return node ? node.type : '';
  }

  addConditionRule(edgeId: string) {
    if (!this.ruleSourceId || !this.ruleMetric || !this.ruleOperator) return;

    const sourceNode = this.stateService.currentPath().nodes.find(n => n.id === this.ruleSourceId);
    if (!sourceNode) return;

    let value: any = undefined;
    let range: any = undefined;

    if (this.ruleMetric === 'completion' || this.ruleMetric === 'passed') {
      value = this.ruleValueBool;
    } else if (this.ruleOperator === 'between' || this.ruleMetric === 'score_range') {
      range = {
        min: this.ruleRangeMin,
        max: this.ruleRangeMax,
        minInclusive: this.ruleMinInc,
        maxInclusive: this.ruleMaxInc
      };
    } else {
      value = this.ruleValueNum;
    }

    const rule: Omit<ConditionRule, 'id'> = {
      sourceType: sourceNode.type as 'unit' | 'assessment',
      sourceNodeId: this.ruleSourceId,
      metric: this.ruleMetric as any,
      operator: this.ruleOperator as any,
      value,
      range
    };

    this.stateService.addConditionRule(edgeId, rule);

    // Reset Form fields
    this.ruleSourceId = '';
    this.ruleMetric = '';
    this.ruleOperator = '';
  }

  deleteConditionRule(edgeId: string, ruleId: string) {
    this.stateService.deleteConditionRule(edgeId, ruleId);
  }

  getSourceNodeLabel(nodeId: string): string {
    const node = this.stateService.currentPath().nodes.find(n => n.id === nodeId);
    return node ? node.label : nodeId;
  }
}

import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';
import {
  CanvasNode,
  CanvasEdge,
  NodePosition,
  AvailableComponent,
} from '../../models/learning-path.model';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css',
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;

  canvasEl!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;

  // Interaction State Variables
  draggedNode: CanvasNode | null = null;
  dragOffsetX = 0;
  dragOffsetY = 0;

  isPanning = false;
  panStartX = 0;
  panStartY = 0;

  // Temporary wire drawing coords
  isDrawingWire = false;
  wireSourceNodeId: string | null = null;
  currentMousePos = { x: 0, y: 0 }; // in model space

  portRadius = 4;
  nodeWidth = 230;
  nodeHeight = 75;
  startEndHeight = 58;

  constructor(public stateService: StateService) {
    // Angular 21 Reactive Effect: Redraw canvas whenever stateService signals change!
    effect(() => {
      // Trigger dependency tracks
      this.stateService.currentPath();
      this.stateService.selectedNodeId();
      this.stateService.selectedEdgeId();
      this.stateService.connectingSourceNodeId();

      // Execute redraw
      if (this.ctx) {
        this.drawScene();
      }
    });
  }

  ngAfterViewInit(): void {
    this.canvasEl = this.canvasRef.nativeElement;
    this.ctx = this.canvasEl.getContext('2d')!;
    this.resizeCanvas();
  }

  @HostListener('window:resize')
  resizeCanvas() {
    if (!this.canvasEl || !this.ctx) return;

    const width = this.canvasEl.parentElement?.clientWidth || window.innerWidth;
    const height = this.canvasEl.parentElement?.clientHeight || window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    this.canvasEl.width = width * pixelRatio;
    this.canvasEl.height = height * pixelRatio;
    this.canvasEl.style.width = `${width}px`;
    this.canvasEl.style.height = `${height}px`;

    this.drawScene();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const componentId = event.dataTransfer?.getData('text/plain');
    if (!componentId) return;

    let component: AvailableComponent | undefined;
    if (componentId === 'new-unit') {
      component = {
        id: 'custom-unit-' + Math.random().toString(36).substr(2, 9),
        title: 'New Unit',
        shortDescription: 'Configure unit properties',
        type: 'unit',
        approximateDurationMinutes: 30,
        metadata: {
          unit: { recommendedMinutes: 20 },
        },
      };
    } else if (componentId === 'new-assessment') {
      component = {
        id: 'custom-assess-' + Math.random().toString(36).substr(2, 9),
        title: 'New Assessment',
        shortDescription: 'Configure assessment properties',
        type: 'assessment',
        approximateDurationMinutes: 30,
        metadata: {
          assessment: { maxScore: 100, passingScore: 50 },
        },
      };
    } else {
      component = this.stateService.availableComponents().find((c) => c.id === componentId);
    }
    if (!component) return;

    const rect = this.canvasEl.getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    const path = this.stateService.currentPath();
    const zoom = path.canvas.zoom;
    const offsetX = path.canvas.offsetX;
    const offsetY = path.canvas.offsetY;

    // Convert screen coordinates into scale-independent model coordinates, centering the node card
    const x = (clientX - offsetX) / zoom - this.nodeWidth / 2;
    const y = (clientY - offsetY) / zoom - this.nodeHeight / 2;

    this.stateService.addNode(component, Math.round(x), Math.round(y));
  }

  drawScene() {
    const canvas = this.canvasEl;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;

    const pixelRatio = window.devicePixelRatio || 1;
    const path = this.stateService.currentPath();
    const zoom = path.canvas.zoom;
    const offsetX = path.canvas.offsetX;
    const offsetY = path.canvas.offsetY;

    // Reset transformation and clear raw pixels
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply combined transformations: display ratio * translation * zoom
    ctx.scale(pixelRatio, pixelRatio);
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);

    // 1. Draw Infinite Grid
    this.drawGrid(ctx, zoom, offsetX, offsetY);

    // 2. Draw Connection Lines (Edges)
    path.edges.forEach((edge) => {
      this.drawConnectionLine(ctx, edge);
    });

    // 3. Draw Temporary Connection Wire
    if (this.stateService.connectingSourceNodeId()) {
      const sourceId = this.stateService.connectingSourceNodeId()!;
      const sourceNode = path.nodes.find((n) => n.id === sourceId);
      if (sourceNode) {
        const startPos = this.getPortPosition(sourceNode, 'bottom');
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(this.currentMousePos.x, this.currentMousePos.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#94a3b8';
        ctx.stroke();
      }
    }

    // 4. Draw Node Cards
    path.nodes.forEach((node) => {
      this.drawNodeCard(ctx, node);
    });
  }

  // --- DRAWING CODE COMMANDS ---

  drawGrid(
    ctx: CanvasRenderingContext2D,
    zoom: number,
    offsetX: number,
    offsetY: number,
    size = 40
  ) {
    ctx.beginPath();
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;

    const width = this.canvasEl.width / (window.devicePixelRatio || 1);
    const height = this.canvasEl.height / (window.devicePixelRatio || 1);

    // Calculate visible boundaries in model space
    const minX = -offsetX / zoom;
    const maxX = (width - offsetX) / zoom;
    const minY = -offsetY / zoom;
    const maxY = (height - offsetY) / zoom;

    // Align start coordinates to the grid size
    const startX = Math.floor(minX / size) * size;
    const startY = Math.floor(minY / size) * size;

    // Draw vertical lines
    for (let x = startX; x < maxX; x += size) {
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
    }

    // Draw horizontal lines
    for (let y = startY; y < maxY; y += size) {
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
    }
    ctx.stroke();
  }

  drawConnectionLine(ctx: CanvasRenderingContext2D, edge: CanvasEdge) {
    const path = this.stateService.currentPath();
    const source = path.nodes.find((n) => n.id === edge.sourceNodeId);
    const target = path.nodes.find((n) => n.id === edge.targetNodeId);
    if (!source || !target) return;

    const startPos = this.getPortPosition(source, 'bottom');
    const endPos = this.getPortPosition(target, 'top');

    // Bezier control points calculation
    const dy = endPos.y - startPos.y;
    const controlY1 = startPos.y + Math.max(dy / 2, 40);
    const controlY2 = endPos.y - Math.max(dy / 2, 40);

    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.bezierCurveTo(startPos.x, controlY1, endPos.x, controlY2, endPos.x, endPos.y);

    // Color definitions
    const isSelected = this.stateService.selectedEdgeId() === edge.id;
    const isAssessment = source.type === 'assessment';

    ctx.lineWidth = isSelected ? 4 : 3;
    ctx.strokeStyle = isSelected ? '#2563eb' : '#cbd5e1';

    if (isAssessment) {
      ctx.setLineDash([4, 4]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash for other drawings

    // // Draw Edge Label in the middle
    // if (edge.label) {
    //   const midPoint = this.getBezierPoint(
    //     0.5,
    //     startPos,
    //     { x: startPos.x, y: controlY1 },
    //     { x: endPos.x, y: controlY2 },
    //     endPos
    //   );
    //   ctx.font = '10px Arial';
    //   ctx.fillStyle = '#64748b';
    //   ctx.textAlign = 'center';
    //   ctx.fillText(edge.label, midPoint.x, midPoint.y - 6);
    // }
  }

  drawNodeCard(ctx: CanvasRenderingContext2D, node: CanvasNode) {
    const isSelected = this.stateService.selectedNodeId() === node.id;

    // Card background fill with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.roundRect(
      node.position.x,
      node.position.y,
      this.nodeWidth,
      node.type === 'start' || node.type === 'end' ? this.startEndHeight : this.nodeHeight,
      8
    );
    // ctx.fillStyle = '#f5f3ff';

    if (node.type === 'start') ctx.fillStyle = 'rgb(241 252 244)';
    else if (node.type === 'unit') ctx.fillStyle = 'rgb(238 247 254)';
    else if (node.type === 'assessment') ctx.fillStyle = 'rgb(251 245 255)';
    else ctx.fillStyle = 'rgb(247 251 254)';
    ctx.fill();
    ctx.restore();

    // Determine type-specific outline colors
    let typeColor = '#64748b';
    if (node.type === 'start') typeColor = '#22c55e';
    else if (node.type === 'unit') typeColor = '#3b82f6';
    else if (node.type === 'assessment') typeColor = '#8b5cf6';

    // Card border
    ctx.beginPath();
    ctx.roundRect(
      node.position.x,
      node.position.y,
      this.nodeWidth,
      node.type === 'start' || node.type === 'end' ? this.startEndHeight : this.nodeHeight,
      8
    );
    ctx.lineWidth = isSelected ? 2.5 : 1.25;
    ctx.strokeStyle = isSelected ? '#3b82f6' : typeColor;
    ctx.stroke();

    // Left icon container box
    const iconSize = 32;
    const iconX = node.position.x + 14;
    const iconY =
      node.position.y +
      ((node.type === 'start' || node.type === 'end' ? this.startEndHeight : this.nodeHeight) -
        iconSize) /
        2;

    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, 6);
    if (node.type === 'start') {
      ctx.fillStyle = '#22c55e';
    } else if (node.type === 'unit') {
      ctx.fillStyle = '#3b82f6';
    } else if (node.type === 'assessment') {
      ctx.fillStyle = '#8b5cf6';
    } else {
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
    }
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();

    // Render Vector Icons inside container
    const cx = iconX + iconSize / 2;
    const cy = iconY + iconSize / 2;

    if (node.type === 'start') {
      // Triangle Play icon
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.strokeStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
    } else if (node.type === 'unit') {
      // Document Outline icon
      ctx.strokeStyle = '#eff6ff';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.strokeRect(cx - 7, cy - 7, 13, 13);
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (node.type === 'assessment') {
      // Stacked Layers icon
      ctx.strokeStyle = '#f5f3ff';
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';

      // Top diamond
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 2.5);
      ctx.lineTo(cx, cy - 5);
      ctx.lineTo(cx + 5, cy - 2.5);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.stroke();

      // Bottom layer
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy + 1.5);
      ctx.lineTo(cx, cy + 4);
      ctx.lineTo(cx + 5, cy + 1.5);
      ctx.stroke();
    } else if (node.type === 'end') {
      // Target Check icon
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
    }

    // Render Titles, Subtitles, and Group Badges
    const textStartX = iconX + iconSize + 12;

    if (node.type === 'start' || node.type === 'end') {
      // Center terminal labels vertically
      ctx.fillStyle = node.type === 'start' ? '#16a34a' : '#475569';
      ctx.font = 'bold 13px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(node.label, textStartX, node.position.y + this.startEndHeight / 2 + 4);
    } else {
      // Draw Label
      const titleColor = node.type === 'assessment' ? '#7c3aed' : '#1e293b';
      ctx.fillStyle = titleColor;
      ctx.font = 'bold 13px "Inter", sans-serif';
      ctx.textAlign = 'left';
      let titleText = node.label;
      if (titleText.length > 20) {
        titleText = titleText.substring(0, 20) + '...';
      }
      ctx.fillText(titleText, textStartX, node.position.y + 32);

      // Draw description/meta subtitle
      if (node.description) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px "Inter", sans-serif';
        ctx.textAlign = 'left';
        let descText = node.description;
        if (descText.length > 36) {
          descText = descText.substring(0, 33) + '...';
        }
        ctx.fillText(descText, textStartX, node.position.y + 50);
      }
    }

    // Render connection port dots (inputs/outputs)
    if (node.type !== 'start') {
      this.drawPortDot(ctx, this.getPortPosition(node, 'top'));
    }
    if (node.type !== 'end') {
      this.drawPortDot(ctx, this.getPortPosition(node, 'bottom'));
    }
  }

  drawPortDot(ctx: CanvasRenderingContext2D, pos: { x: number; y: number }) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.portRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pos.x + 0.2, pos.y + 0.2, this.portRadius - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
  }

  // --- MATHEMATICAL HELPERS ---

  getPortPosition(node: CanvasNode, type: 'top' | 'bottom'): NodePosition {
    return {
      x: node.position.x + this.nodeWidth / 2,
      y:
        type === 'top'
          ? node.position.y
          : node.position.y +
            (node.type === 'start' || node.type === 'end' ? this.startEndHeight : this.nodeHeight),
    };
  }

  getBezierPoint(
    t: number,
    p0: NodePosition,
    p1: NodePosition,
    p2: NodePosition,
    p3: NodePosition
  ): NodePosition {
    const omt = 1 - t;
    const omt2 = omt * omt;
    const omt3 = omt2 * omt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: omt3 * p0.x + 3 * omt2 * t * p1.x + 3 * omt * t2 * p2.x + t3 * p3.x,
      y: omt3 * p0.y + 3 * omt2 * t * p1.y + 3 * omt * t2 * p2.y + t3 * p3.y,
    };
  }

  // Calculate mouse position relative to canvas client bounds in scaled/panned model space
  getMousePos(event: MouseEvent): NodePosition {
    const rect = this.canvasEl.getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    const path = this.stateService.currentPath();
    const zoom = path.canvas.zoom;
    const offsetX = path.canvas.offsetX;
    const offsetY = path.canvas.offsetY;

    return {
      x: (clientX - offsetX) / zoom,
      y: (clientY - offsetY) / zoom,
    };
  }

  isClickInPort(mouse: NodePosition, port: NodePosition): boolean {
    const dx = mouse.x - port.x;
    const dy = mouse.y - port.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.portRadius + 4; // +4px padding
  }

  getHoveredPort(mouse: NodePosition) {
    const path = this.stateService.currentPath();
    for (const node of path.nodes) {
      if (node.type !== 'start') {
        const topPort = this.getPortPosition(node, 'top');
        if (this.isClickInPort(mouse, topPort)) return { node, type: 'top' as const };
      }
      if (node.type !== 'end') {
        const bottomPort = this.getPortPosition(node, 'bottom');
        if (this.isClickInPort(mouse, bottomPort)) return { node, type: 'bottom' as const };
      }
    }
    return null;
  }

  // Check if click was on a cubic Bezier connection line
  getClickedEdge(mouse: NodePosition): CanvasEdge | null {
    const path = this.stateService.currentPath();

    for (const edge of path.edges) {
      const source = path.nodes.find((n) => n.id === edge.sourceNodeId);
      const target = path.nodes.find((n) => n.id === edge.targetNodeId);
      if (!source || !target) continue;

      const start = this.getPortPosition(source, 'bottom');
      const end = this.getPortPosition(target, 'top');
      const dy = end.y - start.y;
      const controlY1 = start.y + Math.max(dy / 2, 40);
      const controlY2 = end.y - Math.max(dy / 2, 40);

      // Evaluate 10 points along the Bezier curve
      for (let t = 0.1; t <= 0.9; t += 0.1) {
        const pt = this.getBezierPoint(
          t,
          start,
          { x: start.x, y: controlY1 },
          { x: end.x, y: controlY2 },
          end
        );
        const dx = mouse.x - pt.x;
        const dyClick = mouse.y - pt.y;
        if (Math.sqrt(dx * dx + dyClick * dyClick) <= 8) {
          // Click threshold 8px
          return edge;
        }
      }
    }
    return null;
  }

  // --- MOUSE LISTENERS ---

  onMouseDown(event: MouseEvent) {
    const mouse = this.getMousePos(event);

    // 1. Did we click a connection port?
    const hoveredPort = this.getHoveredPort(mouse);
    if (hoveredPort) {
      if (hoveredPort.type === 'bottom') {
        // Start drawing connection link
        this.stateService.startConnection(hoveredPort.node.id);
      } else if (hoveredPort.type === 'top' && this.stateService.connectingSourceNodeId()) {
        // Complete connection link
        this.stateService.completeConnection(hoveredPort.node.id);
      }
      return;
    }

    // 2. Did we click a node card body?
    const path = this.stateService.currentPath();
    for (let i = path.nodes.length - 1; i >= 0; i--) {
      const node = path.nodes[i];
      const isInsideX = mouse.x >= node.position.x && mouse.x <= node.position.x + this.nodeWidth;
      const isInsideY = mouse.y >= node.position.y && mouse.y <= node.position.y + this.nodeHeight;

      if (isInsideX && isInsideY) {
        this.draggedNode = node;
        this.dragOffsetX = mouse.x - node.position.x;
        this.dragOffsetY = mouse.y - node.position.y;
        this.stateService.selectedNodeId.set(node.id);
        this.stateService.selectedEdgeId.set(null);
        return;
      }
    }

    // 3. Did we click a connection line (edge)?
    const clickedEdge = this.getClickedEdge(mouse);
    if (clickedEdge) {
      this.stateService.selectedEdgeId.set(clickedEdge.id);
      this.stateService.selectedNodeId.set(null);
      return;
    }

    // 4. Otherwise, start panning the background grid
    this.isPanning = true;
    this.panStartX = event.clientX - path.canvas.offsetX;
    this.panStartY = event.clientY - path.canvas.offsetY;
    this.stateService.deselectAll();
  }

  onMouseMove(event: MouseEvent) {
    const mouse = this.getMousePos(event);
    this.currentMousePos = mouse;

    if (this.stateService.connectingSourceNodeId()) {
      this.drawScene();
    } else if (this.draggedNode) {
      const x = Math.round(mouse.x - this.dragOffsetX);
      const y = Math.round(mouse.y - this.dragOffsetY);
      this.stateService.updateNodePosition(this.draggedNode.id, x, y);
    } else if (this.isPanning) {
      const path = this.stateService.currentPath();
      const offsetX = event.clientX - this.panStartX;
      const offsetY = event.clientY - this.panStartY;
      this.stateService.updateCanvasPan(offsetX, offsetY);
    }
  }

  onMouseUp(event: MouseEvent) {
    this.draggedNode = null;
    this.isPanning = false;

    // Handle completing a connection wire dropped on target input port
    if (this.stateService.connectingSourceNodeId()) {
      const mouse = this.getMousePos(event);
      const hoveredPort = this.getHoveredPort(mouse);
      if (hoveredPort && hoveredPort.type === 'top') {
        this.stateService.completeConnection(hoveredPort.node.id);
      } else {
        this.stateService.connectingSourceNodeId.set(null);
      }
    }
    this.drawScene();
  }

  // --- BUTTON ZOOM TRIGGER ACTIONS ---

  zoomIn() {
    const path = this.stateService.currentPath();
    if (path.canvas.zoom < 2.0) {
      this.stateService.updateCanvasZoom(parseFloat((path.canvas.zoom + 0.1).toFixed(1)));
    }
  }

  zoomOut() {
    const path = this.stateService.currentPath();
    if (path.canvas.zoom > 0.4) {
      this.stateService.updateCanvasZoom(parseFloat((path.canvas.zoom - 0.1).toFixed(1)));
    }
  }

  zoomReset() {
    this.stateService.updateCanvasZoom(1.0);
    this.stateService.updateCanvasPan(0, 0);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-left-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './left-panel.component.html',
  styleUrl: './left-panel.component.css'
})
export class LeftPanelComponent {
  constructor(public stateService: StateService) {}

  onDragStartCustom(event: DragEvent, componentId: string) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', componentId);
      event.dataTransfer.effectAllowed = 'copy';
    }
  }
}

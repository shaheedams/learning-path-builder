import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  selectedPathId!: string | null;
  constructor(public stateService: StateService) {
    effect(() => {
      this.stateService.selectedPath();
      this.selectedPathId = this.stateService.selectedPath();
    });
  }

  onPathChange() {
    if (this.selectedPathId) {
      this.stateService.selectedPath.set(this.selectedPathId);
      this.stateService.loadPath(this.selectedPathId);
    }
  }

  onSave() {
    this.stateService.savePath();
  }

  onPublish() {
    const path = this.stateService.currentPath();
    path.status = 'published';
    this.stateService.savePath();
  }

  onCreateNew() {
    this.selectedPathId = '';
    this.stateService.createNewPath();
  }
}

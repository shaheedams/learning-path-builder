import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { LeftPanelComponent } from './components/left-panel/left-panel.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { RightPanelComponent } from './components/right-panel/right-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    LeftPanelComponent,
    CanvasComponent,
    RightPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  title = 'np-learning-path-builder';
}

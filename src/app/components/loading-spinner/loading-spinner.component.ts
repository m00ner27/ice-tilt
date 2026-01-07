import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-8" [class]="containerClass">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" [class]="spinnerClass"></div>
      <p class="mt-2 text-gray-400" *ngIf="message">{{ message }}</p>
    </div>
  `,
  styles: []
})
export class LoadingSpinnerComponent {
  @Input() message: string = '';
  @Input() containerClass: string = '';
  @Input() spinnerClass: string = '';
}

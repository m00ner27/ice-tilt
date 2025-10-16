import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-pulse" [class]="containerClass">
      <div *ngIf="type === 'card'" class="bg-gray-700 rounded-lg p-4">
        <div class="flex items-center space-x-4 mb-4">
          <div class="rounded-full bg-gray-600 h-12 w-12"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-600 rounded w-3/4"></div>
            <div class="h-3 bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
        <div class="space-y-2">
          <div class="h-3 bg-gray-600 rounded"></div>
          <div class="h-3 bg-gray-600 rounded w-5/6"></div>
        </div>
      </div>
      
      <div *ngIf="type === 'list'" class="space-y-3">
        <div *ngFor="let item of [].constructor(count)" class="flex items-center space-x-4">
          <div class="rounded-full bg-gray-600 h-8 w-8"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-600 rounded w-3/4"></div>
            <div class="h-3 bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
      </div>
      
      <div *ngIf="type === 'table'" class="space-y-3">
        <div *ngFor="let item of [].constructor(count)" class="flex space-x-4">
          <div class="h-4 bg-gray-600 rounded flex-1"></div>
          <div class="h-4 bg-gray-600 rounded w-20"></div>
          <div class="h-4 bg-gray-600 rounded w-16"></div>
          <div class="h-4 bg-gray-600 rounded w-12"></div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SkeletonLoaderComponent {
  @Input() type: 'card' | 'list' | 'table' = 'card';
  @Input() count: number = 3;
  @Input() containerClass: string = '';
}

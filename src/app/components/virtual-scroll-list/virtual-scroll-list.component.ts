import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-virtual-scroll-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div 
      #scrollContainer 
      class="virtual-scroll-container"
      [style.height]="containerHeight + 'px'"
      (scroll)="onScroll($event)"
    >
      <div 
        class="virtual-scroll-spacer"
        [style.height]="totalHeight + 'px'"
      >
        <div 
          class="virtual-scroll-content"
          [style.transform]="'translateY(' + offsetY + 'px)'"
        >
          <ng-content 
            *ngFor="let item of visibleItems; trackBy: trackByFn; let i = index"
            [item]="item"
            [index]="startIndex + i"
          ></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .virtual-scroll-container {
      overflow-y: auto;
      position: relative;
    }
    .virtual-scroll-spacer {
      position: relative;
    }
    .virtual-scroll-content {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
    }
  `]
})
export class VirtualScrollListComponent implements AfterViewInit, OnDestroy {
  @Input() items: any[] = [];
  @Input() itemHeight: number = 100;
  @Input() containerHeight: number = 400;
  @Input() overscan: number = 5; // Extra items to render outside viewport
  @Output() itemClick = new EventEmitter<any>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  visibleItems: any[] = [];
  startIndex: number = 0;
  endIndex: number = 0;
  offsetY: number = 0;
  totalHeight: number = 0;

  private scrollTop: number = 0;

  ngAfterViewInit() {
    this.updateVisibleItems();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    this.scrollTop = target.scrollTop;
    this.updateVisibleItems();
  }

  private updateVisibleItems() {
    if (!this.items.length) {
      this.visibleItems = [];
      return;
    }

    const containerHeight = this.containerHeight;
    const itemHeight = this.itemHeight;
    const totalItems = this.items.length;
    
    this.totalHeight = totalItems * itemHeight;
    
    const visibleStart = Math.floor(this.scrollTop / itemHeight);
    const visibleEnd = Math.min(
      totalItems - 1,
      Math.ceil((this.scrollTop + containerHeight) / itemHeight)
    );
    
    this.startIndex = Math.max(0, visibleStart - this.overscan);
    this.endIndex = Math.min(totalItems - 1, visibleEnd + this.overscan);
    
    this.visibleItems = this.items.slice(this.startIndex, this.endIndex + 1);
    this.offsetY = this.startIndex * itemHeight;
  }

  trackByFn(index: number, item: any): any {
    return item.id || item._id || index;
  }
}

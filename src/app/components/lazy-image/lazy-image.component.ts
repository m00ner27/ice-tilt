import { Component, Input, ElementRef, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lazy-image',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <img 
      [src]="imageSrc" 
      [alt]="alt" 
      [class]="cssClass"
      (load)="onLoad()"
      (error)="onError()"
      [style]="imageStyle"
      loading="lazy"
    />
  `,
  styles: []
})
export class LazyImageComponent implements OnInit, OnDestroy {
  @Input() src: string = '';
  @Input() alt: string = '';
  @Input() cssClass: string = '';
  @Input() fallback: string = 'assets/images/1ithlwords.png';
  @Input() imageStyle: string = '';

  imageSrc: string = '';
  private observer?: IntersectionObserver;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.imageSrc = this.src;
            this.observer?.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px 0px', // Start loading 50px before image comes into view
        threshold: 0.1
      });

      this.observer.observe(this.el.nativeElement);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.imageSrc = this.src;
    }
  }

  onLoad() {
    // Image loaded successfully
  }

  onError() {
    this.imageSrc = this.fallback;
  }
}

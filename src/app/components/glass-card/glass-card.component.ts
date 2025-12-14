import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-glass-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="classes" 
         [class.interactive]="interactive"
         class="glass-panel relative overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-[30px] p-6 transition-all duration-300">
      
      <!-- Shine effect -->
      <div class="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
      
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .interactive:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      border-color: rgba(255,255,255,0.3);
    }
  `]
})
export class GlassCardComponent {
  @Input() interactive = false;
  @Input() className = '';

  get classes() {
    return `${this.className}`;
  }
}

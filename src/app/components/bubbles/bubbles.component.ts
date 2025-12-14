import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bubbles',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-aurora-dark">
      <!-- Blob 1 -->
      <div class="absolute top-0 -left-4 w-72 h-72 bg-aurora-purple rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      
      <!-- Blob 2 -->
      <div class="absolute top-0 -right-4 w-72 h-72 bg-aurora-blue rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      
      <!-- Blob 3 -->
      <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
    </div>
  `,
  styles: [`
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    .animation-delay-4000 {
      animation-delay: 4s;
    }
  `]
})
export class BubblesComponent { }

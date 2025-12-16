import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AudioService } from '../../services/audio.service';
import { Track } from '../../models/track.model';

@Component({
  selector: 'app-playlist-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 pointer-events-none">
      
      <!-- Backdrop -->
      <div *ngIf="isOpen" 
           [@backdrop]
           (click)="close.emit()"
           class="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto">
      </div>

      <!-- Drawer -->
      <div *ngIf="isOpen" 
           [@drawer] 
           class="absolute right-0 top-0 h-full w-full max-w-sm bg-aurora-dark/90 border-l border-white/10 shadow-2xl pointer-events-auto flex flex-col">
           
           <!-- Header -->
           <div class="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 class="text-white text-xl font-bold tracking-wider">UP NEXT</h2>
              <button (click)="close.emit()" class="text-white/50 hover:text-white transition-colors">
                <i class="fas fa-times text-2xl"></i>
              </button>
           </div>

           <!-- List -->
           <div class="flex-1 overflow-y-auto p-4 space-y-2">
              <div *ngFor="let track of playlist; let i = index" 
                   (click)="play(track)"
                   class="group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/10 border border-transparent"
                   [class.bg-white-10]="isActive(track)"
                   [class.border-aurora-blue-30]="isActive(track)">
                
                <!-- Art/Index -->
                <div class="relative w-12 h-12 rounded-lg overflow-hidden bg-black/30 flex-shrink-0">
                   <img [src]="track.cover" class="w-full h-full object-cover">
                   
                   <!-- Active Indicator -->
                   <div *ngIf="isActive(track)" class="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div class="flex gap-1 items-end h-4">
                         <div class="w-1 bg-aurora-blue animate-[bounce_0.8s_infinite] h-full"></div>
                         <div class="w-1 bg-aurora-purple animate-[bounce_1.2s_infinite] h-2/3"></div>
                         <div class="w-1 bg-aurora-blue animate-[bounce_1.0s_infinite] h-5/6"></div>
                      </div>
                   </div>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 flex justify-between items-center">
                   <div class="min-w-0">
                      <p class="text-white font-medium truncate group-hover:text-aurora-blue transition-colors">{{ track.title }}</p>
                      <p class="text-xs text-white/50 truncate">Track {{ i + 1 }}</p>
                   </div>
                   <i *ngIf="isFavorite(track)" class="fas fa-heart text-aurora-purple text-xs ml-2"></i>
                </div>

              </div>
           </div>

      </div>
    </div>
  `,
  animations: [
    trigger('backdrop', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('drawer', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('400ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class PlaylistDrawerComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  audio = inject(AudioService);
  playlist = this.audio.getPlaylist();

  // Use signal in template
  currentId = computed(() => this.audio.currentTrack()?.id);

  isActive(track: Track): boolean {
    return this.currentId() === track.id;
  }

  isFavorite(track: Track): boolean {
    return this.audio.isFavorite(track.id);
  }

  play(track: Track) {
    this.audio.play(track);
  }
}

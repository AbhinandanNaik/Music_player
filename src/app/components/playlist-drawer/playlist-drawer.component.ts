import { Component, Input, Output, EventEmitter, inject, computed, signal } from '@angular/core';
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
           
           <!-- Header & Search -->
           <div class="p-6 border-b border-white/10 bg-white/5 flex flex-col gap-4">
              <div class="flex justify-between items-center">
                  <h2 class="text-white text-xl font-bold tracking-wider">UP NEXT</h2>
                  <div class="flex items-center gap-4">
                  <!-- Sleep Timer -->
                  <div class="relative group">
                      <button class="text-white/50 hover:text-white transition-colors flex items-center gap-2">
                        <i class="fas fa-stopwatch"></i>
                        <span *ngIf="audio.timeRemaining()" class="text-xs font-mono text-aurora-purple">{{ formatTime(audio.timeRemaining() || 0) }}</span>
                      </button>
                      
                      <!-- Dropdown -->
                      <div class="absolute right-0 top-full mt-2 w-32 bg-aurora-dark border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                          <button (click)="audio.startSleepTimer(15)" class="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10">15 Mins</button>
                          <button (click)="audio.startSleepTimer(30)" class="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10">30 Mins</button>
                          <button (click)="audio.startSleepTimer(60)" class="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10">60 Mins</button>
                          <button *ngIf="audio.timeRemaining()" (click)="audio.cancelSleepTimer()" class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 border-t border-white/5">Stop Timer</button>
                      </div>
                  </div>

                  <button (click)="close.emit()" class="text-white/50 hover:text-white transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                  </button>
              </div>
              </div>
              
              <!-- Search Input -->
              <div class="relative group">
                  <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-aurora-blue transition-colors"></i>
                  <input 
                    #searchInput
                    type="text" 
                    placeholder="Search tracks..." 
                    [value]="searchQuery()"
                    (input)="onSearch($event)"
                    class="w-full bg-black/20 text-white pl-10 pr-10 py-2 rounded-lg border border-white/10 focus:border-aurora-blue focus:outline-none transition-colors placeholder:text-white/20">
                  
                  <!-- Clear Button -->
                  <button *ngIf="searchQuery()" 
                          (click)="clearSearch()"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                      <i class="fas fa-times-circle"></i>
                  </button>
              </div>
           </div>

           <!-- List -->
           <div class="flex-1 overflow-y-auto p-4 space-y-2">
              <div *ngFor="let track of filteredPlaylist(); let i = index" 
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
              
              <!-- Empty State -->
              <div *ngIf="filteredPlaylist().length === 0" class="text-center text-white/30 py-8">
                  <p>No tracks found</p>
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

  // Search
  searchQuery = signal('');

  filteredPlaylist = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.playlist.filter(t => t.title.toLowerCase().includes(query));
  });

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

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearSearch() {
    this.searchQuery.set('');
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService, RepeatMode } from './services/audio.service';
import { GlassCardComponent } from './components/glass-card/glass-card.component';
import { BubblesComponent } from './components/bubbles/bubbles.component';
import { PlaylistDrawerComponent } from './components/playlist-drawer/playlist-drawer.component';
import { VisualizerComponent } from './components/visualizer/visualizer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, GlassCardComponent, BubblesComponent, PlaylistDrawerComponent, VisualizerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  audio = inject(AudioService);

  isDrawerOpen = signal(false);
  RepeatMode = RepeatMode; // Expose Enum to template

  // Expose signals to template
  track = this.audio.currentTrack;
  isPlaying = this.audio.isPlaying;
  currentTime = this.audio.currentTime;
  duration = this.audio.duration;
  progress = this.audio.progress;
  isShuffleOn = this.audio.isShuffleOn;
  repeatMode = this.audio.repeatMode;

  formatTime(time: number): string {
    if (!time) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  onSeek(event: MouseEvent) {
    const element = event.currentTarget as HTMLElement;
    const width = element.clientWidth;
    const clickX = event.offsetX;
    const duration = this.duration();

    if (duration > 0) {
      const newTime = (clickX / width) * duration;
      this.audio.seek(newTime);
    }
  }
}

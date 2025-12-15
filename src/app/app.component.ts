import { Component, computed, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AudioService, RepeatMode } from './services/audio.service';
import { GlassCardComponent } from './components/glass-card/glass-card.component';
import { BubblesComponent } from './components/bubbles/bubbles.component';
import { PlaylistDrawerComponent } from './components/playlist-drawer/playlist-drawer.component';
import { VisualizerComponent } from './components/visualizer/visualizer.component';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, GlassCardComponent, BubblesComponent, PlaylistDrawerComponent, VisualizerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  audio = inject(AudioService);
  swUpdate = inject(SwUpdate);
  platformId = inject(PLATFORM_ID);

  isDrawerOpen = signal(false);
  RepeatMode = RepeatMode; // Expose Enum to template

  // PWA Signals
  installPrompt = signal<any>(null);
  showInstallButton = computed(() => !!this.installPrompt());
  updateAvailable = signal(false);

  // Expose signals to template
  track = this.audio.currentTrack;
  isPlaying = this.audio.isPlaying;
  currentTime = this.audio.currentTime;
  duration = this.audio.duration;
  progress = this.audio.progress;
  isShuffleOn = this.audio.isShuffleOn;
  repeatMode = this.audio.repeatMode;

  ngOnInit() {
    this.checkForUpdates();
    this.captureInstallPrompt();
  }

  checkForUpdates() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          this.updateAvailable.set(true);
        });
    }
  }

  reloadApp() {
    window.location.reload();
  }

  captureInstallPrompt() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        this.installPrompt.set(event);
      });
    }
  }

  async installApp() {
    const prompt = this.installPrompt();
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        this.installPrompt.set(null);
      }
    }
  }

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

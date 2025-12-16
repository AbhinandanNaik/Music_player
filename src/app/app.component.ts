import { Component, computed, inject, signal, OnInit, PLATFORM_ID, HostListener } from '@angular/core';
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
  volume = this.audio.volume;

  // Favorites Helper
  isFavorite = computed(() => {
    const t = this.track();
    return t ? this.audio.isFavorite(t.id) : false;
  });

  ngOnInit() {
    this.checkForUpdates();
    this.captureInstallPrompt();
  }

  // Keyboard Shortcuts
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ignore if typing in an input (if any)
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    switch (event.code) {
      case 'Space':
        event.preventDefault(); // Prevent scrolling
        this.audio.toggle();
        break;
      case 'ArrowRight':
        if (event.shiftKey) this.audio.next();
        else this.audio.seek(this.currentTime() + 5);
        break;
      case 'ArrowLeft':
        if (event.shiftKey) this.audio.prev();
        else this.audio.seek(this.currentTime() - 5);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.audio.setVolume(this.audio.volume() + 0.1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.audio.setVolume(this.audio.volume() - 0.1);
        break;
    }
  }

  toggleFavorite() {
    const t = this.track();
    if (t) this.audio.toggleFavorite(t.id);
  }

  onVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.audio.setVolume(parseFloat(input.value));
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

import { Injectable, signal, computed, effect } from '@angular/core';
import { Track } from '../models/track.model';
import playlistData from '../../assets/playlist.json';

@Injectable({
    providedIn: 'root'
})
export class AudioService {
    private audio = new Audio();
    private playlist: Track[] = playlistData as Track[];

    // Signals
    readonly currentTrack = signal<Track | null>(null);
    readonly isPlaying = signal(false);
    readonly currentTime = signal(0);
    readonly duration = signal(0);

    // Computed
    readonly progress = computed(() => {
        const d = this.duration();
        return d > 0 ? (this.currentTime() / d) * 100 : 0;
    });

    constructor() {
        this.initAudioEvents();
        // Load first track but don't play
        if (this.playlist.length > 0) {
            this.loadTrack(this.playlist[0]);
        }
    }

    private initAudioEvents() {
        this.audio.addEventListener('timeupdate', () => {
            this.currentTime.set(this.audio.currentTime);
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.duration.set(this.audio.duration);
        });

        this.audio.addEventListener('ended', () => {
            this.next();
        });

        this.audio.addEventListener('play', () => this.isPlaying.set(true));
        this.audio.addEventListener('pause', () => this.isPlaying.set(false));
    }

    loadTrack(track: Track) {
        this.currentTrack.set(track);
        this.audio.src = track.url;
        this.audio.load();
    }

    play(track?: Track) {
        if (track) {
            this.loadTrack(track);
        }

        if (!this.currentTrack()) return;

        this.audio.play().catch(e => console.error("Playback failed", e));
    }

    pause() {
        this.audio.pause();
    }

    toggle() {
        if (this.isPlaying()) {
            this.pause();
        } else {
            this.play();
        }
    }

    seek(time: number) {
        this.audio.currentTime = time;
    }

    next() {
        const current = this.currentTrack();
        if (!current) return;

        const idx = this.playlist.findIndex(t => t.id === current.id);
        const nextIdx = (idx + 1) % this.playlist.length;
        this.play(this.playlist[nextIdx]);
    }

    prev() {
        const current = this.currentTrack();
        if (!current) return;

        const idx = this.playlist.findIndex(t => t.id === current.id);
        const prevIdx = (idx - 1 + this.playlist.length) % this.playlist.length;
        this.play(this.playlist[prevIdx]);
    }

    getPlaylist() {
        return this.playlist;
    }
}

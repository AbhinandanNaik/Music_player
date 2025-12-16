import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Track } from '../models/track.model';
import playlistData from '../../assets/playlist.json';
import { StorageService } from './storage.service';

// Repeat Modes: 0 = Off, 1 = All, 2 = One
export enum RepeatMode {
    OFF = 0,
    ALL = 1,
    ONE = 2
}

@Injectable({
    providedIn: 'root'
})
export class AudioService {
    private audio = new Audio();
    private playlist: Track[] = playlistData as Track[];
    private storage = inject(StorageService);

    // State Signals
    readonly currentTrack = signal<Track | null>(null);
    readonly isPlaying = signal(false);
    readonly currentTime = signal(0);
    readonly duration = signal(0);
    readonly isShuffleOn = signal(false);
    readonly repeatMode = signal<RepeatMode>(RepeatMode.OFF);
    readonly volume = signal(1);
    readonly favorites = signal<Set<number>>(new Set());

    // Mapped Shuffle Index (Indices of playlist in random order)
    private shuffledIndices: number[] = [];

    readonly progress = computed(() => {
        const d = this.duration();
        return d > 0 ? (this.currentTime() / d) * 100 : 0;
    });

    private audioCtx: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private source: MediaElementAudioSourceNode | null = null;

    constructor() {
        this.audio.crossOrigin = "anonymous";
        this.initAudioEvents();
        this.initMediaSession();

        // Load persisted state
        this.loadState();

        // Auto-save effect
        effect(() => {
            const state = {
                trackId: this.currentTrack()?.id || -1,
                shuffle: this.isShuffleOn(),
                repeat: this.repeatMode(),
                volume: this.volume(),
                favorites: Array.from(this.favorites())
            };
            this.storage.saveState(state);
        });

        if (!this.currentTrack() && this.playlist.length > 0) {
            this.loadTrack(this.playlist[0]);
        }
    }

    getAnalyser(): AnalyserNode {
        if (!this.analyser) {
            this.initAudioContext();
        }
        return this.analyser!;
    }

    private initAudioContext() {
        if (this.audioCtx) return;

        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256; // Good balance for visualizer

        this.source = this.audioCtx.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
    }

    private loadState() {
        const state = this.storage.loadState();
        if (state) {
            this.isShuffleOn.set(state.shuffle);
            this.repeatMode.set(state.repeat);
            this.volume.set(state.volume ?? 1);
            this.audio.volume = this.volume(); // Apply volume immediately

            if (state.favorites) {
                this.favorites.set(new Set(state.favorites));
            }

            if (state.shuffle) {
                this.generateShuffleMapping();
            } else {
                this.resetShuffleIndices();
            }

            const track = this.playlist.find(t => t.id === state.trackId);
            if (track) {
                this.currentTrack.set(track);
                this.audio.src = track.url;
            }
        } else {
            this.resetShuffleIndices();
        }
    }

    private initAudioEvents() {
        this.audio.addEventListener('timeupdate', () => this.currentTime.set(this.audio.currentTime));
        this.audio.addEventListener('loadedmetadata', () => this.duration.set(this.audio.duration));
        this.audio.addEventListener('ended', () => this.onTrackEnded());
        this.audio.addEventListener('play', () => this.isPlaying.set(true));
        this.audio.addEventListener('pause', () => this.isPlaying.set(false));
    }

    // --- Logic ---

    toggleShuffle() {
        const newState = !this.isShuffleOn();
        this.isShuffleOn.set(newState);
        if (newState) {
            this.generateShuffleMapping();
        } else {
            this.resetShuffleIndices();
        }
    }

    toggleRepeat() {
        const current = this.repeatMode();
        const next = (current + 1) % 3;
        this.repeatMode.set(next as RepeatMode);
    }

    private generateShuffleMapping() {
        // Fisher-Yates Shuffle of indices [0, 1, 2...]
        const indices = Array.from({ length: this.playlist.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Ensure current track is first in shuffle queue if playing
        const currentTrack = this.currentTrack();
        if (currentTrack) {
            const currentIdx = this.playlist.findIndex(t => t.id === currentTrack.id);
            const shufflePos = indices.indexOf(currentIdx);
            if (shufflePos !== -1) {
                indices.splice(shufflePos, 1);
                indices.unshift(currentIdx);
            }
        }
        this.shuffledIndices = indices;
    }

    private resetShuffleIndices() {
        this.shuffledIndices = Array.from({ length: this.playlist.length }, (_, i) => i);
    }

    // --- Controls ---

    loadTrack(track: Track) {
        this.currentTrack.set(track);
        this.audio.src = track.url;
        this.audio.src = track.url;
        this.audio.load();
        this.updateMediaSessionMetadata();
    }

    play(track?: Track) {
        if (!this.audioCtx) {
            this.initAudioContext();
        }
        if (this.audioCtx?.state === 'suspended') {
            this.audioCtx.resume();
        }

        if (track) {
            this.loadTrack(track);
            // If playing specific track, regenerate shuffle to put it first if shuffle is on
            if (this.isShuffleOn()) {
                this.generateShuffleMapping();
            }
        }
        if (!this.currentTrack()) return;
        this.audio.play().catch(console.error);
    }

    pause() {
        this.audio.pause();
    }

    toggle() {
        this.isPlaying() ? this.pause() : this.play();
    }

    seek(time: number) {
        this.audio.currentTime = time;
    }

    next() {
        this.changeTrack(1);
    }

    prev() {
        this.changeTrack(-1);
    }

    private onTrackEnded() {
        if (this.repeatMode() === RepeatMode.ONE) {
            this.seek(0);
            this.audio.play();
        } else {
            this.next();
        }
    }

    private changeTrack(direction: 1 | -1) {
        const current = this.currentTrack();
        if (!current && this.playlist.length > 0) {
            this.play(this.playlist[0]);
            return;
        }

        const currentIdxInPlaylist = this.playlist.findIndex(t => t.id === current?.id);

        // Find where the current track is in our current "Queue" (Normal or Shuffled)
        const currentQueueIdx = this.shuffledIndices.indexOf(currentIdxInPlaylist);

        let nextQueueIdx = currentQueueIdx + direction;

        // Loop Logic
        if (nextQueueIdx >= this.shuffledIndices.length) {
            nextQueueIdx = (this.repeatMode() === RepeatMode.ALL) ? 0 : this.shuffledIndices.length - 1;
            if (this.repeatMode() !== RepeatMode.ALL && direction === 1) {
                this.pause(); // Stop if end of playlist and not repeating
                return;
            }
        } else if (nextQueueIdx < 0) {
            nextQueueIdx = (this.repeatMode() === RepeatMode.ALL) ? this.shuffledIndices.length - 1 : 0;
        }

        const nextPlaylistIdx = this.shuffledIndices[nextQueueIdx];
        this.play(this.playlist[nextPlaylistIdx]);
    }

    getPlaylist() {
        return this.playlist;
    }

    // --- New Features ---

    setVolume(val: number) {
        const clamped = Math.max(0, Math.min(1, val));
        this.audio.volume = clamped;
        this.volume.set(clamped);
    }

    toggleFavorite(trackId: number) {
        const current = new Set(this.favorites());
        if (current.has(trackId)) {
            current.delete(trackId);
        } else {
            current.add(trackId);
        }
        this.favorites.set(current);
    }

    isFavorite(trackId: number): boolean {
        return this.favorites().has(trackId);
    }

    // Media Session API
    private initMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.play());
            navigator.mediaSession.setActionHandler('pause', () => this.pause());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
            navigator.mediaSession.setActionHandler('stop', () => this.pause());
        }
    }

    private updateMediaSessionMetadata() {
        if ('mediaSession' in navigator) {
            const track = this.currentTrack();
            if (!track) return;

            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: 'Sonic Player',
                album: 'Premium Collection',
                artwork: [
                    { src: track.cover || '', sizes: '512x512', type: 'image/jpeg' }
                ]
            });
        }
    }
}

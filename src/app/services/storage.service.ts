import { Injectable } from '@angular/core';
import { RepeatMode } from './audio.service'; // We will move Enum or import it

export interface PlayerState {
    trackId: number;
    shuffle: boolean;
    repeat: RepeatMode;
    volume: number;
}

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private readonly STORAGE_KEY = 'sonic_player_state';

    constructor() { }

    saveState(state: PlayerState): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('LocalStorage failed', e);
        }
    }

    loadState(): PlayerState | null {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('LocalStorage read failed', e);
            return null;
        }
    }
}

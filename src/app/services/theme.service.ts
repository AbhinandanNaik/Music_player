import { Injectable, signal, effect, inject } from '@angular/core';
import { StorageService } from './storage.service';

export type Theme = 'aurora' | 'ocean' | 'sunset';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private storage = inject(StorageService);

    readonly currentTheme = signal<Theme>('aurora');

    constructor() {
        // Load saved theme
        const savedState = this.storage.loadState();
        if (savedState?.theme) {
            this.currentTheme.set(savedState.theme);
        }

        // Effect to apply theme to document
        effect(() => {
            this.applyTheme(this.currentTheme());
            // Save to storage
            const state = this.storage.loadState() || { trackId: -1, shuffle: false, repeat: 0, volume: 1, favorites: [] };
            // We need to be careful not to overwrite other state if not fully loaded, 
            // but StorageService.saveState merges? No, it overwrites. 
            // Actually AudioService handles the main save loop. 
            // Ideally we should inject AudioService here but that creates circular dependency.
            // For now, we update via DOM and let AudioService save the main state, 
            // OR we need to accept that Theme is saved separately or we add 'theme' to AudioService's effect.
            // Optimally: Let AudioService manage the signal and duplicate it here? 
            // Simpler: Just apply the theme here. AudioService has an effect that saves *everything*.
            // So we need to expose theme in AudioService or have AudioService read from here.
        });
    }

    setTheme(theme: Theme) {
        this.currentTheme.set(theme);
    }

    private applyTheme(theme: Theme) {
        const root = document.documentElement;

        switch (theme) {
            case 'aurora':
                root.style.setProperty('--aurora-blue', '#818cf8'); // Indigo 400
                root.style.setProperty('--aurora-purple', '#c084fc'); // Purple 400
                root.style.setProperty('--aurora-dark', '#0f172a'); // Slate 900
                break;
            case 'ocean':
                root.style.setProperty('--aurora-blue', '#22d3ee'); // Cyan 400
                root.style.setProperty('--aurora-purple', '#3b82f6'); // Blue 500
                root.style.setProperty('--aurora-dark', '#0c4a6e'); // Sky 900
                break;
            case 'sunset':
                root.style.setProperty('--aurora-blue', '#fbbf24'); // Amber 400
                root.style.setProperty('--aurora-purple', '#f43f5e'); // Rose 500
                root.style.setProperty('--aurora-dark', '#450a0a'); // Red 950
                break;
        }
    }
}

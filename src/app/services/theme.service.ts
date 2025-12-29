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
            const theme = this.currentTheme();
            this.applyTheme(theme);
            // Save to storage securely
            this.storage.updateState({ theme });
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

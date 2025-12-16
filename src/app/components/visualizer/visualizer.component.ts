import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #canvas class="fixed bottom-0 left-0 w-full h-[300px] pointer-events-none z-0 opacity-60 mix-blend-screen"></canvas>
  `
})
export class VisualizerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private audio = inject(AudioService);
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number = 0;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  constructor() {
    effect(() => {
      if (this.audio.isPlaying()) {
        this.startLoop();
      } else {
        this.stopLoop();
      }
    });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  ngOnDestroy() {
    this.stopLoop();
    window.removeEventListener('resize', () => this.resize());
  }

  private resize() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = 300;
  }

  private startLoop() {
    if (!this.analyser) {
      this.analyser = this.audio.getAnalyser();
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    }

    // Check if already running to avoid dupes
    if (this.animationId) cancelAnimationFrame(this.animationId);

    this.loop();
  }

  private stopLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  private loop() {
    this.animationId = requestAnimationFrame(() => this.loop());

    if (!this.ctx || !this.analyser || !this.dataArray) return;

    const width = this.canvasRef.nativeElement.width;
    const height = this.canvasRef.nativeElement.height;
    const bufferLength = this.analyser.frequencyBinCount;

    // Get Data
    const mode = this.audio.visualizerMode();
    if (mode === 'wave') {
      this.analyser.getByteTimeDomainData(this.dataArray as any);
    } else {
      this.analyser.getByteFrequencyData(this.dataArray as any);
    }

    this.ctx.clearRect(0, 0, width, height);

    if (mode === 'bars') {
      this.drawBars(width, height);
    } else if (mode === 'wave') {
      this.drawWave(width, height);
    } else if (mode === 'circle') {
      this.drawCircle(width, height);
    }
  }

  private drawBars(width: number, height: number) {
    const barWidth = (width / this.dataArray!.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < this.dataArray!.length; i++) {
      barHeight = this.dataArray![i];

      const gradient = this.ctx!.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, 'rgba(129, 140, 248, 0.2)');
      gradient.addColorStop(1, 'rgba(192, 132, 252, 0.8)');

      this.ctx!.fillStyle = gradient;
      this.ctx!.beginPath();
      this.ctx!.roundRect(x, height - barHeight, barWidth, barHeight, [10, 10, 0, 0]);
      this.ctx!.fill();

      x += barWidth + 1;
    }
  }

  private drawWave(width: number, height: number) {
    this.ctx!.lineWidth = 2;
    this.ctx!.strokeStyle = '#c084fc';
    this.ctx!.beginPath();

    const sliceWidth = width / this.dataArray!.length;
    let x = 0;

    for (let i = 0; i < this.dataArray!.length; i++) {
      const v = this.dataArray![i] / 128.0;
      const y = v * (height / 2);

      if (i === 0) {
        this.ctx!.moveTo(x, y);
      } else {
        this.ctx!.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx!.lineTo(width, height / 2);
    this.ctx!.stroke();
  }

  private drawCircle(width: number, height: number) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 100;

    this.ctx!.beginPath();
    this.ctx!.strokeStyle = 'rgba(129, 140, 248, 0.8)';
    this.ctx!.lineWidth = 2;

    for (let i = 0; i < this.dataArray!.length; i++) {
      const barHeight = this.dataArray![i] / 2;
      const radian = (Math.PI * 2 * i) / this.dataArray!.length;

      const x1 = centerX + Math.cos(radian) * radius;
      const y1 = centerY + Math.sin(radian) * radius;
      const x2 = centerX + Math.cos(radian) * (radius + barHeight);
      const y2 = centerY + Math.sin(radian) * (radius + barHeight);

      this.ctx!.moveTo(x1, y1);
      this.ctx!.lineTo(x2, y2);
    }
    this.ctx!.stroke();
  }
}

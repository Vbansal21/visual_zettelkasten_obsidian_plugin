// DrawingCanvasModal.ts
import { App, Modal, Setting } from 'obsidian';

export class DrawingCanvasModal extends Modal {
  onCapture: (imageDataUrl: string) => void;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  drawing: boolean = false;
  lastX: number = 0;
  lastY: number = 0;

  constructor(app: App, onCapture: (imageDataUrl: string) => void) {
    super(app);
    this.onCapture = onCapture;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Create Canvas Element
    this.canvas = contentEl.createEl('canvas', { attr: { width: '500', height: '400', style: 'border:1px solid #000;' } }) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.fillStyle = '#FFFFFF'; // Set background to white
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Implement drawing logic
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));

    // Clear Canvas Button
    new Setting(contentEl)
      .addButton(button => button
        .setButtonText('Clear Canvas')
        .onClick(() => {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }));

    // Capture Button
    new Setting(contentEl)
      .addButton(button => button
        .setButtonText('Capture Drawing')
        .setCta()
        .onClick(() => {
          const imageDataUrl = this.canvas.toDataURL();
          this.onCapture(imageDataUrl);
          this.close();
        }));
  }

  startDrawing(event: MouseEvent) {
    this.drawing = true;
    [this.lastX, this.lastY] = this.getMousePos(event);
  }

  stopDrawing() {
    this.drawing = false;
  }

  draw(event: MouseEvent) {
    if (!this.drawing) return;
    const [x, y] = this.getMousePos(event);
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    [this.lastX, this.lastY] = [x, y];
  }

  getMousePos(event: MouseEvent): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    return [
      event.clientX - rect.left,
      event.clientY - rect.top
    ];
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

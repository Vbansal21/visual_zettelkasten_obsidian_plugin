// CustomInputModal.ts
import { App, Modal, Setting, Notice, TFile } from 'obsidian';
import VisualZettelkastenPlugin from './main';
import { DrawingCanvasModal } from './DrawingCanvasModal';

export class CustomInputModal extends Modal {
  plugin: VisualZettelkastenPlugin;
  customInput: string = '';
    app: any;

  constructor(app: App, plugin: VisualZettelkastenPlugin) {
    super(app);
    this.plugin = plugin;
    this.app = app;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Provide Custom Input' });

    // Instruction
    contentEl.createEl('p', { text: 'Provide your own topic or idea to generate specific templates.' });

    // Text Input
    new Setting(contentEl)
      .setName('Text Input')
      .addTextArea((text: TextComponent) => text
        .setPlaceholder('Type your custom topic or idea here...')
        .onChange(value => {
          this.customInput = value;
        }));

    // Voice Input (Audio Upload)
    new Setting(contentEl)
      .setName('Voice Input')
      .setDesc('Upload an audio file to provide input.')
      .addButton(button => button
        .setButtonText('Upload Audio')
        .onClick(() => {
          this.uploadAudio();
        }));

    // Drawing Input
    new Setting(contentEl)
      .setName('Drawing Input')
      .setDesc('Create a drawing to provide input.')
      .addButton(button => button
        .setButtonText('Open Drawing Canvas')
        .onClick(() => {
          this.openDrawingCanvas();
        }));

    // Image Input
    new Setting(contentEl)
      .setName('Image Input')
      .setDesc('Upload an image to provide input.')
      .addButton(button => button
        .setButtonText('Upload Image')
        .onClick(() => {
          this.uploadImage();
        }));

    // Action Buttons
    new Setting(contentEl)
      .addButton(button => button
        .setButtonText('Generate Template')
        .setCta()
        .onClick(async () => {
          if (!this.customInput.trim()) {
            new Notice('Please provide some input.');
            return;
          }
          const newTemplates = await this.plugin.generateTemplatesFromCustomInput(this.customInput);
          if (newTemplates.length > 0) {
            this.plugin.showTemplateModal(newTemplates);
          } else {
            new Notice('No templates generated.');
          }
          this.close();
        }))
      .addButton(button => button
        .setButtonText('Cancel')
        .onClick(() => {
          this.close();
        }));
  }

  async uploadAudio() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('audio_file', file);

        try {
          const response = await fetch(`${this.plugin.settings.customBackendURL}/transcribe-audio`, {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          const transcription = data.transcription;
          if (transcription) {
            this.customInput += `\n${transcription}`;
            new Notice('Audio input transcribed.');
          } else {
            new Notice('Failed to transcribe audio.');
          }
        } catch (error) {
          console.error('Error transcribing audio:', error);
          new Notice('Error transcribing audio.');
        }
      }
    };
    input.click();
  }

  openDrawingCanvas() {
    const modal = new DrawingCanvasModal(this.app, async (imageDataUrl: string) => {
      // Save the image in the vault
      const imageName = `Drawing-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      const imagePath = `Assets/${imageName}`;
      const imageBuffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      try {
        await this.app.vault.createBinary(imagePath, imageBuffer);
        this.customInput += `\n![Drawing Input](${imagePath})`;

        // Process the image
        const description = await this.plugin.processImageInput(imagePath);
        if (description) {
          this.customInput += `\n${description}`;
          new Notice('Drawing processed and description added.');
        } else {
          new Notice('Failed to process drawing.');
        }
      } catch (error) {
        console.error('Error saving drawing:', error);
        new Notice('Error saving drawing.');
      }
    });
    modal.open();
  }

  async uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const imageName = `Image-${new Date().toISOString().replace(/[:.]/g, '-')}.${file.name.split('.').pop()}`;
          const imagePath = `Assets/${imageName}`;
          const imageBuffer = Buffer.from(dataUrl.split(',')[1], 'base64');
          try {
            await this.app.vault.createBinary(imagePath, imageBuffer);
            this.customInput += `\n![Image Input](${imagePath})`;

            // Process the image
            const description = await this.plugin.processImageInput(imagePath);
            if (description) {
              this.customInput += `\n${description}`;
              new Notice('Image processed and description added.');
            } else {
              new Notice('Failed to process image.');
            }
          } catch (error) {
            console.error('Error saving image:', error);
            new Notice('Error saving image.');
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

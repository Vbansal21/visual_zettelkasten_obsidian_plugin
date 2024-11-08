// TemplateCustomizationModal.ts
import { App, Modal, Setting, Notice } from 'obsidian';
import VisualZettelkastenPlugin from './main';

export class TemplateCustomizationModal extends Modal {
  plugin: VisualZettelkastenPlugin;
  templateContent: string;
  modifiedContent: string;

  constructor(app: App, plugin: VisualZettelkastenPlugin, templateContent: string) {
    super(app);
    this.plugin = plugin;
    this.templateContent = templateContent;
    this.modifiedContent = templateContent;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Customize Template' });

    // Text Area for Editing Template Content
    new Setting(contentEl)
      .setName('Template Content')
      .addTextArea((text: TextComponent) => text
        .setValue(this.templateContent)
        .onChange(value => {
          this.modifiedContent = value;
        })
        .inputEl.setAttr('rows', 15));

    // Buttons
    new Setting(contentEl)
      .addButton(button => button
        .setButtonText('Save and Create Note')
        .setCta()
        .onClick(async () => {
          await this.plugin.createNoteFromTemplate(this.modifiedContent);
          this.close();
        }))
      .addButton(button => button
        .setButtonText('Cancel')
        .onClick(() => {
          this.close();
        }));
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

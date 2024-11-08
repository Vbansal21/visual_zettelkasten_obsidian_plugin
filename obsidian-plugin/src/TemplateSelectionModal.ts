// TemplateSelectionModal.ts
import { App, Modal, Setting, Notice } from 'obsidian';
import VisualZettelkastenPlugin from './main';
import { DefineRelationshipsModal } from './DefineRelationshipsModal';
import { CustomInputModal } from './CustomInputModal';
import { TemplateCustomizationModal } from './TemplateCustomizationModal';

export class TemplateSelectionModal extends Modal {
  plugin: VisualZettelkastenPlugin;
  templates: string[];
  selectedTemplates: Set<string>;

  constructor(app: App, plugin: VisualZettelkastenPlugin, templates: string[]) {
    super(app);
    this.plugin = plugin;
    this.templates = templates;
    this.selectedTemplates = new Set();
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Select Templates' });

    // Instruction
    contentEl.createEl('p', { text: 'Select one or more templates and define relationships/preferences between them.' });

    // List templates with checkboxes
    this.templates.forEach((template, index) => {
      new Setting(contentEl)
        .setName(`Template ${index + 1}`)
        .addToggle(toggle => toggle
          .setValue(false)
          .onChange(value => {
            if (value) {
              this.selectedTemplates.add(template);
            } else {
              this.selectedTemplates.delete(template);
            }
          }))
        .addButton(button => button
          .setButtonText('View')
          .onClick(() => {
            new TemplateCustomizationModal(this.app, this.plugin, template).open();
          }))
        .addButton(button => button
          .setButtonText('Use')
          .onClick(async () => {
            await this.plugin.createNoteFromTemplate(template);
            this.close();
          }))
        .settingEl.createDiv('', div => {
          div.textContent = template;
        });
    });

    // Buttons
    new Setting(contentEl)
      .addButton(button => button
        .setButtonText('Define Relationships')
        .setCta()
        .onClick(() => {
          if (this.selectedTemplates.size < 2) {
            new Notice('Select at least two templates to define relationships.');
            return;
          }
          new DefineRelationshipsModal(this.app, this.plugin, Array.from(this.selectedTemplates)).open();
          this.close();
        }))
      .addButton(button => button
        .setButtonText('Add Custom Input')
        .onClick(() => {
          new CustomInputModal(this.app, this.plugin).open();
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

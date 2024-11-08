// DefineRelationshipsModal.ts
import { App, Modal, Setting, Notice } from 'obsidian';
import VisualZettelkastenPlugin from './main';

export interface Relationship {
  templateA: string;
  templateB: string;
  attribute: string;
  value: number; // 0 - 10
}

export class DefineRelationshipsModal extends Modal {
  plugin: VisualZettelkastenPlugin;
  selectedTemplates: string[];
  relationships: Relationship[] = [];

  constructor(app: App, plugin: VisualZettelkastenPlugin, selectedTemplates: string[]) {
    super(app);
    this.plugin = plugin;
    this.selectedTemplates = selectedTemplates;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Define Relationships Between Templates' });

    // Instruction
    contentEl.createEl('p', { text: 'Define preferences between selected templates based on attributes.' });

    // Iterate over template pairs
    for (let i = 0; i < this.selectedTemplates.length; i++) {
      for (let j = i + 1; j < this.selectedTemplates.length; j++) {
        const templateA = this.selectedTemplates[i];
        const templateB = this.selectedTemplates[j];

        const relationship: Relationship = {
          templateA,
          templateB,
          attribute: 'Relevance',
          value: 5,
        };
        this.relationships.push(relationship);

        new Setting(contentEl)
          .setName(`${templateA} vs ${templateB}`)
          .addText((text: TextComponent) => text
            .setPlaceholder('Attribute (e.g., Creativity, Structure)')
            .setValue(relationship.attribute)
            .onChange(value => {
              relationship.attribute = value;
            }))
          .addSlider(slider => slider
            .setLimits(0, 10, 1)
            .setValue(relationship.value)
            .onChange(value => {
              relationship.value = value;
            })
            .setDynamicTooltip())
          .setDesc('Adjust the value to define the preference strength.');
      }
    }

    // Submit Button
    new Setting(contentEl)
      .addButton(button => button
        .setButtonText('Submit Relationships')
        .setCta()
        .onClick(async () => {
          if (this.relationships.length === 0) {
            new Notice('No relationships defined.');
            return;
          }
          await this.plugin.processRelationships(this.relationships);
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

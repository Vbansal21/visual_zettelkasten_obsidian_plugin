// VisualZettelkastenSettingTab.ts
import { App, PluginSettingTab, Setting } from 'obsidian';
import VisualZettelkastenPlugin from './main';
import { DEFAULT_SETTINGS, VisualZettelkastenSettings } from './settings';

export class VisualZettelkastenSettingTab extends PluginSettingTab {
  plugin: VisualZettelkastenPlugin;

  constructor(app: App, plugin: VisualZettelkastenPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Visual Zettelkasten Settings' });

    // Custom Backend URL
    new Setting(containerEl)
      .setName('Custom Backend URL')
      .setDesc('URL of the local backend server (e.g., http://localhost:8000)')
      .addText((text: TextComponent) => text
        .setPlaceholder('http://localhost:8000')
        .setValue(this.plugin.settings.customBackendURL)
        .onChange(async (value) => {
          this.plugin.settings.customBackendURL = value;
          await this.plugin.saveSettings();
        }));

    // Predefined Templates Folder
    new Setting(containerEl)
      .setName('Predefined Templates Folder')
      .setDesc('Folder path within your vault to store predefined templates.')
      .addText((text: TextComponent) => text
        .setPlaceholder('Predefined Templates')
        .setValue(this.plugin.settings.predefinedTemplatesFolder)
        .onChange(async (value) => {
          this.plugin.settings.predefinedTemplatesFolder = value;
          await this.plugin.saveSettings();
        }));

    // Additional Document Folders
    new Setting(containerEl)
      .setName('Additional Document Folders')
      .setDesc('Comma-separated list of additional folders to include for document analysis.')
      .addText((text: TextComponent) => text
        .setPlaceholder('e.g., Documents, Reports')
        .setValue(this.plugin.settings.additionalDocumentFolders.join(', '))
        .onChange(async (value) => {
          this.plugin.settings.additionalDocumentFolders = value.split(',').map(folder => folder.trim());
          await this.plugin.saveSettings();
        }));

    // Generation Parameters
    containerEl.createEl('h3', { text: 'Generation Parameters' });

    new Setting(containerEl)
      .setName('Creativity Level')
      .setDesc('Higher values make the AI more creative.')
      .addSlider(slider => slider
        .setLimits(0, 1, 0.1)
        .setValue(this.plugin.settings.generationParameters.creativityLevel)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.generationParameters.creativityLevel = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Topic Relevance')
      .setDesc('Higher values ensure the AI stays relevant to the topics.')
      .addSlider(slider => slider
        .setLimits(0, 1, 0.1)
        .setValue(this.plugin.settings.generationParameters.topicRelevance)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.generationParameters.topicRelevance = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Diversity Level')
      .setDesc('Higher values increase the diversity of generated templates.')
      .addSlider(slider => slider
        .setLimits(0, 1, 0.1)
        .setValue(this.plugin.settings.generationParameters.diversityLevel)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.generationParameters.diversityLevel = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Max Length')
      .setDesc('Maximum length of generated templates.')
      .addText((text: TextComponent) => text
        .setPlaceholder('150')
        .setValue(this.plugin.settings.generationParameters.max_length.toString())
        .onChange(async (value) => {
          const parsed = parseInt(value);
          if (!isNaN(parsed)) {
            this.plugin.settings.generationParameters.max_length = parsed;
            await this.plugin.saveSettings();
          }
        }));
    
    // Predefined Templates
    containerEl.createEl('h3', { text: 'Predefined Templates' });

    this.plugin.settings.predefinedTemplates.forEach((template, index) => {
      new Setting(containerEl)
        .setName(`Template ${index + 1}`)
        .addTextArea((text: TextComponent) => text
          .setValue(template)
          .onChange(async (value) => {
            this.plugin.settings.predefinedTemplates[index] = value;
            await this.plugin.saveSettings();
          }));
    });

    // Option to add more predefined templates
    new Setting(containerEl)
      .addButton(button => button
        .setButtonText('Add Predefined Template')
        .setCta()
        .onClick(async () => {
          this.plugin.settings.predefinedTemplates.push("New Template:\n- Section 1\n- Section 2\n- Section 3");
          await this.plugin.saveSettings();
          this.display(); // Refresh the settings tab
        }));
  }
}

// main.ts
import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import axios from 'axios';
import { DEFAULT_SETTINGS, VisualZettelkastenSettings, GenerationParameters } from './settings';
import { VisualZettelkastenSettingTab } from './VisualZettelkastenSettingTab';
import { TemplateSelectionModal } from './TemplateSelectionModal';
import { TemplateCustomizationModal } from './TemplateCustomizationModal';
import { CustomInputModal } from './CustomInputModal';
import { DefineRelationshipsModal, Relationship } from './DefineRelationshipsModal';
import './styles.css';

interface NoteData {
  title: string;
  content: string;
  tags: string[];
  lastAccessed: number;
}

interface DocumentData {
  path: string;
  name: string;
  extension: string;
}

export default class VisualZettelkastenPlugin extends Plugin {
  settings: VisualZettelkastenSettings;

  async onload() {
    console.log('Loading Visual Zettelkasten Plugin');
    await this.loadSettings();

    // Register settings tab
    this.addSettingTab(new VisualZettelkastenSettingTab(this.app, this));

    // Register commands
    this.addCommand({
      id: 'open-visual-zettelkasten',
      name: 'Open Visual Zettelkasten',
      callback: () => this.openZettelkastenView(),
    });

    // Add ribbon icon
    this.addRibbonIcon('dice', 'Visual Zettelkasten', () => {
      this.openZettelkastenView();
    });

    // Ensure predefined templates folder exists
    await this.ensurePredefinedTemplatesFolder();
    await this.ensureAssetsFolder();
  }

  onunload() {
    console.log('Unloading Visual Zettelkasten Plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    await this.ensurePredefinedTemplatesFolder();
    await this.ensureAssetsFolder();
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async ensurePredefinedTemplatesFolder() {
    const folderPath = this.settings.predefinedTemplatesFolder;
    let folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(folder instanceof TFolder)) {
      await this.app.vault.createFolder(folderPath);
    }
  }

  async ensureAssetsFolder() {
    const folderPath = 'Assets';
    let folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(folder instanceof TFolder)) {
      await this.app.vault.createFolder(folderPath);
    }
  }

  async openZettelkastenView() {
    const predefinedTemplates = this.settings.predefinedTemplates;
    const aiTemplates = await this.getAIGeneratedTemplates();
    const allTemplates = [...predefinedTemplates, ...aiTemplates];
    new TemplateSelectionModal(this.app, this, allTemplates).open();
  }

  async collectNotesData(): Promise<NoteData[]> {
    const files = this.app.vault.getMarkdownFiles();
    const notesData: NoteData[] = [];

    for (const file of files) {
      const content = await this.app.vault.read(file);
      const cache = this.app.metadataCache.getFileCache(file);
      const tags = cache?.tags?.map(tag => tag.tag) || [];
      const lastAccessed = cache?.lastModified || file.stat.mtime;
      notesData.push({
        title: file.basename,
        content: content,
        tags: tags,
        lastAccessed: lastAccessed,
      });
    }

    return notesData;
  }

  async collectDocumentData(): Promise<DocumentData[]> {
    const documentData: DocumentData[] = [];

    for (const folderPath of this.settings.additionalDocumentFolders) {
      const folder = this.app.vault.getAbstractFileByPath(folderPath);
      if (folder instanceof TFolder) {
        await this.traverseFolder(folder, documentData);
      } else {
        new Notice(`Folder not found or inaccessible: ${folderPath}`);
      }
    }

    return documentData;
  }

  async traverseFolder(folder: TFolder, documentData: DocumentData[]) {
    for (const child of folder.children) {
      if (child instanceof TFolder) {
        await this.traverseFolder(child, documentData);
      } else if (child instanceof TFile) {
        if (['pdf', 'docx', 'txt'].includes(child.extension)) {
          documentData.push({
            path: child.path,
            name: child.name,
            extension: child.extension,
          });
        }
      }
    }
  }

  async getAIGeneratedTemplates(customAttributes?: { [key: string]: number }): Promise<string[]> {
    const notesData = await this.collectNotesData();
    const documentData = await this.collectDocumentData();
    const parameters = this.settings.generationParameters;

    // Call local backend for template generation
    return await this.callLocalBackend(notesData, documentData, parameters, customAttributes);
  }

  async callLocalBackend(notesData: NoteData[], documentData: DocumentData[], parameters: GenerationParameters, customAttributes?: { [key: string]: number }): Promise<string[]> {
    try {
      const response = await axios.post(`${this.settings.customBackendURL}/generate-template`, {
        notes: notesData,
        documents: documentData,
        parameters: parameters,
        customAttributes: customAttributes,
      });
      return response.data.templates;
    } catch (error) {
      console.error('Local Backend Error:', error);
      new Notice('Error generating templates via local backend.');
      return [];
    }
  }

  async createNoteFromTemplate(templateContent: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Note-${timestamp}.md`;
    const filePath = `${this.settings.predefinedTemplatesFolder}/${fileName}`;

    try {
      await this.app.vault.create(filePath, templateContent);
      new Notice(`Note created: ${fileName}`);
    } catch (error) {
      console.error('Error creating note:', error);
      new Notice('Failed to create note.');
    }
  }

  // Helper function to process audio input
  async processAudioInput(audioPath: string): Promise<string> {
    const formData = new FormData();
    const file = this.app.vault.getAbstractFileByPath(audioPath);
    if (file instanceof TFile) {
      const arrayBuffer = await this.app.vault.readBinary(file);
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      formData.append('audio_file', blob, file.name);

      try {
        const response = await fetch(`${this.settings.customBackendURL}/transcribe-audio`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        return data.transcription || "Failed to transcribe audio";
      } catch (error) {
        console.error('Error transcribing audio:', error);
        return "Error transcribing audio";
      }
    }
    return "Invalid audio file";
  }

  // Helper function to process image input
  async processImageInput(imagePath: string): Promise<string> {
    const formData = new FormData();
    const file = this.app.vault.getAbstractFileByPath(imagePath);
    if (file instanceof TFile) {
      const arrayBuffer = await this.app.vault.readBinary(file);
      const blob = new Blob([arrayBuffer], { type: 'image/png' });
      formData.append('image_file', blob, file.name);

      try {
        const response = await fetch(`${this.settings.customBackendURL}/process-image`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        return data.description || "Failed to process image";
      } catch (error) {
        console.error('Error processing image:', error);
        return "Error processing image";
      }
    }
    return "Invalid image file";
  }

  // Method to generate templates from custom input
  async generateTemplatesFromCustomInput(customInput: string): Promise<string[]> {
    const parameters = this.settings.generationParameters;
    const formData = {
      customInput: customInput,
      parameters: parameters,
    };

    try {
      const response = await axios.post(`${this.settings.customBackendURL}/generate-template`, formData);
      return response.data.templates;
    } catch (error) {
      console.error('Error generating templates from custom input:', error);
      new Notice('Error generating templates from custom input.');
      return [];
    }
  }

  // Method to show the template selection modal
  showTemplateModal(templates: string[]) {
    new TemplateSelectionModal(this.app, this, templates).open();
  }
}

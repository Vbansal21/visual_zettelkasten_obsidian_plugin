// settings.ts
export interface GenerationParameters {
    creativityLevel: number; // 0.0 - 1.0
    topicRelevance: number;  // 0.0 - 1.0
    diversityLevel: number;  // 0.0 - 1.0
    numTemplates: number;    // Number of templates to generate
  }
  
  export interface VisualZettelkastenSettings {
    openAI_APIKey: string;
    useCustomBackend: boolean;
    customBackendURL: string;
    useLocalModels: boolean;
    whisperModelPath: string;
    phiVisionModelPath: string;
    jinaEmbeddingsEndpoint: string;
    additionalDocumentFolders: string[];
    generationParameters: GenerationParameters;
    predefinedTemplates: string[];
    predefinedTemplatesFolder: string;
  }
  
  export const DEFAULT_SETTINGS: VisualZettelkastenSettings = {
    openAI_APIKey: '',
    useCustomBackend: false,
    customBackendURL: 'http://localhost:8000',
    useLocalModels: false,
    whisperModelPath: 'http://localhost:8000/transcribe-audio',
    phiVisionModelPath: 'http://localhost:8000/process-image',
    jinaEmbeddingsEndpoint: 'http://localhost:8000/embeddings',
    additionalDocumentFolders: [],
    generationParameters: {
      creativityLevel: 0.7,
      topicRelevance: 0.7,
      diversityLevel: 0.7,
      numTemplates: 5,
    },
    predefinedTemplates: [
      "Daily Journal",
      "Project Planning",
      "Research Notes",
      "Meeting Minutes"
    ],
    predefinedTemplatesFolder: 'Visual Zettelkasten/Predefined Templates',
  };
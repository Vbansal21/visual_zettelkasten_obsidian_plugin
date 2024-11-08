# **Project Silhouette: Visual Zettelkasten Plugin Setup Guide**

## **Introduction**

The **Visual Zettelkasten** is an Obsidian plugin designed to enhance your note-taking experience by integrating AI-powered template generation and a sophisticated recommendation system. The plugin operates entirely offline, ensuring data privacy and compliance with organizational policies that prohibit the use of external APIs. It utilizes local AI models:

- **Llama 2** via `llama.cpp` for text generation.
- **Janus** for multi-modal tasks (image processing and generation).

This guide provides comprehensive, step-by-step instructions to set up the Visual Zettelkasten plugin on your PC. It is designed for users who are familiar with downloading and installing Python and its libraries.

---

## **Table of Contents**

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Environment Setup](#environment-setup)
   - [1. Install Required Software](#1-install-required-software)
   - [2. Download and Prepare Models](#2-download-and-prepare-models)
   - [3. Set Up the Python Backend](#3-set-up-the-python-backend)
   - [4. Set Up the Obsidian Plugin](#4-set-up-the-obsidian-plugin)
4. [Configuration](#configuration)
   - [1. Backend Configuration](#1-backend-configuration)
   - [2. Plugin Configuration in Obsidian](#2-plugin-configuration-in-obsidian)
5. [Running the Application](#running-the-application)
6. [Usage Guide](#usage-guide)
7. [Troubleshooting](#troubleshooting)
8. [Conclusion](#conclusion)

---

## **Prerequisites**

Before you begin, ensure that you have the following installed on your PC:

- **Python 3.8 or higher**: For running the backend server.
- **Node.js and npm**: For building the Obsidian plugin.
- **Obsidian**: The note-taking application where the plugin will be installed.

**Note:** This guide assumes you are using a Windows PC. Adjust the commands accordingly if you are using macOS or Linux.

---

## **Project Structure**

The project consists of two main components:

1. **Obsidian Plugin (Frontend)**: Manages user interactions within Obsidian.
2. **Python Backend (Backend)**: Processes data using local AI models.

The folder structure is as follows:

```
visual-zettelkasten/
├── obsidian-plugin/
│   ├── src/
│   │   ├── main.ts
│   │   ├── settings.ts
│   │   ├── VisualZettelkastenSettingTab.ts
│   │   ├── TemplateSelectionModal.ts
│   │   ├── TemplateCustomizationModal.ts
│   │   ├── CustomInputModal.ts
│   │   ├── DefineRelationshipsModal.ts
│   │   ├── DrawingCanvasModal.ts
│   │   └── styles.css
│   ├── manifest.json
│   ├── package.json
│   ├── tsconfig.json
│   └── .eslintrc.json
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── models/
│   │   ├── llama.cpp/            # Directory for llama.cpp and Llama 2 model files
│   │   └── janus/                # Directory for Janus model files
│   └── data/
│       ├── embeddings/           # Directory for storing embeddings
│       └── access_metadata.json  # File for tracking document access metadata
└── README.md
```

---

## **Environment Setup**

### **1. Install Required Software**

#### **a. Install Python**

1. **Download Python**:

   - Go to the [official Python website](https://www.python.org/downloads/).
   - Download the latest version of Python 3.8 or higher.

2. **Install Python**:

   - Run the installer.
   - **Important**: Check the box that says **"Add Python to PATH"** during installation.

#### **b. Install Node.js and npm**

1. **Download Node.js**:

   - Visit the [official Node.js website](https://nodejs.org/en/download/).
   - Download the **LTS (Long Term Support)** version for your operating system.

2. **Install Node.js**:

   - Run the installer and follow the prompts.

3. **Verify Installation**:

   - Open **Command Prompt** (Windows) or **Terminal** (macOS/Linux).
   - Run `node -v` and `npm -v` to verify the installations.

#### **c. Install Git**

1. **Download Git**:

   - Go to the [official Git website](https://git-scm.com/downloads).
   - Download the appropriate installer for your OS.

2. **Install Git**:

   - Run the installer and follow the prompts.
   - Use default settings unless you have specific preferences.

#### **d. Install a C++ Compiler**

For `llama.cpp`, you need a C++ compiler:

- **Windows**:

  - Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/).
  - During installation, select **"Desktop development with C++"**.

- **macOS**:

  - Install Xcode Command Line Tools:
    ```
    xcode-select --install
    ```

- **Linux**:

  - Install `build-essential`:
    ```
    sudo apt-get install build-essential
    ```

---

### **2. Download and Prepare Models**

#### **a. Download Llama 2 Model**

1. **Register and Accept Terms**:

   - Visit the [Llama 2 page](https://ai.facebook.com/blog/llama-2/) on Meta's website.
   - Follow the instructions to request access to the model.
   - Accept the license agreement.

2. **Download Model Weights**:

   - Download the Llama 2 model weights suitable for your hardware (e.g., 7B, 13B, 70B parameters).
   - **Note**: Larger models require more RAM and GPU memory.

3. **Place Model Files**:

   - Create a directory `visual-zettelkasten/backend/models/llama.cpp/`.
   - Place the downloaded model files in this directory.

#### **b. Download Janus Model**

1. **Obtain Janus Model**:

   - Visit the official Janus model repository or website.
   - Follow the instructions to download the Janus model files.

2. **Place Model Files**:

   - Create a directory `visual-zettelkasten/backend/models/janus/`.
   - Place the Janus model files in this directory.

---

### **3. Set Up the Python Backend**

#### **a. Clone the Repository**

Open Command Prompt or Terminal and run:

```bash
git clone https://github.com/yourusername/visual-zettelkasten.git
```

Replace `yourusername` with the appropriate username or repository path.

#### **b. Navigate to the Backend Directory**

```bash
cd visual-zettelkasten/backend
```

#### **c. Create a Virtual Environment (Optional but Recommended)**

```bash
python -m venv venv
```

Activate the virtual environment:

- **Windows**:
  ```
  venv\Scripts\activate
  ```
- **macOS/Linux**:
  ```
  source venv/bin/activate
  ```

#### **d. Install Python Dependencies**

```bash
pip install -r requirements.txt
```

**Content of `requirements.txt`:**

```
flask
torch
numpy
scikit-learn
# Include any additional dependencies required by llama.cpp and Janus
```

#### **e. Build `llama.cpp`**

1. **Navigate to the `llama.cpp` Directory**:

   ```bash
   cd models/llama.cpp
   ```

2. **Clone `llama.cpp` Repository**:

   ```bash
   git clone https://github.com/ggerganov/llama.cpp.git
   ```

3. **Build the Project**:

   - **Windows**:

     ```bash
     mkdir build
     cd build
     cmake ..
     cmake --build . --config Release
     ```

   - **macOS/Linux**:

     ```bash
     make
     ```

#### **f. Configure Model Paths in `app.py`**

Open `app.py` in a text editor and update the paths to point to your model files:

```python
# app.py
LLAMA_CPP_PATH = "path/to/llama.cpp"
LLAMA_MODEL_PATH = "path/to/llama2/model.bin"
JANUS_MODEL_PATH = "path/to/janus/model"
```

Replace the placeholders with the actual paths.

---

### **4. Set Up the Obsidian Plugin**

#### **a. Install Obsidian**

If you haven't already, download and install Obsidian from the [official website](https://obsidian.md/).

#### **b. Build the Plugin**

1. **Navigate to the Plugin Directory**:

   ```bash
   cd visual-zettelkasten/obsidian-plugin
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Build the Plugin**:

   ```bash
   npm run build
   ```

This will generate the necessary plugin files (`main.js`, `manifest.json`, `styles.css`).

#### **c. Install the Plugin in Obsidian**

1. **Locate Obsidian's Plugins Folder**:

   - Open Obsidian.
   - Go to `Settings` > `Community Plugins` > `Open plugins folder`.
   - This will open the `.obsidian/plugins` directory in your file explorer.

2. **Copy Plugin Files**:

   - Create a new folder named `visual-zettelkasten` inside the plugins folder.
   - Copy the following files into this folder:
     - `main.js`
     - `manifest.json`
     - `styles.css`

3. **Enable the Plugin**:

   - In Obsidian, go to `Settings` > `Community Plugins`.
   - Find `Visual Zettelkasten` in the list and enable it.

---

## **Configuration**

### **1. Backend Configuration**

#### **a. Set Environment Variables (Optional)**

If the backend requires any environment variables (e.g., model configurations), set them accordingly.

#### **b. Start the Backend Server**

In Command Prompt or Terminal (ensure the virtual environment is activated if you created one):

```bash
python app.py
```

- The server should start on `http://localhost:8000`.
- Keep this terminal window open while using the plugin.

### **2. Plugin Configuration in Obsidian**

1. **Open Plugin Settings**:

   - Go to `Settings` > `Visual Zettelkasten`.

2. **Configure Backend URL**:

   - **Custom Backend URL**: Set to `http://localhost:8000`.
   - **Use Custom Backend**: Ensure this option is enabled.

3. **Configure Local Models (if applicable)**:

   - **Enable Locally Running Models**: Enable this option.
   - **Whisper Model Path**: If you are using a local transcription model, provide the path or leave it blank if not used.
   - **Phi3.5 Vision Model Path**: Since we're using Janus, you may update this to reflect Janus's capabilities or leave it as is if not applicable.
   - **Jina Embeddings Endpoint**: If you have an embeddings service running, provide the endpoint, or leave it as default.

4. **Additional Settings**:

   - **Generation Parameters**: Adjust creativity level, topic relevance, diversity level, and the number of templates as per your preference.
   - **Predefined Templates**: You can add or modify predefined templates here.
   - **Additional Document Folders**: Specify any folders within your Obsidian vault that contain documents you want the plugin to include in its analysis.

---

## **Running the Application**

1. **Start the Backend Server**:

   - Ensure `app.py` is running:
     ```bash
     python app.py
     ```

2. **Open Obsidian**:

   - Launch Obsidian if it's not already open.

3. **Use the Plugin**:

   - Use the command palette (press `Ctrl+P` or `Cmd+P`) and type `Open Visual Zettelkasten` to start using the plugin.
   - Alternatively, if the plugin adds a ribbon icon, click on it to launch the plugin.

---

## **Usage Guide**

### **Generating Templates**

1. **Open Visual Zettelkasten**:

   - Access the plugin via the command palette or ribbon icon.

2. **Select Templates**:

   - Choose from predefined templates or AI-generated templates.
   - You can select multiple templates for comparison or combination.

3. **Customize Templates**:

   - Modify the content of templates as needed.
   - Use the Template Customization modal to make changes.

4. **Provide Custom Inputs**:

   - Use the Custom Input modal to add your own text, voice recordings, drawings, or images.
   - The plugin will process these inputs to generate more personalized templates.

5. **Define Relationships**:

   - If you selected multiple templates, you can define relationships or preferences between them.
   - This influences the recommendation system and future template generation.

6. **Create Notes**:

   - Once satisfied, finalize the templates and create new notes in your vault.
   - The notes will include any customizations and inputs you provided.

---

## **Troubleshooting**

### **Common Issues and Solutions**

1. **Backend Server Not Running**:

   - **Issue**: The plugin cannot communicate with the backend.
   - **Solution**: Ensure that `app.py` is running in the terminal and that the server is listening on `http://localhost:8000`.

2. **Model Files Not Found**:

   - **Issue**: The backend cannot locate the Llama 2 or Janus model files.
   - **Solution**: Verify that the model paths in `app.py` are correct and point to the actual locations of the model files.

3. **Insufficient System Resources**:

   - **Issue**: The models require more RAM or GPU memory than available.
   - **Solution**: Consider using smaller model variants or upgrading your hardware.

4. **Plugin Not Appearing in Obsidian**:

   - **Issue**: The plugin does not show up in the list of community plugins.
   - **Solution**: Ensure that the plugin files are placed in the correct directory and that `manifest.json` is present.

5. **Errors During Plugin Build**:

   - **Issue**: Errors occur when running `npm run build`.
   - **Solution**: Ensure all dependencies are installed with `npm install`. Check for error messages and install any missing packages.

6. **Dependency Issues**:

   - **Issue**: Missing Python packages or incorrect versions.
   - **Solution**: Re-run `pip install -r requirements.txt` and ensure all packages are installed.

---

## **Conclusion**

You have now set up the Visual Zettelkasten plugin and its backend on your PC. This setup allows you to enhance your note-taking experience in Obsidian with AI-powered template generation and multi-modal inputs, all while ensuring your data remains private and secure.

**Remember**:

- Keep the backend server running while using the plugin.
- Regularly update the plugin and backend if new versions are released.
- Adjust settings and parameters to fine-tune the plugin to your workflow.

---

## **Additional Resources**

- **Obsidian Documentation**: [https://help.obsidian.md/](https://help.obsidian.md/)
- **llama.cpp Repository**: [https://github.com/ggerganov/llama.cpp](https://github.com/ggerganov/llama.cpp)
- **Janus Model Information**: Refer to the official Janus documentation or repository.
- **Python Virtual Environments**: [https://docs.python.org/3/tutorial/venv.html](https://docs.python.org/3/tutorial/venv.html)

---

If you encounter any issues not covered in this guide, consider reaching out to the community forums or the plugin's support channels for assistance.

**Happy note-taking with Visual Zettelkasten!**
# app.py
from flask import Flask, request, jsonify
import torch
from transformers import AutoTokenizer
from janus.models import MultiModalityCausalLM, VLChatProcessor
import whisper
import datetime
from jinja2 import Template
import os
import json
import tempfile
import PIL.Image
from unittest.mock import patch

app = Flask(__name__)

# Paths to models
JANUS_MODEL_PATH = "models/janus"  # Update this path to where your Janus model is located
WHISPER_MODEL_NAME = "base"  # Choose from 'tiny', 'base', 'small', 'medium', 'large'

# set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# fix the imports
def fixed_get_imports(filename: str | os.PathLike) -> list[str]:
    imports = get_imports(filename)
    if not torch.cuda.is_available() and "flash_attn" in imports:
        imports.remove("flash_attn")
    return imports


with patch("transformers.dynamic_module_utils.get_imports", fixed_get_imports):
    # Initialize Janus model and processors
    try:
        vl_chat_processor = VLChatProcessor.from_pretrained(JANUS_MODEL_PATH)
        tokenizer = vl_chat_processor.tokenizer
        model = MultiModalityCausalLM.from_pretrained(JANUS_MODEL_PATH)
    except Exception as e:
        print(f"Error loading Janus model: {e}")
        exit(1)

    # Move model to device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device).eval()

    # Initialize Whisper model
    whisper_model = whisper.load_model(WHISPER_MODEL_NAME)

# Function to generate text using Janus
def generate_text_with_janus(prompt, max_length=150, temperature=0.8, top_p=0.9, **kwargs):
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=max_length,
            temperature=temperature,
            top_p=top_p,
            do_sample=True,
            **kwargs
        )
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated_text

# Function to generate image using Janus
def generate_image_with_janus(prompt, negative_prompt="", guidance_scale=7.5, num_inference_steps=50, img_size=384, temperature=1.0, seed=None):
    if seed is not None:
        torch.manual_seed(seed)
    # Prepare inputs
    tokens = vl_chat_processor.process_text(prompt)
    tokens = tokens.to(device)

    # Generate image tokens
    with torch.no_grad():
        image_tokens = model.generate_image(
            input_ids=tokens.input_ids,
            attention_mask=tokens.attention_mask,
            max_length=img_size * img_size // 256,  # For 16x16 patches
            do_sample=True,
            temperature=temperature,
            guidance_scale=guidance_scale,
            negative_prompt=negative_prompt,
            num_inference_steps=num_inference_steps
        )

    # Decode image tokens to image
    image = model.decode_image_tokens(image_tokens)
    return image

# Endpoint to generate templates (text generation)
@app.route("/generate-template", methods=["POST"])
def generate_template():
    data = request.get_json()
    notes = data.get("notes", [])
    documents = data.get("documents", [])
    parameters = data.get("parameters", {})
    custom_attributes = data.get("customAttributes", {})

    # Construct the prompt based on notes and documents
    prompt = "Based on the following notes and documents, generate diverse and creative note templates:\n\n"

    for note in notes:
        prompt += f"- {note['title']}: {note['content'][:100]}...\n"

    for doc in documents:
        prompt += f"- Document {doc['name']} content summary.\n"

    # Include custom attributes if any
    if custom_attributes:
        prompt += "\nCustom Attributes:\n"
        for attr, value in custom_attributes.items():
            prompt += f"- {attr}: {value}\n"

    prompt += "\nPlease generate templates that are creative, diverse, and relevant to the topics above."

    # Generate text using Janus
    generated_text = generate_text_with_janus(
        prompt,
        max_length=parameters.get("max_length", 150),
        temperature=parameters.get("creativityLevel", 0.7),
        top_p=parameters.get("topicRelevance", 0.9)
    )

    # Split the generated text into templates
    templates = [t.strip() for t in generated_text.strip().split('\n') if t.strip()]

    return jsonify({"templates": templates})

# Endpoint to process images (image description)
@app.route("/process-image", methods=["POST"])
def process_image():
    # Check if an image file is included in the request
    if 'image_file' not in request.files:
        return jsonify({"error": "No image file provided."}), 400

    image_file = request.files['image_file']
    image = PIL.Image.open(image_file.stream).convert("RGB")

    # Convert image to the format expected by Janus
    image_input = vl_chat_processor.process_image(image).to(device)

    # Generate description using Janus
    prompt = "Describe the following image in detail:"
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    inputs.update({"images": image_input.pixel_values})

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=150,
            temperature=0.8,
            top_p=0.9,
            do_sample=True
        )

    description = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return jsonify({"description": description})

# Endpoint to transcribe audio using Whisper
@app.route("/transcribe-audio", methods=["POST"])
def transcribe_audio():
    if 'audio_file' not in request.files:
        return jsonify({"error": "No audio file provided."}), 400

    audio_file = request.files['audio_file']
    # Save the uploaded file to a temporary file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio_file.save(tmp.name)
        temp_filename = tmp.name

    try:
        # Transcribe the audio file using Whisper
        result = whisper_model.transcribe(temp_filename)
        transcription = result.get('text', '')
        # Clean up temporary file
        os.unlink(temp_filename)
        return jsonify({"transcription": transcription})
    except Exception as e:
        os.unlink(temp_filename)
        print(f"Error transcribing audio: {e}")
        return jsonify({"error": "Audio transcription failed."}), 500

# Endpoint to generate image from text prompt
@app.route("/generate-image", methods=["POST"])
def generate_image():
    data = request.get_json()
    prompt = data.get("prompt", "Generate an image")
    negative_prompt = data.get("negative_prompt", "")
    guidance_scale = data.get("guidance_scale", 7.5)
    num_inference_steps = data.get("num_inference_steps", 50)
    img_size = data.get("img_size", 384)
    temperature = data.get("temperature", 1.0)
    seed = data.get("seed", None)

    # Generate image using Janus
    image = generate_image_with_janus(
        prompt=prompt,
        negative_prompt=negative_prompt,
        guidance_scale=guidance_scale,
        num_inference_steps=num_inference_steps,
        img_size=img_size,
        temperature=temperature,
        seed=seed
    )

    # Save the image to a file
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    image_filename = f"generated_image_{timestamp}.png"
    image_path = os.path.join("generated_images", image_filename)

    # Ensure the directory exists
    os.makedirs("generated_images", exist_ok=True)

    if isinstance(image, PIL.Image.Image):
        image.save(image_path)
        return jsonify({"image_path": image_path})
    else:
        return jsonify({"error": "Image generation failed."}), 500

if __name__ == "__main__":
    app.run(port=8000)

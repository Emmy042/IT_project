import './style.css';
import { InferenceClient } from "https://cdn.jsdelivr.net/npm/@huggingface/inference@latest/+esm";

// HuggingFace client
const client = new InferenceClient(import.meta.env.VITE_API_KEY);

//  Render backend URL
const BACKEND_URL = "https://it-project-r725.onrender.com";  

const gallery = document.getElementById("gallery");
const downloadBtn = document.getElementById("downloadBtn");
const imageBox = document.getElementById("imageBox");

let allImages = [];
let currentIndex = 0;
const IMAGES_PER_VIEW = 3;


// Load all saved images
async function loadImages() {
  try {
    const res = await fetch(`${BACKEND_URL}/images`);
    allImages = await res.json();
    currentIndex = 0;
    renderImages();
  } catch (err) {
    console.error("❌ Failed to load images:", err);
  }
}


// Render gallery
function renderImages() {
  gallery.innerHTML = "";

  const slice = allImages.slice(currentIndex, currentIndex + IMAGES_PER_VIEW);
  slice.forEach(img => {
    const wrapper = document.createElement("div");
    wrapper.className = "gallery-item";

    const el = document.createElement("img");
    el.src = img.url;
    el.className = "gallery-img";

    const caption = document.createElement("p");
    caption.className = "user_input";
    caption.textContent = img.prompt;

    wrapper.appendChild(el);
    wrapper.appendChild(caption);
    gallery.appendChild(wrapper);
  });
}


// Handle image generation + upload
document.getElementById("submit").addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  const question = document.getElementById("prompt-box").value;
  const outputBox = document.querySelector(".output-box");


  outputBox.querySelectorAll("p").forEach(p => p.remove());

  const p = document.createElement("p");
  p.style.color = "black";

  if (!question) {
    p.textContent = "Please enter a prompt before clicking Generate!";
    outputBox.appendChild(p);
    return;
  }

  p.textContent = "thinking ...";
  outputBox.appendChild(p);

  try {
    //  Generate image
    const imageBlob = await client.textToImage({
      provider: "replicate",
      model: "black-forest-labs/FLUX.1-dev",
      inputs: question,
      parameters: { num_inference_steps: 5 }
    });

    //  Display generated image in output box 
    const previewUrl = URL.createObjectURL(imageBlob);
    imageBox.src = previewUrl;
    imageBox.style.display = "block"; // make sure it’s visible

    // Ensure outputBox shows imageBox
    if (!outputBox.contains(imageBox)) {
      outputBox.appendChild(imageBox);
    }

    downloadBtn.style.display = "inline-block";
    downloadBtn.onclick = () => {
      const link = document.createElement("a");
      link.href = previewUrl;
      link.download = "generated.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Upload to backend
    const formData = new FormData();
    formData.append("image", imageBlob, "generated.png");
    formData.append("prompt", question);

    const res = await fetch(`${BACKEND_URL}/images`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Failed to save image");

    const savedImage = await res.json();


    allImages.unshift(savedImage);
    renderImages();
    imageBox.src = savedImage.url;

    
    p.textContent = "";

  } catch (err) {
    console.error("❌ Error generating/uploading:", err);
    outputBox.querySelectorAll("p").forEach(p => p.remove());

    const errorMsg = document.createElement("p");
    errorMsg.style.color = "red";
    errorMsg.textContent = "An error occurred while generating/uploading the image.";
    outputBox.appendChild(errorMsg);
  }
});


loadImages();

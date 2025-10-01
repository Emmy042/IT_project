import './style.css';

import { InferenceClient } from "https://cdn.jsdelivr.net/npm/@huggingface/inference@latest/+esm";

const client = new InferenceClient(import.meta.env.VITE_API_KEY);

const gallery = document.getElementById("gallery");

const downloadBtn = document.getElementById("downloadBtn");

let allImages = [];
let currentIndex = 0;
const IMAGES_PER_VIEW = 3;


// Load all saved images + prompts from DB
async function loadImages() {
  try {
    const res = await fetch("http://localhost:5000/images");
    allImages = await res.json();
    currentIndex = 0;
    renderImages();
    } catch (err) {
      console.error("Failed to load images:", err);
    }
  }

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


document.getElementById("submit").addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation(); 
  const question = document.getElementById("prompt-box").value;
  const outputBox = document.querySelector(".output-box");
  const imageBox = document.getElementById("imageBox");

  const existingP = outputBox.querySelector("p");
  if (existingP) existingP.remove();

  const p = document.createElement("p");
  p.style.color = "black";

   if (!question) {
    p.textContent = "Please enter a prompt before clicking the Generate button!!";
    outputBox.appendChild(p);
    return;
  }

  p.textContent = "thinking ...";
  outputBox.appendChild(p);
    

    try {
         
        const imageBlob = await client.textToImage({
            provider: "replicate",
            model: "black-forest-labs/FLUX.1-dev",
            inputs: question,
            parameters: { num_inference_steps: 5 }
        });

        const previewUrl = URL.createObjectURL(imageBlob);
        imageBox.src = previewUrl;
        

        //  Enable download button
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

        const res = await fetch("http://localhost:5000/images", {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            throw new Error("Failed to save image");
        }


        const savedImage = await res.json();
        allImages.unshift(savedImage);
        renderImages();
        imageBox.src = savedImage.url;

        p.textContent = "";


    } catch (err) {
      const existingP = outputBox.querySelector("p");
      if (existingP) existingP.remove();

      const errorMsg = document.createElement("p");
      errorMsg.style.color = "red";

      errorMsg.textContent = "sorry, the free plan has been exhausted!!";

        outputBox.appendChild(errorMsg);
    }

});

loadImages();

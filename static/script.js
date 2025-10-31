const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// URL do backend (Render ou local)
const BACKEND_URL = "/detect"; // ou "https://seuapp.onrender.com/detect"

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Quando o vídeo começar, inicia a detecção a cada 2 segundos
    video.addEventListener("playing", () => {
      setInterval(detectFrame, 2000); // 1 frame a cada 2 segundos
    });
  } catch (err) {
    console.error("Erro ao acessar a webcam:", err);
  }
}

async function detectFrame() {
  // Desenha o frame atual no canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Converte o frame em base64
  const base64 = canvas.toDataURL("image/jpeg");

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 })
    });

    const detections = await res.json();

    // Redesenha o frame antes de desenhar as caixas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.font = "16px Arial";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";
    ctx.fillStyle = "red";

    detections.forEach(d => {
      const [x1, y1, x2, y2] = d.box;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.fillText(`${d.class} ${(d.confidence * 100).toFixed(1)}%`, x1, y1 - 5);
    });
  } catch (err) {
    console.error("Erro ao enviar frame:", err);
  }
}

startCamera();

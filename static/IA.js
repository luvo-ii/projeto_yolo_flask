const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Pega acesso à webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    console.error("Erro ao acessar a webcam:", err);
  });

// Função para capturar frame e enviar para o Flask
async function detectFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const base64 = canvas.toDataURL("image/jpeg");

  try {
    const res = await fetch("/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 })
    });

    const detections = await res.json();

    // Desenha as detecções
    ctx.font = "16px Arial";
    ctx.lineWidth = 2;
    detections.forEach(d => {
      const [x1, y1, x2, y2] = d.box;
      ctx.strokeStyle = "red";
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.fillStyle = "red";
      ctx.fillText(`${d.class} (${(d.confidence * 100).toFixed(1)}%)`, x1, y1 - 5);
    });
  } catch (err) {
    console.error("Erro ao receber detecções:", err);
  }

  requestAnimationFrame(detectFrame);
}

// Começa a detecção assim que o vídeo estiver pronto
video.addEventListener("playing", () => {
  detectFrame();
});

const fileInput = document.getElementById("fileInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const base64 = canvas.toDataURL("image/jpeg");

const res = await fetch("https://meu-flask-detector.onrender.com/detect", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ image: base64 })
});


  const detections = await res.json();

  detections.forEach(d => {
    const [x1, y1, x2, y2] = d.box;
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.fillStyle = "red";
    ctx.fillText(`${d.class} (${(d.confidence * 100).toFixed(1)}%)`, x1, y1 - 5);
  });
});

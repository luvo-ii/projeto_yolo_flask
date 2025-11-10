// Server.js
import express from "express";
import { spawn } from "child_process";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Endpoint da IA
app.post("/api/detect", (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "Nenhuma imagem recebida" });

  const python = spawn("python", ["yolo_detect.py"]);

  let output = "";
  python.stdout.on("data", data => {
    output += data.toString();
  });

  python.stderr.on("data", data => {
    console.error("Erro Python:", data.toString());
  });

  python.on("close", () => {
    try {
      const detections = JSON.parse(output);
      res.json(detections);
    } catch (err) {
      res.status(500).json({ error: "Erro ao processar detecção" });
    }
  });

  python.stdin.write(image);
  python.stdin.end();
});

app.listen(3000, () => console.log("Servidor Node rodando na porta 3000 🚀"));

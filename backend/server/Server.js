// Importações
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Configuração inicial
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Corrige caminhos (importante pro Render)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do frontend
const FRONTEND_DIR = path.join(__dirname, "../../frontend/html");

// Servir arquivos estáticos (HTML, CSS, JS, imagens)
app.use(express.static(FRONTEND_DIR));
app.use("/js", express.static(path.join(__dirname, "../../frontend/js")));
app.use("/css", express.static(path.join(__dirname, "../../frontend/css")));

// Rota principal
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// Exemplo de rota de login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Exemplo simples (depois tu pode conectar ao MongoDB)
  if (email === "Adm@gmail.com" && password === "ADM001") {
    return res.json({ success: true, redirect: "/index.html" });
  } else {
    return res.status(401).json({ success: false, message: "Credenciais inválidas" });
  }
});

// Porta (Render usa process.env.PORT)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));

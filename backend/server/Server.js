// -------------------------------
// ✅ Server.js final (Node + Render)
// -------------------------------

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

// Corrige caminhos (necessário em ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminhos do frontend
const FRONTEND_DIR = path.join(__dirname, "../../frontend/html");
const JS_DIR = path.join(__dirname, "../../frontend/js");
const CSS_DIR = path.join(__dirname, "../../frontend/css");
const IMG_DIR = path.join(__dirname, "../../frontend/img");

// Servir arquivos estáticos (HTML, CSS, JS, imagens)
app.use(express.static(FRONTEND_DIR));
app.use("/js", express.static(JS_DIR));
app.use("/css", express.static(CSS_DIR));
app.use("/img", express.static(IMG_DIR));

// Rota principal → abre homepage.html no acesso root
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "homepage.html"));
});

// Rota de login (exemplo simples)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Exemplo simples — substitua pela lógica do MongoDB depois
  if (email === "Adm@gmail.com" && password === "ADM001") {
    return res.json({ success: true, redirect: "/index.html" });
  } else {
    return res.status(401).json({ success: false, message: "Credenciais inválidas" });
  }
});

// Rota fallback (404 para páginas não encontradas)
app.use((req, res) => {
  res.status(404).sendFile(path.join(FRONTEND_DIR, "404.html"));
});

// Porta (Render define automaticamente em process.env.PORT)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));

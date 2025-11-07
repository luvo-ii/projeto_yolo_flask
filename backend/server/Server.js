// Arquivo: /backend/server.js

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });
console.log("🔍 Valor de MONGO_URI:", process.env.MONGO_URI);
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

const mongoUrl = process.env.MONGO_URI;

// --- Middlewares ---
app.use(cors());
app.use(express.json()); // NECESSÁRIO para o login ler o JSON do front-end

let db;

// --- Conexão com o Banco de Dados ---
MongoClient.connect(mongoUrl)
    .then(client => {
        console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
        db = client.db("VisionQ"); // Especifica o banco de dados aqui
    })
    .catch(error => {
        console.error('❌ Erro ao conectar ao MongoDB Atlas:', error.message);
        process.exit(1);
    });

// --- Servindo o Frontend ---
const frontendPath = path.join(__dirname, '../../frontend/html');
app.use(express.static(frontendPath));
app.use('/css', express.static(path.join(__dirname, '../../frontend/css')));
app.use('/img', express.static(path.join(__dirname, '../../frontend/img')));

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});


// --- ROTAS DE API ---

// --- ROTA DE LOGIN (CORRIGIDA COM A LÓGICA DE 'role') ---
app.post('/api/login', async (req, res) => {
    if (!db) return res.status(503).json({ message: 'Serviço indisponível' });

    try {
        // 1. Pega o email e senha enviados pelo front-end
        const { email, password } = req.body;

        if (!email || !password) {
             return res.status(400).json({ message: 'Email e senha são obrigatórios' });
        }

        // 2. Procura o usuário no banco de dados pelo email
        const user = await db.collection('users').findOne({ email: email });

        // 3. Se o usuário não for encontrado
        if (!user) {
            return res.status(400).json({ message: 'Email ou senha inválidos.' });
        }

        // 4. Se o usuário existe, compara a senha digitada com a senha do banco
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (isPasswordMatch) {
            // SENHA CORRETA!
            
            // --- LÓGICA DE TRADUÇÃO DE PERMISSÃO ---
            // Converte o 'role' (1, 2, 3) para o que o front-end espera
            let accessLevel = 'operador'; // Define 'operador' como padrão
            
            // Com base no que você disse: 1=operador, 2=gerente, 3=administrador
            switch(user.role) {
                case "3": // Administrador
                    accessLevel = 'gestor';
                    break;
                case "2": // Gerente
                    accessLevel = 'supervisor';
                    break;
                case "1": // Operador
                default:
                    accessLevel = 'operador';
                    break;
            }
            // --- FIM DA LÓGICA DE TRADUÇÃO ---

            // Enviamos o 'accessLevel' (traduzido) como 'cargo' para o front-end
            res.status(200).json({ 
                message: 'Login bem-sucedido!',
                userId: user._id,
                name: user.name,
                cargo: accessLevel // <-- MUDANÇA PRINCIPAL AQUI
            });

        } else {
            // SENHA INCORRETA!
            res.status(400).json({ message: 'Email ou senha inválidos.' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor durante o login', error: error.message });
    }
});


// Rota de Alertas
app.get('/api/alerts', async (req, res) => {
    if (!db) return res.status(503).json({ message: 'Serviço indisponível' });
    try {
        const alertsFromDb = await db.collection('alertas').find().sort({ timestamp: -1 }).limit(20).toArray();
        const alerts = alertsFromDb.map(a => ({
            data: a.timestamp,
            horario: new Date(a.timestamp).toLocaleTimeString('pt-BR'),
            local: a.localizacao,
            descricao: a.mensagem,
            prioridade: a.mensagem.includes('MANUTENÇÃO') ? 'alta' : 'crítica'
        }));
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar alertas', error: error.message });
    }
});

// Rota de Estatísticas de Alertas
app.get('/api/alerts/stats', async (req, res) => {
    if (!db) return res.status(503).json({ message: 'Serviço indisponível' });
    try {
        const aggregationPipeline = [
            {$addFields: {prioridade_temp: {$cond: { if: { $in: ["MANUTENÇÃO", "$mensagem"] }, then: "alta", else: "crítica" }},horario_temp: {$substr: [ { $dateToString: { format: "%H:%M:%S", date: "$timestamp" } }, 0, 2]}}},
            {$facet: {'byLocation': [{$group: {_id: '$localizacao',count: {$sum: 1}}},{$sort: {count: -1}}],'byPriority': [{$group: {_id: '$prioridade_temp',count: {$sum: 1}}}],'byHour': [{$group: {_id: '$horario_temp',count: {$sum: 1}}},{$sort: {_id: 1}}]}}
        ];
        const result = await db.collection('alertas').aggregate(aggregationPipeline).toArray();
        res.json(result[0] || { byLocation: [], byPriority: [], byHour: [] });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
    }
});

// Rota para buscar todos os usuários/funcionários
app.get('/api/users', async (req, res) => {
    if (!db) return res.status(503).json({ message: 'Serviço indisponível' });
    try {
        const users = await db.collection('users').find().toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
    }
});

// Rota para buscar os dados de produção
app.get('/api/production', async (req, res) => {
    if (!db) return res.status(503).json({ message: 'Serviço indisponível' });
    try {
        const productionData = await db.collection('producao').findOne();
        res.json(productionData);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar dados de produção', error: error.message });
    }
});

// Rota para buscar os setores
app.get('/api/sectors', async (req, res) => {
    if (!db) return res.status(503).json({ message: 'Serviço indisponível' });
    try {
        const sectors = await db.collection('setores').find().toArray();
        res.json(sectors);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar setores', error: error.message });
    }
});

// --- Inicialização do Servidor ---
app.listen(port, () => {
    console.log(`🚀 Servidor backend do VisionQ rodando em http://localhost:${port}`);
});
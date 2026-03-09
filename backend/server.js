const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. RUTA DE SALUT (Separată)
app.get('/api/salut', (req, res) => {
    res.json({ mesaj: "Salut din Backend-ul tău de pe macOS!" });
});

// 2. RUTA DE COMANDĂ (Separată - Aici era greșeala)
app.post('/api/comanda', (req, res) => {
    const { text } = req.body;
    console.log("Am primit comanda:", text);
    
    let raspuns = `Am recepționat: "${text}". Sunt gata pentru procesare.`;
    
    if(text.toLowerCase().includes("cine esti")) {
      raspuns = "Eu sunt VERA, interfața ta inteligentă creată pe macOS.";
    }
  
    res.json({ raspuns });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Serverul duduie pe http://localhost:${PORT}`);
});
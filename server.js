const express = require('express');
const path = require('path');

const app = express();

// Ruta del build de Angular
const angularDist = path.resolve(__dirname, 'dist/soundtribe-front-end');

// Servir archivos estáticos
app.use(express.static(angularDist));

// Para rutas de Angular (HTML5 routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(angularDist, 'index.html'));
});

// Puerto donde se levantará (ej: 4200)
const PORT = 4200;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

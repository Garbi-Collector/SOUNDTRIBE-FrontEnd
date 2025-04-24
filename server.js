const express = require('express');
const path = require('path');
const app = express();

const angularDist = path.resolve(__dirname, 'dist/soundtribe-front-end');

// Forzar redirección con rutas sin extensión
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.') && req.accepts('html')) {
    res.sendFile(path.join(angularDist, 'index.html'));
  } else {
    next();
  }
});

app.use(express.static(angularDist));

const PORT = 4200;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://soundtribe.art:${PORT}`);
});

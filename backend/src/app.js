require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jogosRoutes = require('./routes/jogos.routes');
const authRoutes = require('./routes/auth.routes');
const registosRoutes = require('./routes/registos.routes');
const { iniciarScheduler } = require('./scraper/scheduler');
const adminUtilizadoresRoutes = require('./routes/adminUtilizadores.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'API GRIB Arbitragem a funcionar' });
});

app.use('/api/jogos', jogosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/registos', registosRoutes);
app.use('/api/escalao-valores', require('./routes/escalaoValores'));
app.use('/api/admin/utilizadores', adminUtilizadoresRoutes);

iniciarScheduler();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
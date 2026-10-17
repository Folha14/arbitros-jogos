const axios = require('axios');
const fs = require('fs');

async function inspecionar() {
  const url = 'https://www.fpb.pt/calendario/clube_704/';
  const { data } = await axios.get(url);
  fs.writeFileSync('pagina_fpb.html', data);
  console.log('HTML guardado em pagina_fpb.html, com', data.length, 'caracteres.');
}

inspecionar().catch(console.error);
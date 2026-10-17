const cron = require('node-cron');
const { correrScraper } = require('./fpbScraper');

async function correrScraperComLog(origem) {
  console.log(`A correr scraper (${origem}) da FPB...`);
  try {
    await correrScraper();
  } catch (err) {
    console.error(`Erro no scraper (${origem}):`, err);
  }
}

function iniciarScheduler() {
  correrScraperComLog('arranque do servidor');

  cron.schedule('0 6 * * *', () => {
    correrScraperComLog('agendado 06:00');
  });

  console.log('Scheduler do scraper FPB iniciado (execucao imediata + todos os dias as 06:00).');
}

module.exports = { iniciarScheduler };
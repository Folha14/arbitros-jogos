const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const prisma = require('../config/database');

const URL_CALENDARIO = 'https://www.fpb.pt/calendario/clube_704/';

const MESES = {
  JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06',
  JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12',
};

function converterData(textoData) {
  const partes = textoData.trim().split(/\s+/);
  const dia = partes[0].padStart(2, '0');
  const mes = MESES[partes[1].toUpperCase()];
  const ano = partes[2];
  return `${ano}-${mes}-${dia}`;
}

function converterHora(textoHora) {
  if (!textoHora) return null;
  const limpo = textoHora.trim().replace('H', ':');
  return limpo || null;
}

function gerarHash({ dataJogo, equipaCasa, equipaFora, horaJogo }) {
  const base = `${dataJogo}-${equipaCasa}-${equipaFora}-${horaJogo}`;
  return crypto.createHash('md5').update(base).digest('hex');
}

async function obterCompeticao(nomeCompleto) {
  const [escalao, nomeCompeticao] = nomeCompleto.split('|').map((s) => s.trim());
  const nome = nomeCompeticao || nomeCompleto.trim();

  let competicao = await prisma.competicao.findFirst({
    where: { nome, escalao },
  });

  if (!competicao) {
    competicao = await prisma.competicao.create({
      data: { nome, escalao, epoca: '2025/2026' },
    });
  }

  return competicao;
}

async function correrScraper() {
  console.log('A obter calendario da FPB...');
  const { data: html } = await axios.get(URL_CALENDARIO);
  const $ = cheerio.load(html);

  let dataAtual = null;
  let totalNovos = 0;
  let totalAtualizados = 0;

  const blocos = $('.date, .game-wrapper-a').toArray();

  for (const el of blocos) {
    const $el = $(el);

    if ($el.hasClass('date')) {
      dataAtual = converterData($el.text());
      continue;
    }

    if (!dataAtual) continue;

    const equipaCasa = $el.find('.team-container').not('.right').find('.sigla').text().trim();
    const equipaFora = $el.find('.team-container.right .sigla').text().trim();
    const horaJogo = converterHora($el.find('.hour h3').text());
    const localTexto = $el.find('.location-wrapper .wrapper > span > b').text();
    const [pavilhao, localidade] = localTexto.split(',').map((s) => s.trim());
    const competicaoTexto = $el.find('.competition span').text().trim();
    const fonteUrl = 'https://www.fpb.pt' + $el.attr('href');

    if (!equipaCasa || !equipaFora) continue;

    const hashUnico = gerarHash({ dataJogo: dataAtual, equipaCasa, equipaFora, horaJogo });
    const competicao = await obterCompeticao(competicaoTexto);

    const jogoExistente = await prisma.jogoFPB.findUnique({ where: { hashUnico } });

    await prisma.jogoFPB.upsert({
      where: { hashUnico },
      update: {
        horaJogo,
        pavilhao,
        localidade,
        fonteUrl,
      },
      create: {
        dataJogo: dataAtual,
        horaJogo,
        equipaCasa,
        equipaFora,
        pavilhao,
        localidade,
        competicaoId: competicao.id,
        fonteUrl,
        hashUnico,
      },
    });

    if (jogoExistente) {
      totalAtualizados++;
    } else {
      totalNovos++;
    }
  }

  console.log(`Scraper concluido: ${totalNovos} jogos novos, ${totalAtualizados} atualizados.`);
}

module.exports = { correrScraper };

if (require.main === module) {
  correrScraper()
    .catch(console.error)
    .finally(() => process.exit());
}
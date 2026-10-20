const prisma = require('../config/database');
const { gerarHashJogo } = require('../utils/gerarHashJogo');

function lerId(valor) {
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function normalizarJogo(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { erro: 'Os dados do jogo são inválidos.' };
  }

  for (const campo of ['horaJogo', 'pavilhao', 'localidade', 'fonteUrl']) {
    if (body[campo] != null && typeof body[campo] !== 'string') {
      return { erro: `O campo ${campo} deve ser texto.` };
    }
  }

  const dataJogo = typeof body.dataJogo === 'string' ? body.dataJogo.trim() : '';
  const horaJogo = typeof body.horaJogo === 'string' ? body.horaJogo.trim() : '';
  const equipaCasa = typeof body.equipaCasa === 'string' ? body.equipaCasa.trim() : '';
  const equipaFora = typeof body.equipaFora === 'string' ? body.equipaFora.trim() : '';
  const competicaoId = lerId(body.competicaoId);
  const pavilhao = typeof body.pavilhao === 'string' ? body.pavilhao.trim() : '';
  const localidade = typeof body.localidade === 'string' ? body.localidade.trim() : '';
  const fonteUrl = typeof body.fonteUrl === 'string' ? body.fonteUrl.trim() : '';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataJogo)) {
    return { erro: 'A data deve estar no formato AAAA-MM-DD.' };
  }

  const dataValidada = new Date(`${dataJogo}T00:00:00.000Z`);
  if (Number.isNaN(dataValidada.getTime()) || dataValidada.toISOString().slice(0, 10) !== dataJogo) {
    return { erro: 'A data do jogo não é válida.' };
  }

  if (!equipaCasa || !equipaFora) {
    return { erro: 'As duas equipas são obrigatórias.' };
  }

  if (equipaCasa === equipaFora) {
    return { erro: 'As equipas da casa e visitante devem ser diferentes.' };
  }

  if (!competicaoId) {
    return { erro: 'É necessária uma competição válida.' };
  }

  if (horaJogo && !/^([01]\d|2[0-3]):[0-5]\d$/.test(horaJogo)) {
    return { erro: 'A hora deve estar no formato HH:MM.' };
  }

  if (fonteUrl) {
    try {
      const url = new URL(fonteUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { erro: 'O URL da fonte deve usar HTTP ou HTTPS.' };
      }
    } catch {
      return { erro: 'O URL da fonte não é válido.' };
    }
  }

  return {
    dados: {
      dataJogo,
      horaJogo: horaJogo || null,
      equipaCasa,
      equipaFora,
      competicaoId,
      pavilhao: pavilhao || null,
      localidade: localidade || null,
      fonteUrl: fonteUrl || null,
    },
  };
}

async function verificarCompeticao(competicaoId) {
  return prisma.competicao.findUnique({
    where: { id: competicaoId },
    select: { id: true },
  });
}

function tratarErroJogo(err, res, acao) {
  if (err.code === 'P2002') {
    return res.status(409).json({ erro: 'Já existe um jogo com os mesmos dados identificadores.' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ erro: 'Jogo não encontrado.' });
  }

  if (err.code === 'P2003') {
    return res.status(409).json({ erro: 'Não foi possível concluir a operação devido a uma relação existente.' });
  }

  console.error(`Erro ao ${acao} jogo:`, err);
  return res.status(500).json({ erro: `Erro ao ${acao} jogo.` });
}

async function listarJogos(req, res) {
  try {
    const [jogos, competicoes] = await Promise.all([
      prisma.jogoFPB.findMany({
        include: { competicao: true },
        orderBy: [{ dataJogo: 'desc' }, { horaJogo: 'asc' }],
      }),
      prisma.competicao.findMany({
        select: { id: true, nome: true, escalao: true, epoca: true },
        orderBy: [{ nome: 'asc' }, { escalao: 'asc' }],
      }),
    ]);

    return res.json({ jogos, competicoes });
  } catch (err) {
    return tratarErroJogo(err, res, 'listar');
  }
}

async function criarJogo(req, res) {
  const resultado = normalizarJogo(req.body);
  if (resultado.erro) {
    return res.status(400).json({ erro: resultado.erro });
  }

  try {
    const competicao = await verificarCompeticao(resultado.dados.competicaoId);
    if (!competicao) {
      return res.status(400).json({ erro: 'A competição selecionada não existe.' });
    }

    const jogo = await prisma.jogoFPB.create({
      data: {
        ...resultado.dados,
        hashUnico: gerarHashJogo(resultado.dados),
      },
      include: { competicao: true },
    });

    return res.status(201).json(jogo);
  } catch (err) {
    return tratarErroJogo(err, res, 'criar');
  }
}

async function atualizarJogo(req, res) {
  const id = lerId(req.params.id);
  if (!id) {
    return res.status(400).json({ erro: 'ID de jogo inválido.' });
  }

  const resultado = normalizarJogo(req.body);
  if (resultado.erro) {
    return res.status(400).json({ erro: resultado.erro });
  }

  try {
    const competicao = await verificarCompeticao(resultado.dados.competicaoId);
    if (!competicao) {
      return res.status(400).json({ erro: 'A competição selecionada não existe.' });
    }

    const jogo = await prisma.jogoFPB.update({
      where: { id },
      data: {
        ...resultado.dados,
        hashUnico: gerarHashJogo(resultado.dados),
      },
      include: { competicao: true },
    });

    return res.json(jogo);
  } catch (err) {
    return tratarErroJogo(err, res, 'atualizar');
  }
}

async function apagarJogo(req, res) {
  const id = lerId(req.params.id);
  if (!id) {
    return res.status(400).json({ erro: 'ID de jogo inválido.' });
  }

  try {
    await prisma.jogoFPB.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    return tratarErroJogo(err, res, 'apagar');
  }
}

module.exports = { listarJogos, criarJogo, atualizarJogo, apagarJogo };
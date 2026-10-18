-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "utilizadores" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "funcao_padrao" TEXT,
    "role" TEXT NOT NULL DEFAULT 'utilizador',
    "email_confirmado" BOOLEAN NOT NULL DEFAULT false,
    "token_confirmacao_email" TEXT,
    "codigo_2fa" TEXT,
    "codigo_2fa_expira" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilizadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competicoes" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "escalao" TEXT NOT NULL,
    "epoca" TEXT NOT NULL,

    CONSTRAINT "competicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jogos_fpb" (
    "id" SERIAL NOT NULL,
    "data_jogo" TEXT NOT NULL,
    "hora_jogo" TEXT,
    "equipa_casa" TEXT NOT NULL,
    "equipa_fora" TEXT NOT NULL,
    "pavilhao" TEXT,
    "localidade" TEXT,
    "competicao_id" INTEGER NOT NULL,
    "fonte_url" TEXT,
    "hash_unico" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jogos_fpb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registos_arbitragem" (
    "id" SERIAL NOT NULL,
    "utilizador_id" INTEGER NOT NULL,
    "jogo_fpb_id" INTEGER,
    "data_jogo" TEXT NOT NULL,
    "hora_jogo" TEXT,
    "competicao_id" INTEGER,
    "equipa_casa" TEXT NOT NULL,
    "equipa_fora" TEXT NOT NULL,
    "pavilhao" TEXT,
    "funcao" TEXT NOT NULL,
    "observacoes" TEXT,
    "valor" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registos_arbitragem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalao_valores" (
    "id" SERIAL NOT NULL,
    "equipa" TEXT NOT NULL,
    "escalao" TEXT NOT NULL,
    "valor_arbitro" DECIMAL(65,30) NOT NULL,
    "valor_mesa" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "escalao_valores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilizadores_email_key" ON "utilizadores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "jogos_fpb_hash_unico_key" ON "jogos_fpb"("hash_unico");

-- CreateIndex
CREATE UNIQUE INDEX "escalao_valores_equipa_escalao_key" ON "escalao_valores"("equipa", "escalao");

-- AddForeignKey
ALTER TABLE "jogos_fpb" ADD CONSTRAINT "jogos_fpb_competicao_id_fkey" FOREIGN KEY ("competicao_id") REFERENCES "competicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registos_arbitragem" ADD CONSTRAINT "registos_arbitragem_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registos_arbitragem" ADD CONSTRAINT "registos_arbitragem_jogo_fpb_id_fkey" FOREIGN KEY ("jogo_fpb_id") REFERENCES "jogos_fpb"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registos_arbitragem" ADD CONSTRAINT "registos_arbitragem_competicao_id_fkey" FOREIGN KEY ("competicao_id") REFERENCES "competicoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

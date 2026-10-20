CREATE UNIQUE INDEX "jogos_fpb_data_hora_unique"
ON "jogos_fpb" ("data_jogo", "hora_jogo")
WHERE "hora_jogo" IS NOT NULL;

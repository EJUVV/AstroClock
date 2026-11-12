-- =============================================================================
-- AstroClock · ajuste de 08/11/2026 · passo 1 de 2
-- Novos perfis: diretor_setor e presidente
-- =============================================================================
-- Rodar SOZINHO, numa execução só com este arquivo. Só depois rodar o
-- regras_dos_perfis.sql (passo 2), em outra execução.
--
-- Por quê: o Postgres não deixa usar um valor novo de enum na mesma execução
-- em que ele foi criado. Por isso são dois arquivos.
-- No repositório: duas migrações separadas
--   npx supabase migration new novos_perfis
--   npx supabase migration new regras_dos_perfis
-- =============================================================================

alter type public.perfil add value if not exists 'diretor_setor';
alter type public.perfil add value if not exists 'presidente';

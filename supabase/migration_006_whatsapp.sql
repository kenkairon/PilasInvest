-- =========================================================
-- Migración 006 — pedir WhatsApp en vez de email al sugerir
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- =========================================================

alter table model_suggestions rename column email to whatsapp;

comment on column model_suggestions.whatsapp is
  'Número de WhatsApp que dejó el usuario al sugerir el dispositivo (opcional).';

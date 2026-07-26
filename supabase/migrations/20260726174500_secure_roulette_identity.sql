-- Empêche deux participations avec le même numéro, même si le format diffère.
-- Migration additive : aucun accès public existant n'est retiré avant la bascule V2.
CREATE UNIQUE INDEX IF NOT EXISTS roulette_participations_phone_unique
  ON public.roulette_participations ((regexp_replace(telephone, '\D', '', 'g')));

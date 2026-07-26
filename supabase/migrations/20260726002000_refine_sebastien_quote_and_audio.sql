-- Corrige deux formulations naturelles révélées par l'audit de conversation.

update public.evan_knowledge
set
  answer = 'Le diagnostic et le devis sont gratuits et sans engagement. La solution, le prix et le délai sont confirmés avant l’intervention : aucune réparation supplémentaire n’est engagée sans votre accord.',
  updated_at = now(),
  validated_at = now(),
  validated_by = 'Sébastien · Solution Phone'
where slug = 'diagnostic-devis-accord';

insert into public.evan_training_phrases (knowledge_id, phrase)
select knowledge.id, training.phrase
from public.evan_knowledge as knowledge
join (values
  ('diagnostic-devis-accord','le devis est il gratuit'),
  ('diagnostic-devis-accord','est ce que le diagnostic est payant'),
  ('diagnostic-devis-accord','je dois payer si je ne fais pas la réparation'),
  ('haut-parleur-externe','le son de mon téléphone est très faible'),
  ('haut-parleur-externe','mon téléphone ne fait presque plus de son')
) as training(slug, phrase) on training.slug = knowledge.slug
on conflict (knowledge_id, phrase) do nothing;

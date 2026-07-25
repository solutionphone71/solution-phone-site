insert into public.evan_training_phrases (knowledge_id, phrase)
select knowledge.id, training.phrase
from public.evan_knowledge as knowledge
join (
  values
    ('batterie-autonomie-faible', 'ma batterie est à 70 pourcent'),
    ('batterie-autonomie-faible', 'état de la batterie à 70 %'),
    ('batterie-autonomie-faible', 'capacité maximale batterie iphone'),
    ('message-piece-inconnue', 'mon iphone affiche pièce inconnue'),
    ('message-piece-inconnue', 'message pièce inconnue iphone'),
    ('message-piece-inconnue', 'iphone affiche impossible de vérifier la pièce'),
    ('adresse-contact-solution-phone', 'où se trouve votre magasin'),
    ('adresse-contact-solution-phone', 'quelle est votre adresse'),
    ('adresse-contact-solution-phone', 'comment venir à la boutique')
) as training(slug, phrase) on training.slug = knowledge.slug
on conflict (knowledge_id, phrase) do nothing;

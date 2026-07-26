-- Sébastien explique les choix de qualité sans imposer la solution la plus chère.

insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  follow_up_questions, recommended_actions, warnings,
  source, confidence, status, validated_by, validated_at, updated_at
)
values
  (
    'choisir-qualite-ecran', 'ecran', 'Les quatre qualités d’écran iPhone',
    array['quelles sont les 4 qualités écran iphone','quelle qualité écran iphone choisir','ltps prime soft oled ou relife','écran iphone selon mon budget'],
    array['iphone','écran','qualité','compatible','hd','ltps prime','soft oled','relife','budget'],
    'Pour un écran iPhone, Solution Phone propose jusqu’à quatre niveaux selon le modèle : Compatible HD/LTPS pour le prix le plus doux, LTPS Prime pour un LCD premium lumineux, Soft OLED pour un confort proche de l’origine, et ReLife avec une dalle Apple d’origine reconditionnée et une vitre neuve. Lorsqu’il existe plusieurs qualités, le client choisit selon son budget ; l’équipe confirme la disponibilité, le prix et la qualité avant l’intervention.',
    '["Quel est le modèle exact de l’iPhone ?","Souhaitez-vous privilégier le budget ou le rendu le plus proche de l’origine ?"]'::jsonb,
    '["Présenter uniquement les qualités disponibles pour le modèle","Expliquer le prix et la qualité avant accord","Proposer un devis précis par WhatsApp ou e-mail"]'::jsonb,
    array['Les qualités disponibles et leurs appellations peuvent varier selon le modèle et le fournisseur.'],
    'solution_phone_editorial', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'choisir-qualite-ecran-android', 'ecran', 'Écran Android compatible ou Service Pack',
    array['écran android compatible ou service pack','écran samsung original ou compatible','quelle qualité écran xiaomi','service pack constructeur écran téléphone'],
    array['android','samsung','xiaomi','honor','huawei','pixel','écran','compatible','service pack','constructeur','origine'],
    'Pour un écran Android, Solution Phone propose généralement deux choix selon le modèle : Compatible pour une solution plus économique, ou Service Pack constructeur pour privilégier la pièce officielle de la marque et un rendu proche de l’origine. Toutes les marques ne proposent pas un Service Pack pour chaque modèle ; l’équipe vérifie la disponibilité et annonce le devis précis avant la réparation.',
    '["Quelle est la marque et le modèle exact ?","Souhaitez-vous privilégier le budget ou la pièce constructeur ?"]'::jsonb,
    '["Vérifier la référence exacte","Présenter uniquement les deux qualités réellement disponibles","Proposer le devis par WhatsApp ou e-mail"]'::jsonb,
    array['Ne jamais promettre un Service Pack sans vérifier le modèle et la disponibilité.'],
    'solution_phone_editorial', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'choisir-qualite-batterie', 'batterie', 'Choisir une batterie selon son budget',
    array['batterie compatible ou originale','quelle qualité batterie choisir','batterie constructeur ou compatible','batterie selon mon budget'],
    array['batterie','compatible','originale','origine','constructeur','qualité','budget','choix'],
    'Pour une batterie, le choix dépend du téléphone : sur iPhone, Compatible, TI reconnue ou Originale selon le modèle ; sur Android, Compatible ou Originale constructeur selon disponibilité. L’équipe explique le prix, la compatibilité et les fonctions conservées avant l’intervention. Lorsqu’il existe plusieurs versions pour le modèle, le client choisit celle adaptée à son budget.',
    '["Quelle est la marque et le modèle exact ?","Souhaitez-vous privilégier le budget ou la pièce d’origine ?"]'::jsonb,
    '["Vérifier le modèle et les versions disponibles","Expliquer les différences sans pousser la solution la plus chère","Proposer un devis précis par WhatsApp ou e-mail"]'::jsonb,
    array['La disponibilité et l’affichage de l’état de santé dépendent du modèle, de la pièce et de la méthode d’installation.'],
    'solution_phone_editorial', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  )
on conflict (slug) do update set
  category=excluded.category,
  title=excluded.title,
  question_patterns=excluded.question_patterns,
  keywords=excluded.keywords,
  answer=excluded.answer,
  follow_up_questions=excluded.follow_up_questions,
  recommended_actions=excluded.recommended_actions,
  warnings=excluded.warnings,
  source=excluded.source,
  confidence=excluded.confidence,
  status=excluded.status,
  validated_by=excluded.validated_by,
  validated_at=excluded.validated_at,
  updated_at=excluded.updated_at;

insert into public.evan_training_phrases (knowledge_id, phrase)
select knowledge.id, training.phrase
from public.evan_knowledge as knowledge
join (values
  ('choisir-qualite-ecran','quelles sont vos quatre gammes écran iphone'),
  ('choisir-qualite-ecran','je veux un écran iphone pas trop cher'),
  ('choisir-qualite-ecran','quelle différence entre compatible ltps prime soft oled et relife'),
  ('choisir-qualite-ecran','quel écran iphone ressemble le plus à celui d origine'),
  ('choisir-qualite-ecran-android','écran compatible ou service pack pour mon samsung'),
  ('choisir-qualite-ecran-android','je veux un écran original constructeur xiaomi'),
  ('choisir-qualite-ecran-android','quelle qualité écran android choisir'),
  ('choisir-qualite-ecran-android','service pack disponible pour mon téléphone'),
  ('choisir-qualite-batterie','je veux choisir ma qualité de batterie'),
  ('choisir-qualite-batterie','batterie compatible ou origine constructeur'),
  ('choisir-qualite-batterie','quelle batterie correspond à mon budget'),
  ('choisir-qualite-batterie','est ce que je peux choisir une batterie originale')
) as training(slug, phrase) on training.slug=knowledge.slug
on conflict (knowledge_id, phrase) do nothing;

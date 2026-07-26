-- Une demande générale de réseau ne doit jamais être présentée d’emblée comme
-- une panne de carte mère. Sébastien explique les causes courantes puis mène
-- un diagnostic court avant de transmettre à l’atelier.

update public.evan_knowledge
set
  question_patterns = array[
    'j ai un problème de réseau sur mon iphone',
    'je n ai plus de réseau mobile',
    'aucun service sur mon téléphone',
    'ma carte sim ou esim ne fonctionne plus',
    'je ne peux plus appeler avec mon smartphone'
  ],
  keywords = array[
    'problème réseau', 'réseau mobile', 'aucun service', 'pas de réseau',
    'sim non reconnue', 'carte sim', 'esim', 'appel impossible', 'barres réseau'
  ],
  answer = 'Les causes courantes sont la couverture ou l’opérateur, la SIM/eSIM, puis un réglage ou le logiciel. Après un choc, du liquide ou une réparation, l’antenne ou la carte mère peuvent aussi être en cause.',
  follow_up_questions = '["Quel est le modèle exact ?","Le problème arrive-t-il partout ou seulement à certains endroits ?","Une autre SIM fonctionne-t-elle dans ce téléphone ?","Y a-t-il eu un choc, de l’humidité ou une réparation récente ?"]'::jsonb,
  likely_causes = '["Couverture ou incident opérateur","Carte SIM ou eSIM","Réglage ou problème logiciel temporaire","Antenne, connectique ou carte mère après choc, liquide ou intervention"]'::jsonb,
  recommended_actions = '["Comparer dans un autre lieu","Vérifier si l’opérateur signale un incident","Tester une autre SIM si possible sans modifier les comptes","Faire contrôler l’appareil en atelier si le défaut le suit partout"]'::jsonb,
  warnings = array['Ne pas réinitialiser l’iPhone avant d’avoir vérifié que les données sont sauvegardées.'],
  source = 'solution_phone_editorial',
  confidence = 0.95,
  validated_by = 'Base métier Solution Phone',
  validated_at = now(),
  updated_at = now()
where slug = 'aucun-reseau-sim'
  and status = 'validated';

update public.evan_diagnostic_flows
set
  title = 'Diagnostic réseau mobile',
  steps = '[
    {"key":"model","question":"Quel est le modèle exact de l’iPhone ?","options":[]},
    {"key":"scope","question":"Le réseau manque-t-il partout ou seulement à certains endroits ?","options":["Partout","Seulement dans certains lieux","Je ne sais pas"]},
    {"key":"sim","question":"Si vous pouvez tester, une autre carte SIM fonctionne-t-elle dans cet iPhone ?","options":["Oui","Non","Je ne peux pas tester"]},
    {"key":"incident","question":"Le problème est-il apparu après un choc, de l’humidité ou une réparation ?","options":["Un choc","De l’humidité","Une réparation","Non"]}
  ]'::jsonb,
  completion_message = 'Merci. Ces réponses permettent de distinguer plus facilement l’opérateur, la SIM/eSIM, un réglage, l’antenne ou une panne matérielle. Transmettez ce diagnostic à Solution Phone pour confirmer le contrôle adapté.',
  max_questions = 3,
  updated_at = now()
where slug = 'network'
  and knowledge_slug = 'aucun-reseau-sim'
  and active = true;

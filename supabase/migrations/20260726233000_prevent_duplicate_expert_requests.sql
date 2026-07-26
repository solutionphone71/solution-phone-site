-- Une même question encore en attente ne doit déclencher qu'une seule alerte
-- WhatsApp par conversation, même si le visiteur clique plusieurs fois.
create unique index if not exists evan_expert_requests_one_pending_question_idx
  on public.evan_expert_requests (conversation_id, evan_summary)
  where status = 'pending';

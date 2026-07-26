revoke all on function public.evan_record_knowledge_feedback(uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.evan_record_knowledge_feedback(uuid, uuid, boolean)
  to service_role;

create index if not exists evan_expert_requests_conversation_idx
  on public.evan_expert_requests (conversation_id, created_at desc);

create index if not exists evan_expert_requests_knowledge_idx
  on public.evan_expert_requests (learned_knowledge_id)
  where learned_knowledge_id is not null;

create index if not exists evan_knowledge_feedback_conversation_idx
  on public.evan_knowledge_feedback (conversation_id, created_at desc);

create index if not exists evan_learning_items_knowledge_idx
  on public.evan_learning_items (knowledge_id)
  where knowledge_id is not null;

create index if not exists evan_messages_knowledge_idx
  on public.evan_messages (knowledge_id, created_at desc)
  where knowledge_id is not null;

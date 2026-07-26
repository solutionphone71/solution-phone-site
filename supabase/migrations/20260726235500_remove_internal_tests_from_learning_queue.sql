-- Les propositions générées pendant les audits techniques ne doivent jamais
-- encombrer la file de validation de Sébastien ni devenir des connaissances.
update public.evan_learning_items learning
set
  status = 'rejected',
  metadata = coalesce(learning.metadata, '{}'::jsonb)
    || jsonb_build_object('rejected_reason', 'internal_test_cleanup')
where learning.status = 'review'
  and learning.source_type = 'ai'
  and exists (
    select 1
    from public.evan_conversations conversation
    where learning.source_reference = 'conversation:' || conversation.public_token::text
      and (
        coalesce(conversation.metadata ->> 'origin', '') = 'internal-test'
        or lower(coalesce(conversation.metadata ->> 'page', '')) similar to
          '%(audit|test|retest|verification|regression|codex|qa)%'
      )
  );

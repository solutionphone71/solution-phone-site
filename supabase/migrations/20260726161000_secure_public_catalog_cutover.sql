-- Solution Phone · bascule du catalogue public sécurisé
-- À appliquer uniquement après :
--   1. déploiement des pages qui consomment /functions/v1/public-catalog
--      et /functions/v1/public-roulette ;
--   2. confirmation que l'ERP utilise une clé service_role côté serveur.
-- Le service_role continue de fonctionner et contourne RLS.

begin;

-- Aucun navigateur anonyme ne doit pouvoir modifier le stock, les tarifs
-- ou les réglages internes. Les droits sont retirés explicitement même si
-- une ancienne policy permissive subsiste dans l'historique du projet.
revoke all privileges on table public.settings from anon;
revoke all privileges on table public.phones from anon;
revoke all privileges on table public.phones_neufs from anon;
revoke all privileges on table public.ecrans_prix from anon;
revoke all privileges on table public.prix_reparation_android from anon;
revoke all privileges on table public.roulette_config from anon;
revoke all privileges on table public.roulette_participations from anon;
revoke all privileges on sequence public.roulette_participations_id_seq from anon;

-- Le site public n'utilise pas de session Supabase. Le rôle authenticated
-- n'a donc pas non plus à accéder directement à ces tables métier.
revoke all privileges on table public.settings from authenticated;
revoke all privileges on table public.phones from authenticated;
revoke all privileges on table public.phones_neufs from authenticated;
revoke all privileges on table public.ecrans_prix from authenticated;
revoke all privileges on table public.prix_reparation_android from authenticated;
revoke all privileges on table public.roulette_config from authenticated;
revoke all privileges on table public.roulette_participations from authenticated;
revoke all privileges on sequence public.roulette_participations_id_seq from authenticated;

alter table public.settings enable row level security;
alter table public.phones enable row level security;
alter table public.phones_neufs enable row level security;
alter table public.ecrans_prix enable row level security;
alter table public.prix_reparation_android enable row level security;
alter table public.roulette_config enable row level security;
alter table public.roulette_participations enable row level security;

drop policy if exists "allow all" on public.ecrans_prix;
drop policy if exists "Allow all" on public.phones;
drop policy if exists "Enable all for anon" on public.phones_neufs;
drop policy if exists "ecriture authentifiee" on public.roulette_config;
drop policy if exists "lecture publique" on public.roulette_config;
drop policy if exists "roulette_insert" on public.roulette_participations;
drop policy if exists "roulette_read" on public.roulette_participations;

-- Garde-fou : l'opération doit échouer si un droit direct demeure.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'settings',
    'phones',
    'phones_neufs',
    'ecrans_prix',
    'prix_reparation_android',
    'roulette_config',
    'roulette_participations'
  ] loop
    if has_table_privilege('anon', format('public.%I', table_name), 'select')
      or has_table_privilege('anon', format('public.%I', table_name), 'insert')
      or has_table_privilege('anon', format('public.%I', table_name), 'update')
      or has_table_privilege('anon', format('public.%I', table_name), 'delete') then
      raise exception 'Droits anon encore présents sur %', table_name;
    end if;
  end loop;
end $$;

commit;

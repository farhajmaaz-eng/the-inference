-- One SELECT policy per role; separate mutations avoid redundant permissive policies.
do $$
declare t text; p record;
begin
  foreach t in array array['categories','stories','sources','companies','models','story_companies','story_models','story_editorial','daily_briefings','briefing_stories','entity_events'] loop
    execute format('drop policy admin_write on public.%I', t);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check ((select private.is_admin()))', t);
    execute format('create policy admin_update on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t);
    execute format('create policy admin_delete on public.%I for delete to authenticated using ((select private.is_admin()))', t);
    for p in select policyname, qual from pg_policies where schemaname='public' and tablename=t and 'anon'=any(roles) and cmd='SELECT' loop
      execute format('alter policy %I on public.%I to anon', p.policyname, t);
      execute format('alter policy admin_read on public.%I using ((select private.is_admin()) or (%s))', t, p.qual);
    end loop;
  end loop;
end $$;

-- Qualify the PL/pgSQL argument because the queue also has a payload column.
do $$
declare definition text;
begin
  definition := pg_get_functiondef('private.accept_ingestion(jsonb,text)'::regprocedure);
  if position('where idempotency_key=payload->>' in definition)=0 then raise exception 'Unexpected ingestion function definition'; end if;
  execute replace(definition, 'where idempotency_key=payload->>', 'where idempotency_key=accept_ingestion.payload->>');
end $$;

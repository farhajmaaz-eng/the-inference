-- Resolve an ingestion proposal and its story in one authorized transaction.
create function private.admin_save_reviewed_story(payload jsonb,submission_id uuid,target_id uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare proposal public.ingestion_submissions; sid uuid;
begin
  if not private.is_admin() then raise insufficient_privilege; end if;
  select * into proposal from public.ingestion_submissions where id=submission_id for update;
  if proposal.id is null or proposal.status<>'pending' then raise exception 'Proposal is no longer pending'; end if;
  sid=private.write_story(payload,target_id,false);
  update public.ingestion_submissions set story_id=sid,
    status=case when payload->>'status'='published' then 'accepted' else 'pending' end,
    reviewed_at=case when payload->>'status'='published' then now() else null end where id=submission_id;
  return sid;
end $$;
create function public.save_reviewed_story(payload jsonb,submission_id uuid,target_id uuid default null) returns uuid
language sql security invoker set search_path='' as $$ select private.admin_save_reviewed_story(payload,submission_id,target_id); $$;
revoke all on function private.admin_save_reviewed_story(jsonb,uuid,uuid) from public,anon,authenticated;
revoke all on function public.save_reviewed_story(jsonb,uuid,uuid) from public,anon,authenticated;
grant execute on function private.admin_save_reviewed_story(jsonb,uuid,uuid),public.save_reviewed_story(jsonb,uuid,uuid) to authenticated;

-- Indexed, relational filtering avoids materializing unbounded story ID lists.
create function public.search_stories(search_query text default null,category_slug text default null,company_slug text default null,model_slug text default null,date_from timestamptz default null,date_to timestamptz default null)
returns setof public.stories language sql stable security invoker set search_path='' as $$
  select s.* from public.stories s where s.status='published' and s.published_at<=now()
    and (nullif(trim(search_query),'') is null or s.search_document @@ websearch_to_tsquery('english',left(search_query,200)))
    and (nullif(category_slug,'') is null or s.category=category_slug)
    and (date_from is null or s.published_at>=date_from) and (date_to is null or s.published_at<=date_to)
    and (nullif(company_slug,'') is null or exists(select 1 from public.story_companies sc join public.companies c on c.id=sc.company_id where sc.story_id=s.id and c.slug=company_slug))
    and (nullif(model_slug,'') is null or exists(select 1 from public.story_models sm join public.models m on m.id=sm.model_id where sm.story_id=s.id and m.slug=model_slug));
$$;
revoke all on function public.search_stories(text,text,text,text,timestamptz,timestamptz) from public;
grant execute on function public.search_stories(text,text,text,text,timestamptz,timestamptz) to anon,authenticated;

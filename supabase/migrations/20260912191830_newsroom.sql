-- Commercial newsroom. Public editorial data is separate from private operations.
create schema if not exists private;
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create table private.admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table private.ingestion_keys (
  id uuid primary key default gen_random_uuid(), name text not null,
  token_hash text not null unique, enabled boolean not null default true,
  expires_at timestamptz, created_at timestamptz not null default now()
);
alter table private.admin_members enable row level security;
alter table private.ingestion_keys enable row level security;

create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from private.admin_members where user_id = auth.uid());
$$;
create function public.is_admin() returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_admin();
$$;

create table public.categories (
  slug text primary key check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null, description text not null default '', sort_order integer not null default 0
);
insert into public.categories(slug,name,description,sort_order) values
  ('models','Models','Foundation models, capabilities and releases.',1),
  ('research','Research','Papers, methods and scientific advances.',2),
  ('agents','Agents','Systems that plan, use tools and act.',3),
  ('open-source','Open source','Open code, weights and the developer commons.',4),
  ('developer-tools','Developer tools','The tools and infrastructure used to build AI.',5),
  ('hardware','Hardware','Compute, semiconductors and infrastructure.',6),
  ('robotics','Robotics','Embodied intelligence and physical systems.',7),
  ('funding','Funding','Capital, acquisitions and company building.',8),
  ('regulation','Regulation','Policy, governance and public accountability.',9),
  ('benchmarks','Benchmarks','Measurements, evaluations and their limitations.',10),
  ('companies','Companies','Strategy and developments across the industry.',11);

create table public.stories (
  id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  headline text not null check(length(headline) between 12 and 240), subheadline text,
  summary text not null check(length(summary) between 30 and 2000), body text not null check(length(body) between 80 and 100000),
  category text not null references public.categories(slug),
  status text not null default 'review' check(status in ('draft','review','published','archived')),
  importance integer not null default 3 check(importance between 1 and 5), breaking boolean not null default false,
  featured boolean not null default false, what_changed text[] not null default '{}',
  verification_status text not null default 'unverified' check(verification_status in ('unverified','source_confirmed','corroborated','disputed')),
  hero_image_url text check(hero_image_url is null or hero_image_url ~ '^https://'), hero_image_alt text, hero_image_credit text,
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    setweight(to_tsvector('english',headline),'A') || setweight(to_tsvector('english',summary),'B') || setweight(to_tsvector('english',body),'C')
  ) stored,
  check(status <> 'published' or (published_at is not null and verification_status <> 'unverified')),
  check(hero_image_url is null or length(hero_image_alt) > 0), check(cardinality(what_changed) <= 8)
);
create table public.sources (
  id uuid primary key default gen_random_uuid(), story_id uuid not null references public.stories(id) on delete cascade,
  source_name text not null check(length(source_name) between 2 and 120), source_url text not null check(source_url ~ '^https://'), author text,
  source_type text not null check(source_type in ('announcement','paper','documentation','repository','filing','reporting','other')),
  primary_source boolean not null default false, published_at timestamptz, unique(story_id,source_url)
);
create table public.companies (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text, logo_url text check(logo_url is null or logo_url ~ '^https://'), website text check(website is null or website ~ '^https://'),
  headquarters text, founded_year integer check(founded_year between 1700 and 2200), metadata jsonb not null default '{}',
  status text not null default 'draft' check(status in ('draft','published','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.models (
  id uuid primary key default gen_random_uuid(), company_id uuid references public.companies(id) on delete restrict,
  name text not null, slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), description text,
  release_date date, model_type text, context_window bigint check(context_window > 0),
  input_price_per_million numeric check(input_price_per_million >= 0), output_price_per_million numeric check(output_price_per_million >= 0),
  pricing_notes text, api_available boolean, open_weights boolean, license text,
  website text check(website is null or website ~ '^https://'), metadata jsonb not null default '{}',
  status text not null default 'draft' check(status in ('draft','published','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.story_companies (
  story_id uuid not null references public.stories(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict, primary key(story_id,company_id)
);
create table public.story_models (
  story_id uuid not null references public.stories(id) on delete cascade,
  model_id uuid not null references public.models(id) on delete restrict, primary key(story_id,model_id)
);
create table public.story_editorial (
  story_id uuid primary key references public.stories(id) on delete cascade,
  internal_notes text not null default '', event_key text unique
);
create table public.daily_briefings (
  id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null, introduction text not null, briefing_date date not null unique,
  status text not null default 'draft' check(status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.briefing_stories (
  briefing_id uuid not null references public.daily_briefings(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete restrict, position integer not null,
  primary key(briefing_id,story_id), unique(briefing_id,position)
);
create table public.entity_events (
  id uuid primary key default gen_random_uuid(), company_id uuid references public.companies(id) on delete restrict,
  model_id uuid references public.models(id) on delete restrict, story_id uuid references public.stories(id) on delete set null,
  title text not null, description text, event_type text not null default 'coverage', occurred_at timestamptz not null,
  source_url text check(source_url is null or source_url ~ '^https://'),
  status text not null default 'review' check(status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(), check(company_id is not null or model_id is not null)
);
create table public.ingestion_submissions (
  id uuid primary key default gen_random_uuid(), idempotency_key text not null unique, payload jsonb not null,
  status text not null default 'pending' check(status in ('pending','accepted','rejected','archived')),
  story_id uuid references public.stories(id) on delete set null, duplicate_candidates jsonb not null default '[]',
  agent_name text not null, key_id uuid references private.ingestion_keys(id),
  created_at timestamptz not null default now(), reviewed_at timestamptz
);
create table public.audit_logs (
  id bigint generated always as identity primary key, action text not null, table_name text not null,
  record_id text not null, actor_id uuid, created_at timestamptz not null default now()
);

create index stories_published_feed on public.stories(published_at desc,id) where status='published';
create index stories_category_feed on public.stories(category,published_at desc) where status='published';
create index stories_editorial_queue on public.stories(status,updated_at desc);
create index stories_search on public.stories using gin(search_document);
create index stories_headline_trgm on public.stories using gin(headline extensions.gin_trgm_ops);
create index sources_url on public.sources(source_url);
create index models_company on public.models(company_id);
create index models_release on public.models(release_date desc) where status='published';
create index companies_name on public.companies using gin(name extensions.gin_trgm_ops);
create index models_name on public.models using gin(name extensions.gin_trgm_ops);
create index story_companies_company on public.story_companies(company_id,story_id);
create index story_models_model on public.story_models(model_id,story_id);
create index briefing_stories_story on public.briefing_stories(story_id);
create index briefings_published_date on public.daily_briefings(briefing_date desc) where status='published';
create index events_company_time on public.entity_events(company_id,occurred_at desc);
create index events_model_time on public.entity_events(model_id,occurred_at desc);
create index events_story on public.entity_events(story_id);
create index submissions_queue on public.ingestion_submissions(status,created_at desc);
create index submissions_key_rate on public.ingestion_submissions(key_id,created_at desc);
create index submissions_story on public.ingestion_submissions(story_id);
create index audit_time on public.audit_logs(created_at desc);

-- Never use user-editable metadata as an authorization claim.
do $$ declare tbl text; begin
  foreach tbl in array array['categories','stories','sources','companies','models','story_companies','story_models','story_editorial','daily_briefings','briefing_stories','entity_events','ingestion_submissions','audit_logs'] loop
    execute format('alter table public.%I enable row level security',tbl);
    execute format('create policy admin_read on public.%I for select to authenticated using ((select private.is_admin()))',tbl);
    if tbl not in ('audit_logs','ingestion_submissions') then
      execute format('create policy admin_write on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',tbl);
      execute format('grant select,insert,update,delete on public.%I to authenticated',tbl);
    else
      execute format('grant select on public.%I to authenticated',tbl);
    end if;
  end loop;
end $$;
create policy categories_public on public.categories for select to anon,authenticated using(true);
create policy stories_public on public.stories for select to anon,authenticated using(status='published' and published_at <= now());
create policy companies_public on public.companies for select to anon,authenticated using(status='published');
create policy models_public on public.models for select to anon,authenticated using(status='published');
create policy sources_public on public.sources for select to anon,authenticated using(exists(select 1 from public.stories s where s.id=story_id and s.status='published' and s.published_at <= now()));
create policy story_companies_public on public.story_companies for select to anon,authenticated using(exists(select 1 from public.stories s where s.id=story_id and s.status='published' and s.published_at <= now()) and exists(select 1 from public.companies c where c.id=company_id and c.status='published'));
create policy story_models_public on public.story_models for select to anon,authenticated using(exists(select 1 from public.stories s where s.id=story_id and s.status='published' and s.published_at <= now()) and exists(select 1 from public.models m where m.id=model_id and m.status='published'));
create policy briefings_public on public.daily_briefings for select to anon,authenticated using(status='published' and briefing_date <= current_date);
create policy briefing_stories_public on public.briefing_stories for select to anon,authenticated using(exists(select 1 from public.daily_briefings b where b.id=briefing_id and b.status='published' and b.briefing_date <= current_date) and exists(select 1 from public.stories s where s.id=story_id and s.status='published' and s.published_at <= now()));
create policy events_public on public.entity_events for select to anon,authenticated using(status='published' and occurred_at <= now() and (story_id is null or exists(select 1 from public.stories s where s.id=story_id and s.status='published' and s.published_at <= now())) and (company_id is null or exists(select 1 from public.companies c where c.id=company_id and c.status='published')) and (model_id is null or exists(select 1 from public.models m where m.id=model_id and m.status='published')));
grant select on public.categories,public.stories,public.sources,public.companies,public.models,public.story_companies,public.story_models,public.daily_briefings,public.briefing_stories,public.entity_events to anon;
revoke all on public.story_editorial,public.ingestion_submissions,public.audit_logs from anon;

create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.audit_logs(action,table_name,record_id,actor_id) values(TG_OP,TG_TABLE_NAME,coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id',to_jsonb(new)->>'story_id',to_jsonb(old)->>'story_id','unknown'),auth.uid()); return coalesce(new,old); end $$;
do $$ declare tbl text; begin
  foreach tbl in array array['stories','companies','models','daily_briefings'] loop
    execute format('create trigger touch_updated before update on public.%I for each row execute function private.touch_updated_at()',tbl);
  end loop;
  foreach tbl in array array['stories','sources','companies','models','daily_briefings','entity_events','story_editorial','ingestion_submissions'] loop
    execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function private.audit_change()',tbl);
  end loop;
end $$;

-- Deferred constraint: sources and story can be saved together in one transaction.
create function private.publication_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare sid uuid; s public.stories; n integer; primary_count integer; domains integer;
begin
  if TG_TABLE_NAME='stories' then sid=coalesce(new.id,old.id); else sid=coalesce(new.story_id,old.story_id); end if;
  select * into s from public.stories where id=sid;
  if s.status='published' then
    select count(*),count(*) filter(where primary_source),count(distinct split_part(source_url,'/',3)) into n,primary_count,domains from public.sources where story_id=sid;
    if n=0 or s.verification_status='unverified' then raise exception 'Published stories require sources and a reviewed verification state'; end if;
    if s.verification_status in ('source_confirmed','corroborated') and primary_count=0 then raise exception 'A primary source is required'; end if;
    if s.verification_status='corroborated' and domains<2 then raise exception 'Corroboration requires two source domains'; end if;
  end if;
  return null;
end $$;
create constraint trigger publication_story after insert or update on public.stories deferrable initially deferred for each row execute function private.publication_guard();
create constraint trigger publication_sources after insert or update or delete on public.sources deferrable initially deferred for each row execute function private.publication_guard();

-- Only guarded entry points can invoke the transactional writer.
create function private.write_story(payload jsonb,target_id uuid default null,from_agent boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid=coalesce(target_id,gen_random_uuid()); item jsonb; eid uuid; cid uuid; next_status text;
begin
  if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>150000 then raise exception 'Invalid story payload'; end if;
  next_status=case when from_agent then 'review' else coalesce(payload->>'status','draft') end;
  if target_id is not null and not exists(select 1 from public.stories where id=target_id) then raise exception 'Story not found'; end if;
  insert into public.stories(id,slug,headline,subheadline,summary,body,category,status,importance,breaking,featured,what_changed,verification_status,hero_image_url,hero_image_alt,hero_image_credit,published_at)
  values(sid,payload->>'slug',payload->>'headline',payload->>'subheadline',payload->>'summary',payload->>'body',payload->>'category',next_status,
    coalesce((payload->>'importance')::integer,3),coalesce((payload->>'breaking')::boolean,false),coalesce((payload->>'featured')::boolean,false),
    array(select jsonb_array_elements_text(coalesce(payload->'what_changed','[]'))),coalesce(payload->>'verification_status','unverified'),
    payload->>'hero_image_url',payload->>'hero_image_alt',payload->>'hero_image_credit',
    case when next_status='published' then coalesce((payload->>'published_at')::timestamptz,now()) else (payload->>'published_at')::timestamptz end)
  on conflict(id) do update set slug=excluded.slug,headline=excluded.headline,subheadline=excluded.subheadline,summary=excluded.summary,body=excluded.body,
    category=excluded.category,status=excluded.status,importance=excluded.importance,breaking=excluded.breaking,featured=excluded.featured,
    what_changed=excluded.what_changed,verification_status=excluded.verification_status,hero_image_url=excluded.hero_image_url,
    hero_image_alt=excluded.hero_image_alt,hero_image_credit=excluded.hero_image_credit,published_at=excluded.published_at;
  insert into public.story_editorial(story_id,internal_notes,event_key) values(sid,coalesce(payload->>'internal_notes',''),nullif(payload->>'event_key',''))
    on conflict(story_id) do update set internal_notes=excluded.internal_notes,event_key=excluded.event_key;
  delete from public.sources where story_id=sid;
  for item in select * from jsonb_array_elements(coalesce(payload->'sources','[]')) loop
    insert into public.sources(story_id,source_name,source_url,author,source_type,primary_source,published_at)
      values(sid,item->>'source_name',item->>'source_url',item->>'author',item->>'source_type',coalesce((item->>'primary_source')::boolean,false),(item->>'published_at')::timestamptz);
  end loop;
  delete from public.story_companies where story_id=sid;
  delete from public.story_models where story_id=sid;
  for item in select * from jsonb_array_elements(coalesce(payload->'companies','[]')) loop
    insert into public.companies(slug,name,description,website,status)
      values(item->>'slug',item->>'name',item->>'description',item->>'website',case when next_status='published' then 'published' else 'draft' end)
      on conflict(slug) do nothing;
    select id into eid from public.companies where slug=item->>'slug';
    insert into public.story_companies(story_id,company_id) values(sid,eid) on conflict do nothing;
  end loop;
  for item in select * from jsonb_array_elements(coalesce(payload->'models','[]')) loop
    select id into cid from public.companies where slug=item->>'company_slug';
    if item->>'company_slug' is not null and cid is null then raise exception 'Model company reference does not exist'; end if;
    insert into public.models(slug,name,company_id,description,release_date,model_type,context_window,input_price_per_million,output_price_per_million,pricing_notes,api_available,open_weights,website,license,status)
      values(item->>'slug',item->>'name',cid,item->>'description',(item->>'release_date')::date,item->>'model_type',(item->>'context_window')::bigint,
      (item->>'input_price_per_million')::numeric,(item->>'output_price_per_million')::numeric,item->>'pricing_notes',(item->>'api_available')::boolean,
      (item->>'open_weights')::boolean,item->>'website',item->>'license',case when next_status='published' then 'published' else 'draft' end) on conflict(slug) do nothing;
    select id into eid from public.models where slug=item->>'slug';
    insert into public.story_models(story_id,model_id) values(sid,eid) on conflict do nothing;
    if cid is not null then insert into public.story_companies(story_id,company_id) values(sid,cid) on conflict do nothing; end if;
  end loop;
  -- Entity records remain independently reviewable: publishing a story never silently publishes an existing draft entity.
  return sid;
end $$;

create function private.admin_save_story(payload jsonb,target_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
begin
  if not private.is_admin() then raise insufficient_privilege using message='Admin access required'; end if;
  return private.write_story(payload,target_id,false);
end $$;
create function public.save_story(payload jsonb,target_id uuid default null) returns uuid language sql security invoker set search_path='' as $$ select private.admin_save_story(payload,target_id); $$;

create function private.duplicate_candidates(headline text,event_key text,source_urls text[]) returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(row_to_json(d)),'[]'::jsonb) from (
    select s.id,s.headline,case
      when e.event_key=duplicate_candidates.event_key then 'Same event identifier'
      when exists(select 1 from public.sources x where x.story_id=s.id and x.primary_source and x.source_url=any(source_urls)) then 'Shared primary source'
      else 'Similar headline in the last 7 days' end as reason
    from public.stories s left join public.story_editorial e on e.story_id=s.id
    where (e.event_key=duplicate_candidates.event_key or exists(select 1 from public.sources x where x.story_id=s.id and x.primary_source and x.source_url=any(source_urls))
      or (s.created_at > now()-interval '7 days' and extensions.similarity(s.headline,duplicate_candidates.headline)>0.55))
    order by s.created_at desc limit 8
  ) d;
$$;
create function private.admin_duplicates(headline text,event_key text,source_urls text[]) returns jsonb language plpgsql security definer set search_path='' as $$
begin if not private.is_admin() then raise insufficient_privilege; end if; return private.duplicate_candidates(headline,event_key,source_urls); end $$;
create function public.find_duplicates(headline text,event_key text,source_urls text[]) returns jsonb language sql security invoker set search_path='' as $$ select private.admin_duplicates(headline,event_key,source_urls); $$;

create function private.accept_ingestion(payload jsonb,api_token text) returns jsonb language plpgsql security definer set search_path='' as $$
declare kid uuid; prior public.ingestion_submissions; duplicates jsonb; sid uuid; submission uuid; p jsonb; urls text[];
begin
  if length(api_token)<32 or octet_length(payload::text)>150000 then raise insufficient_privilege using message='Invalid ingestion request'; end if;
  select id into kid from private.ingestion_keys where token_hash=encode(extensions.digest(api_token,'sha256'),'hex') and enabled and (expires_at is null or expires_at>now());
  if kid is null then raise insufficient_privilege using message='Invalid ingestion credential'; end if;
  -- Serialize this key for a cross-instance rate limit and stable idempotency.
  perform pg_advisory_xact_lock(hashtextextended(kid::text,0));
  select * into prior from public.ingestion_submissions where idempotency_key=payload->>'idempotency_key';
  if prior.id is not null then
    if prior.key_id<>kid or prior.payload<>payload then raise exception 'Idempotency key already used for a different request'; end if;
    return jsonb_build_object('submission_id',prior.id,'story_id',prior.story_id,'status',case when jsonb_array_length(prior.duplicate_candidates)>0 then 'duplicate' else 'review' end,'duplicate_candidates',prior.duplicate_candidates,'replayed',true);
  end if;
  if (select count(*) from public.ingestion_submissions where key_id=kid and created_at>now()-interval '1 minute')>=30 then raise exception 'Ingestion rate limit exceeded'; end if;
  if length(payload->>'idempotency_key') not between 8 and 160 or length(payload->>'agent_name') not between 2 and 120 or payload->'story' is null then raise exception 'Invalid ingestion envelope'; end if;
  p=payload->'story';
  if jsonb_array_length(coalesce(p->'sources','[]'))=0 then raise exception 'Agent submissions require at least one source'; end if;
  -- A global event lock prevents two distinct keys creating the same event concurrently.
  perform pg_advisory_xact_lock(hashtextextended('newsroom-ingestion',1));
  select array_agg(x->>'source_url') into urls from jsonb_array_elements(p->'sources') x where (x->>'primary_source')::boolean;
  duplicates=private.duplicate_candidates(p->>'headline',p->>'event_key',coalesce(urls,'{}'));
  if jsonb_array_length(duplicates)=0 then sid=private.write_story(p,null,true); end if;
  insert into public.ingestion_submissions(idempotency_key,payload,story_id,duplicate_candidates,agent_name,key_id)
    values(payload->>'idempotency_key',payload,sid,duplicates,payload->>'agent_name',kid) returning id into submission;
  return jsonb_build_object('submission_id',submission,'story_id',sid,'status',case when jsonb_array_length(duplicates)>0 then 'duplicate' else 'review' end,'duplicate_candidates',duplicates,'replayed',false);
end $$;
create function public.ingest_story(payload jsonb,api_token text) returns jsonb language sql security invoker set search_path='' as $$ select private.accept_ingestion(payload,api_token); $$;

create function private.decide_submission(submission_id uuid,decision text) returns uuid language plpgsql security definer set search_path='' as $$
declare submission public.ingestion_submissions;
begin
  if not private.is_admin() then raise insufficient_privilege; end if;
  select * into submission from public.ingestion_submissions where id=submission_id for update;
  if submission.id is null or submission.status<>'pending' then raise exception 'Submission is no longer pending'; end if;
  if decision='publish' then
    if submission.story_id is null then raise exception 'Resolve possible duplicates in the editor before publishing'; end if;
    update public.stories set status='published',published_at=coalesce(published_at,now()) where id=submission.story_id;
    update public.ingestion_submissions set status='accepted',reviewed_at=now() where id=submission_id;
  elsif decision in ('reject','archive') then
    if submission.story_id is not null then update public.stories set status='archived' where id=submission.story_id and status<>'published'; end if;
    update public.ingestion_submissions set status=case when decision='reject' then 'rejected' else 'archived' end,reviewed_at=now() where id=submission_id;
  else raise exception 'Unknown review decision'; end if;
  return submission.story_id;
end $$;
create function public.review_submission(submission_id uuid,decision text) returns uuid language sql security invoker set search_path='' as $$ select private.decide_submission(submission_id,decision); $$;

create function private.admin_save_briefing(payload jsonb,target_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare bid uuid=coalesce(target_id,gen_random_uuid()); item text; pos integer=0;
begin
  if not private.is_admin() then raise insufficient_privilege; end if;
  if length(payload->>'title')<3 or length(payload->>'introduction')<10 then raise exception 'Add a title and introduction'; end if;
  insert into public.daily_briefings(id,slug,title,introduction,briefing_date,status) values(bid,payload->>'slug',payload->>'title',payload->>'introduction',(payload->>'briefing_date')::date,payload->>'status')
    on conflict(id) do update set slug=excluded.slug,title=excluded.title,introduction=excluded.introduction,briefing_date=excluded.briefing_date,status=excluded.status;
  delete from public.briefing_stories where briefing_id=bid;
  for item in select jsonb_array_elements_text(coalesce(payload->'story_ids','[]')) loop
    insert into public.briefing_stories(briefing_id,story_id,position) values(bid,item::uuid,pos); pos=pos+1;
  end loop;
  return bid;
end $$;
create function public.save_briefing(payload jsonb,target_id uuid default null) returns uuid language sql security invoker set search_path='' as $$ select private.admin_save_briefing(payload,target_id); $$;

-- Trends are transparent counts of published coverage in the preceding 30 days.
create function public.directory_trends() returns jsonb language sql stable security invoker set search_path='' as $$
select jsonb_build_object(
 'companies',coalesce((select jsonb_agg(row_to_json(c)) from (
  select c.id,c.name,c.slug,count(s.id) as mentions from public.companies c join public.story_companies sc on sc.company_id=c.id join public.stories s on s.id=sc.story_id
  where s.status='published' and s.published_at between now()-interval '30 days' and now() group by c.id order by mentions desc,c.name limit 5) c),'[]'),
 'models',coalesce((select jsonb_agg(row_to_json(m)) from (
  select m.id,m.name,m.slug,count(s.id) as mentions from public.models m join public.story_models sm on sm.model_id=m.id join public.stories s on s.id=sm.story_id
  where s.status='published' and s.published_at between now()-interval '30 days' and now() group by m.id order by mentions desc,m.name limit 5) m),'[]'));
$$;

-- Default EXECUTE on new functions is unsafe; grant only the guarded capabilities.
revoke all on all tables in schema private from public,anon,authenticated;
revoke all on all functions in schema private from public,anon,authenticated;
revoke all on function public.is_admin(),public.save_story(jsonb,uuid),public.ingest_story(jsonb,text),public.find_duplicates(text,text,text[]),public.review_submission(uuid,text),public.save_briefing(jsonb,uuid),public.directory_trends() from public;
grant usage on schema private to anon,authenticated;
grant execute on function private.is_admin(),private.accept_ingestion(jsonb,text) to anon,authenticated;
grant execute on function private.admin_save_story(jsonb,uuid),private.admin_duplicates(text,text,text[]),private.decide_submission(uuid,text),private.admin_save_briefing(jsonb,uuid) to authenticated;
grant execute on function public.is_admin(),public.ingest_story(jsonb,text),public.directory_trends() to anon,authenticated;
grant execute on function public.save_story(jsonb,uuid),public.find_duplicates(text,text,text[]),public.review_submission(uuid,text),public.save_briefing(jsonb,uuid) to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant usage on schema private to service_role;
grant all on all tables in schema private to service_role;
alter default privileges in schema private revoke execute on functions from public;

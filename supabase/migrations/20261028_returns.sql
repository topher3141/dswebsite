-- Run once in a Supabase project SQL editor. All access goes through server routes.
create table public.returns_admins (email text primary key check (email = lower(email)), active boolean not null default true);
insert into public.returns_admins(email) values ('keeley@dealsandstealsmd.com'), ('chris@dealsandstealsmd.com');
create table public.returns_claims (
 id uuid primary key, token_hash text not null, request_hash text not null, version integer not null default 1,
 data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.returns_sessions (token_hash text primary key, email text not null references public.returns_admins(email), expires_at timestamptz not null);
create table public.returns_login_tokens (token_hash text primary key, email text not null references public.returns_admins(email), expires_at timestamptz not null);
create table public.returns_limits (key text primary key, count integer not null, resets_at timestamptz not null);
create table public.returns_outbox (
 id uuid primary key default gen_random_uuid(), recipient text not null, subject text not null, body text not null,
 idempotency_key text unique not null, created_at timestamptz not null default now(), sent_at timestamptz, last_error text
);
create index returns_claims_updated on public.returns_claims(updated_at desc);
create index returns_outbox_unsent on public.returns_outbox(created_at) where sent_at is null;
alter table public.returns_admins enable row level security;
alter table public.returns_claims enable row level security;
alter table public.returns_sessions enable row level security;
alter table public.returns_login_tokens enable row level security;
alter table public.returns_limits enable row level security;
alter table public.returns_outbox enable row level security;
revoke all on public.returns_admins, public.returns_claims, public.returns_sessions, public.returns_login_tokens, public.returns_limits, public.returns_outbox from anon, authenticated;
grant all on public.returns_admins, public.returns_claims, public.returns_sessions, public.returns_login_tokens, public.returns_limits, public.returns_outbox to service_role;
create function public.returns_rate_limit(p_key text, p_limit integer, p_seconds integer) returns boolean language plpgsql set search_path = public as $$
declare n integer;
begin
 insert into returns_limits(key,count,resets_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
 on conflict(key) do update set count=case when returns_limits.resets_at<=now() then 1 else returns_limits.count+1 end,
 resets_at=case when returns_limits.resets_at<=now() then now()+make_interval(secs=>p_seconds) else returns_limits.resets_at end returning count into n;
 return n<=p_limit;
end $$;
create function public.returns_consume_login(p_hash text) returns text language plpgsql set search_path = public as $$
declare result text;
begin
 delete from returns_login_tokens where token_hash=p_hash and expires_at>now() returning email into result;
 return result;
end $$;
-- Save claim state, audit history and email notifications atomically.
create function public.returns_save_claim(p_data jsonb, p_previous integer, p_token_hash text, p_request_hash text, p_emails jsonb) returns boolean language plpgsql set search_path = public as $$
declare e jsonb; n integer;
begin
 if p_previous=0 then
  insert into returns_claims(id,token_hash,request_hash,version,data) values((p_data->>'id')::uuid,p_token_hash,p_request_hash,1,p_data) on conflict(id) do nothing;
 else
  update returns_claims set data=p_data,version=(p_data->>'version')::integer,updated_at=now() where id=(p_data->>'id')::uuid and version=p_previous;
 end if;
 get diagnostics n = row_count;
 if n=0 then return false; end if;
 for e in select * from jsonb_array_elements(p_emails) loop
  insert into returns_outbox(recipient,subject,body,idempotency_key) values(e->>'recipient',e->>'subject',e->>'body',e->>'key') on conflict(idempotency_key) do nothing;
 end loop;
 return true;
end $$;
revoke all on function public.returns_rate_limit(text,integer,integer), public.returns_consume_login(text), public.returns_save_claim(jsonb,integer,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.returns_rate_limit(text,integer,integer), public.returns_consume_login(text), public.returns_save_claim(jsonb,integer,text,text,jsonb) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('returns-evidence','returns-evidence',false,3145728,array['image/jpeg','image/png','image/webp','application/pdf']);
-- No public storage policies. The service-role server proxies authorized downloads.

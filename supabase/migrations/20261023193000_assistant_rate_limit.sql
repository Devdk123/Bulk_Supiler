-- Shared AI request windows across Vercel function instances.
-- Only the server's service-role client can use this table and RPC; no IPs or
-- conversation text are stored (bucket_hash is a SHA-256 of the client address).
create table if not exists public.assistant_rate_limits (
  bucket_hash text primary key check (bucket_hash ~ '^[a-f0-9]{64}$'),
  request_count integer not null check (request_count > 0),
  reset_at timestamptz not null
);

create index if not exists assistant_rate_limits_reset_at_idx
  on public.assistant_rate_limits (reset_at);

alter table public.assistant_rate_limits enable row level security;
revoke all on public.assistant_rate_limits from public, anon, authenticated;
grant usage on schema public to service_role;
grant all on public.assistant_rate_limits to service_role;

create or replace function public.consume_assistant_rate_limit(
  p_bucket_hash text,
  p_window_seconds integer,
  p_max_requests integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if p_bucket_hash !~ '^[a-f0-9]{64}$'
     or p_window_seconds < 1 or p_window_seconds > 86400
     or p_max_requests < 1 or p_max_requests > 1000 then
    raise exception 'Invalid assistant rate-limit parameters' using errcode = '22023';
  end if;

  delete from public.assistant_rate_limits
  where bucket_hash in (
    select bucket_hash
    from public.assistant_rate_limits
    where reset_at < v_now - interval '1 day'
    order by reset_at
    limit 500
  );

  insert into public.assistant_rate_limits (bucket_hash, request_count, reset_at)
  values (p_bucket_hash, 1, v_now + make_interval(secs => p_window_seconds))
  on conflict (bucket_hash) do update
    set request_count = case
          when public.assistant_rate_limits.reset_at <= v_now then 1
          else public.assistant_rate_limits.request_count + 1
        end,
        reset_at = case
          when public.assistant_rate_limits.reset_at <= v_now
            then v_now + make_interval(secs => p_window_seconds)
          else public.assistant_rate_limits.reset_at
        end
    where public.assistant_rate_limits.reset_at <= v_now
       or public.assistant_rate_limits.request_count < p_max_requests
  returning request_count into v_request_count;

  return v_request_count is not null;
end;
$$;

revoke all on function public.consume_assistant_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_assistant_rate_limit(text, integer, integer)
  to service_role;

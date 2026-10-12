-- Slug público del diario y suscripciones de Web Push.
-- Pegá este archivo en el SQL Editor del mismo proyecto que la app y dale a Run.
-- Es idempotente.
--
-- El slug se arma al insertar (también desde Android, que no manda la columna)
-- y no cambia si después se renombra el diario.
-- La app web avisa a los lectores cuando nace una edición; el envío lo hace
-- la Edge Function avisar-edicion, con la service role.

-- ---------------------------------------------------------------------------
-- Slug
-- ---------------------------------------------------------------------------

alter table public.diarios add column if not exists slug text;

create or replace function public.slug_base(nombre text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      regexp_replace(
        translate(
          lower(split_part(btrim(coalesce(nombre, '')), ' ', 1)),
          'áéíóúüñàèìòùäëïöâêîôûãõ',
          'aeiouunaeiouaeioaeiouao'
        ),
        '[^a-z0-9]+',
        '',
        'g'
      ),
      ''
    ),
    'diario'
  );
$$;

create or replace function public.asignar_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidato text;
  n int := 1;
  reservados text[] := array['nota', 'avisos', 'publicar', 'diarios', 'archivo', 'login'];
begin
  if new.slug is not null and btrim(new.slug) <> '' then
    return new;
  end if;

  base := public.slug_base(new.nombre);
  if base = any (reservados) then
    base := base || '-diario';
  end if;

  candidato := base;
  while exists (
    select 1 from public.diarios d
    where d.slug = candidato and d.id is distinct from new.id
  ) loop
    n := n + 1;
    candidato := base || '-' || n;
  end loop;

  new.slug := candidato;
  return new;
end;
$$;

drop trigger if exists diarios_slug on public.diarios;
create trigger diarios_slug
  before insert on public.diarios
  for each row execute function public.asignar_slug();

do $$
declare
  r record;
  base text;
  candidato text;
  n int;
  reservados text[] := array['nota', 'avisos', 'publicar', 'diarios', 'archivo', 'login'];
begin
  for r in
    select id, nombre from public.diarios
    where slug is null or btrim(slug) = ''
    order by creado_en
  loop
    base := public.slug_base(r.nombre);
    if base = any (reservados) then
      base := base || '-diario';
    end if;
    candidato := base;
    n := 1;
    while exists (
      select 1 from public.diarios d
      where d.slug = candidato and d.id <> r.id
    ) loop
      n := n + 1;
      candidato := base || '-' || n;
    end loop;
    update public.diarios set slug = candidato where id = r.id;
  end loop;
end $$;

alter table public.diarios alter column slug set not null;
create unique index if not exists diarios_slug_idx on public.diarios (slug);

revoke all on function public.slug_base(text) from public, anon, authenticated;
revoke all on function public.asignar_slug() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Web Push
-- ---------------------------------------------------------------------------

create table if not exists public.push_suscripciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  creada_en timestamptz not null default now(),
  unique (usuario_id, endpoint)
);

alter table public.push_suscripciones enable row level security;

drop policy if exists push_select on public.push_suscripciones;
create policy push_select on public.push_suscripciones
for select to authenticated
using (usuario_id = auth.uid());

drop policy if exists push_insert on public.push_suscripciones;
create policy push_insert on public.push_suscripciones
for insert to authenticated
with check (usuario_id = auth.uid());

drop policy if exists push_update on public.push_suscripciones;
create policy push_update on public.push_suscripciones
for update to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

drop policy if exists push_delete on public.push_suscripciones;
create policy push_delete on public.push_suscripciones
for delete to authenticated
using (usuario_id = auth.uid());

revoke all on public.push_suscripciones from anon, public;
grant select, insert, update, delete on public.push_suscripciones to authenticated;

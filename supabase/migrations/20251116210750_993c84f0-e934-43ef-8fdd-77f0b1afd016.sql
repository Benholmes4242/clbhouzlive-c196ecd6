-- Phase 4C: Season Pass Premium + Season Shop Cosmetic System

-- 1. Season Pass Tiers Table
create table season_pass_tiers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  season_id uuid references seasons(id) on delete cascade,
  tier text check (tier in ('free','premium')) default 'free',
  purchased_at timestamptz default now(),
  unique(user_id, season_id)
);

-- 2. Season Shop Items Table
create table season_shop_items (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  name text not null,
  description text,
  category text check (
    category in (
      'profile_ring',
      'post_frame',
      'reaction_pack',
      'title',
      'theme',
      'badge_variant'
    )
  ),
  rarity text check (rarity in ('common','rare','epic','legendary')),
  icon_url text,
  preview_url text,
  cost int not null default 100,
  is_premium_only boolean default false,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 3. User Cosmetic Unlocks Table
create table user_cosmetic_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  item_id uuid references season_shop_items(id) on delete cascade,
  unlocked_at timestamptz default now(),
  unique(user_id, item_id)
);

-- 4. Cosmetic Loadouts Table
create table cosmetic_loadouts (
  user_id uuid primary key references user_profiles(id) on delete cascade,
  equipped_profile_ring uuid references season_shop_items(id),
  equipped_post_frame uuid references season_shop_items(id),
  equipped_reaction_pack uuid references season_shop_items(id),
  equipped_title uuid references season_shop_items(id),
  equipped_theme uuid references season_shop_items(id),
  updated_at timestamptz default now()
);

-- 5. Season Currency Table (for shop purchases)
create table user_season_currency (
  user_id uuid primary key references user_profiles(id) on delete cascade,
  balance int default 0,
  lifetime_earned int default 0,
  updated_at timestamptz default now()
);

-- RLS Policies

-- season_pass_tiers
alter table season_pass_tiers enable row level security;

create policy "Users can view own season pass"
on season_pass_tiers
for select using (auth.uid() = user_id);

create policy "Users can insert own season pass"
on season_pass_tiers
for insert with check (auth.uid() = user_id);

-- season_shop_items
alter table season_shop_items enable row level security;

create policy "Shop items visible to everyone"
on season_shop_items
for select using (is_active = true);

-- user_cosmetic_unlocks
alter table user_cosmetic_unlocks enable row level security;

create policy "Users can view own unlocks"
on user_cosmetic_unlocks
for select using (auth.uid() = user_id);

create policy "Users can insert own unlocks"
on user_cosmetic_unlocks
for insert with check (auth.uid() = user_id);

-- cosmetic_loadouts
alter table cosmetic_loadouts enable row level security;

create policy "Users can view own loadout"
on cosmetic_loadouts
for select using (auth.uid() = user_id);

create policy "Users can modify own loadout"
on cosmetic_loadouts
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- user_season_currency
alter table user_season_currency enable row level security;

create policy "Users can view own currency"
on user_season_currency
for select using (auth.uid() = user_id);

-- Indexes for performance
create index idx_season_pass_tiers_user on season_pass_tiers(user_id);
create index idx_season_pass_tiers_season on season_pass_tiers(season_id);
create index idx_season_shop_items_season on season_shop_items(season_id);
create index idx_season_shop_items_category on season_shop_items(category);
create index idx_user_cosmetic_unlocks_user on user_cosmetic_unlocks(user_id);
create index idx_user_cosmetic_unlocks_item on user_cosmetic_unlocks(item_id);

-- Trigger to update loadout timestamp
create or replace function update_loadout_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_loadout_timestamp
before update on cosmetic_loadouts
for each row
execute function update_loadout_timestamp();
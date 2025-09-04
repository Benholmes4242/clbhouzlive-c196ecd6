-- Fix RLS policies for swing coach outreach
drop policy if exists "Users can manage their own outreach" on public.swing_coach_outreach;

-- Create separate policies for different operations
create policy "Users can insert their own outreach" on public.swing_coach_outreach
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own outreach" on public.swing_coach_outreach  
  for select using (auth.uid() = user_id);

create policy "Users can update their own outreach" on public.swing_coach_outreach
  for update using (auth.uid() = user_id);

create policy "Users can delete their own outreach" on public.swing_coach_outreach
  for delete using (auth.uid() = user_id);

-- Keep the existing policy for coaches to view targeting outreach
-- (it already exists and works correctly)
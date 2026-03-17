-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Leagues
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private', 'invite-only')),
  max_members INT DEFAULT 20,
  created_by UUID REFERENCES profiles(id),
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- League Members
CREATE TABLE league_members (
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (league_id, user_id)
);

-- League Scores
CREATE TABLE league_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  category TEXT NOT NULL,
  score FLOAT NOT NULL DEFAULT 0,
  rank INT NOT NULL DEFAULT 0,
  UNIQUE(league_id, user_id, week_start, category)
);

-- Daily Metrics (wearable data)
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('oura', 'whoop')),
  readiness_score FLOAT,
  sleep_score FLOAT,
  sleep_duration_hours FLOAT,
  sleep_efficiency FLOAT,
  bedtime TIME,
  wake_time TIME,
  recovery_score FLOAT,
  strain_score FLOAT,
  hrv_avg FLOAT,
  resting_hr FLOAT,
  activity_score FLOAT,
  is_rest_day BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, source)
);

-- Wearable Connections
CREATE TABLE wearable_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('oura', 'whoop')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  provider_user_id TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Indexes
CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date);
CREATE INDEX idx_league_scores_league_category ON league_scores(league_id, category, week_start);
CREATE INDEX idx_league_members_user ON league_members(user_id);
CREATE INDEX idx_achievements_user ON achievements(user_id);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Leagues: public leagues readable by all, members can read private leagues
CREATE POLICY "Public leagues are viewable" ON leagues
  FOR SELECT USING (type = 'public' OR created_by = auth.uid() OR id IN (
    SELECT league_id FROM league_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Authenticated users can create leagues" ON leagues
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "League creators can update" ON leagues
  FOR UPDATE USING (auth.uid() = created_by);

-- League Members
CREATE POLICY "Members are viewable by league members" ON league_members
  FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
    OR league_id IN (SELECT id FROM leagues WHERE type = 'public')
  );
CREATE POLICY "Users can join leagues" ON league_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave leagues" ON league_members
  FOR DELETE USING (auth.uid() = user_id);

-- League Scores: visible to league members
CREATE POLICY "Scores viewable by league members" ON league_scores
  FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
    OR league_id IN (SELECT id FROM leagues WHERE type = 'public')
  );

-- Daily Metrics: users can only see their own
CREATE POLICY "Users can view own metrics" ON daily_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- Wearable Connections: users can only manage their own
CREATE POLICY "Users can view own connections" ON wearable_connections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON wearable_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON wearable_connections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON wearable_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Achievements: users can view all (for social), but only system writes
CREATE POLICY "Achievements are viewable by everyone" ON achievements
  FOR SELECT USING (true);

-- Enable Realtime for league_scores
ALTER PUBLICATION supabase_realtime ADD TABLE league_scores;

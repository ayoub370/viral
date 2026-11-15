-- Table to track ad impressions per user
CREATE TABLE ad_impressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  zone_id INTEGER NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('interstitial', 'outstream', 'banner', 'native')),
  sub_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  revenue REAL DEFAULT 0,
  converted BOOLEAN DEFAULT FALSE
);

-- Index for faster queries
CREATE INDEX idx_ad_impressions_user_id ON ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_created_at ON ad_impressions(created_at);
CREATE INDEX idx_ad_impressions_zone_id ON ad_impressions(zone_id);

-- Table to store daily ad revenue summaries
CREATE TABLE daily_ad_revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  zone_id INTEGER NOT NULL,
  impressions INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(date, zone_id)
);

-- Index for daily revenue queries
CREATE INDEX idx_daily_ad_revenue_date ON daily_ad_revenue(date);

-- RLS policies
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_ad_revenue ENABLE ROW LEVEL SECURITY;

-- Users can view their own ad impressions
CREATE POLICY "select_own_ad_impressions" ON ad_impressions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Users can insert their own ad impressions
CREATE POLICY "insert_own_ad_impressions" ON ad_impressions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Daily revenue is admin only - no public access
CREATE POLICY "no_access_daily_ad_revenue" ON daily_ad_revenue
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- Function to get user's total ad revenue
CREATE OR REPLACE FUNCTION get_user_ad_revenue(user_uuid UUID)
RETURNS REAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_revenue REAL;
BEGIN
  SELECT COALESCE(SUM(revenue), 0) INTO total_revenue
  FROM ad_impressions
  WHERE user_id = user_uuid;
  
  RETURN total_revenue;
END;
$$;

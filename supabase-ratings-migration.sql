-- Create app_ratings table for user ratings
CREATE TABLE IF NOT EXISTS app_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category VARCHAR(50) NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE app_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own ratings
CREATE POLICY "Users can insert their own ratings"
ON app_ratings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own ratings
CREATE POLICY "Users can view their own ratings"
ON app_ratings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
ON app_ratings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
ON app_ratings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_app_ratings_user_id ON app_ratings(user_id);
CREATE INDEX idx_app_ratings_created_at ON app_ratings(created_at DESC);
CREATE INDEX idx_app_ratings_category ON app_ratings(category);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_ratings_updated_at
BEFORE UPDATE ON app_ratings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional - remove in production)
-- This is just for testing purposes
COMMENT ON TABLE app_ratings IS 'Stores user ratings and feedback for the Water Intake Tracker app';

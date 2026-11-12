-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'image-select', 'image-identify', 'fill-blank', 'audio', 'video')),
  question TEXT NOT NULL,
  options JSONB,
  images JSONB,
  correct_answer_index INTEGER,
  correct_answer_text TEXT,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster random selection
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

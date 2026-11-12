-- First, let's identify duplicate questions
-- This query shows all duplicate questions based on question text and type
SELECT 
    question, 
    type, 
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ' ORDER BY id) as question_ids
FROM questions 
GROUP BY question, type 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Remove duplicate questions, keeping only the oldest one (lowest ID)
-- This will delete newer duplicates and keep the original
DELETE FROM questions 
WHERE id NOT IN (
    SELECT MIN(id)
    FROM questions 
    GROUP BY question, type
);

-- Add a unique constraint to prevent future duplicates
-- This ensures no two questions can have the same text and type
ALTER TABLE questions 
ADD CONSTRAINT unique_question_type 
UNIQUE (question, type);

-- Create an index for better performance on question lookups
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON questions(question, type);

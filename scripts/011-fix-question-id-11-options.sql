-- Fix question ID 11 to have only 4 options by removing the "-hide-" option.

-- First, inspect the current state of question ID 11
SELECT id, type, question, options, correct_answer_index
FROM questions
WHERE id = 11;

-- Update question ID 11:
-- Assuming the "-hide-" option is the 5th option (index 4) and needs to be removed.
-- We will reconstruct the JSONB array to exclude the 5th element.
-- If the correct_answer_index was 4 (the 5th option), we need to adjust it to a valid index (e.g., 0 or a known correct one).
-- For simplicity, if the correct_answer_index was 4, we'll set it to 0. Otherwise, it remains unchanged.

UPDATE questions
SET
  options = JSONB_SET(
    options,
    '{4}',
    'null',
    true -- Remove the element at index 4
  ) - 4, -- Remove the element at index 4 (PostgreSQL JSONB operator)
  correct_answer_index = CASE
    WHEN correct_answer_index = 4 THEN 0 -- If the 5th option was correct, set to 0 (or another appropriate default)
    ELSE correct_answer_index
  END,
  updated_at = NOW()
WHERE id = 11
  AND type = 'text' -- Assuming it's a text type based on previous context
  AND JSONB_ARRAY_LENGTH(options) = 5; -- Only update if it currently has 5 options

-- Verify the update for question ID 11
SELECT id, type, question, options, correct_answer_index
FROM questions
WHERE id = 11;

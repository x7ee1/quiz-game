-- Comprehensive script to fix all questions with missing answer data

-- Find all questions missing answer data
SELECT 
    id,
    type,
    question,
    CASE 
        WHEN type = 'fill-blank' AND (correct_answer_text IS NULL OR correct_answer_text = '') THEN 'Missing text answer'
        WHEN type IN ('text', 'image-select', 'image-identify', 'audio', 'video') AND correct_answer_index IS NULL THEN 'Missing index answer'
        ELSE 'OK'
    END as issue
FROM questions 
WHERE (
    (type = 'fill-blank' AND (correct_answer_text IS NULL OR correct_answer_text = ''))
    OR 
    (type IN ('text', 'image-select', 'image-identify', 'audio', 'video') AND correct_answer_index IS NULL)
)
ORDER BY id;

-- Fix all text questions missing correct_answer_index (set to 0 as default)
UPDATE questions 
SET correct_answer_index = 0
WHERE type = 'text' 
  AND correct_answer_index IS NULL 
  AND options IS NOT NULL;

-- Fix all image-select questions missing correct_answer_index (set to 0 as default)
UPDATE questions 
SET correct_answer_index = 0
WHERE type = 'image-select' 
  AND correct_answer_index IS NULL 
  AND images IS NOT NULL;

-- Fix all image-identify questions missing correct_answer_index (set to 0 as default)
UPDATE questions 
SET correct_answer_index = 0
WHERE type = 'image-identify' 
  AND correct_answer_index IS NULL 
  AND options IS NOT NULL;

-- Fix all audio questions missing correct_answer_index (set to 0 as default)
UPDATE questions 
SET correct_answer_index = 0
WHERE type = 'audio' 
  AND correct_answer_index IS NULL 
  AND options IS NOT NULL;

-- Fix all video questions missing correct_answer_index (set to 0 as default)
UPDATE questions 
SET correct_answer_index = 0
WHERE type = 'video' 
  AND correct_answer_index IS NULL 
  AND options IS NOT NULL;

-- Fix all fill-blank questions missing correct_answer_text (set to 'answer' as placeholder)
UPDATE questions 
SET correct_answer_text = 'answer'
WHERE type = 'fill-blank' 
  AND (correct_answer_text IS NULL OR correct_answer_text = '');

-- Final verification - should return no rows if all issues are fixed
SELECT 
    id,
    type,
    question,
    'STILL HAS ISSUES' as status
FROM questions 
WHERE (
    (type = 'fill-blank' AND (correct_answer_text IS NULL OR correct_answer_text = ''))
    OR 
    (type IN ('text', 'image-select', 'image-identify', 'audio', 'video') AND correct_answer_index IS NULL)
)
ORDER BY id;

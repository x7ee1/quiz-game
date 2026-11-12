-- Debug script to check the data for questions that show "N/A"
-- Let's examine the problematic questions: ID 3, 6, 33, 34, 35, 46

SELECT 
    id,
    type,
    question,
    options,
    images,
    correct_answer_index,
    correct_answer_text,
    media_url,
    created_at
FROM questions 
WHERE id IN (3, 6, 33, 34, 35, 46)
ORDER BY id;

-- Also check all questions to see the pattern
SELECT 
    id,
    type,
    CASE 
        WHEN correct_answer_index IS NOT NULL THEN CONCAT('Index: ', correct_answer_index)
        WHEN correct_answer_text IS NOT NULL THEN CONCAT('Text: ', correct_answer_text)
        ELSE 'MISSING'
    END as correct_answer_info,
    options,
    images
FROM questions 
ORDER BY id;

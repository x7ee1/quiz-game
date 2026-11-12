-- Fix the image-select question to have only 4 options instead of 5
-- Remove "Rabbit" and keep Dog, Cat, Bird, Fish
UPDATE questions 
SET images = '[
  "/placeholder.svg?height=100&width=100&text=Dog",
  "/placeholder.svg?height=100&width=100&text=Cat", 
  "/placeholder.svg?height=100&width=100&text=Bird",
  "/placeholder.svg?height=100&width=100&text=Fish"
]'
WHERE id = 2 AND type = 'image-select' AND question = 'Which image shows a cat?';

-- Verify the update
SELECT id, type, question, images, correct_answer_index 
FROM questions 
WHERE id = 2;

-- Update existing questions to have only 4 options instead of 5
UPDATE questions 
SET options = CASE 
  WHEN type = 'text' AND question = 'What''s the capital of Japan?' THEN '["Seoul", "Tokyo", "Beijing", "Bangkok"]'
  WHEN type = 'text' AND question = 'Which planet is known as the Red Planet?' THEN '["Venus", "Jupiter", "Mars", "Saturn"]'  
  WHEN type = 'text' AND question = 'What is the largest ocean on Earth?' THEN '["Atlantic", "Pacific", "Indian", "Arctic"]'
  WHEN type = 'text' AND question = 'Who painted the Mona Lisa?' THEN '["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"]'
  WHEN type = 'image-identify' AND question = 'What is seen in this image?' THEN '["Ocean", "Mountain", "Desert", "Forest"]'
  WHEN type = 'audio' AND question = 'What sound is this?' THEN '["Dog barking", "Cat meowing", "Bird singing", "Rain falling"]'
  WHEN type = 'video' AND question = 'What is shown in this video?' THEN '["Person running", "Car driving", "Bird flying", "Water flowing"]'
  ELSE options
END
WHERE options IS NOT NULL;

-- Update image-select question to have only 4 images
UPDATE questions 
SET images = '[
  "/placeholder.svg?height=100&width=100&text=Dog",
  "/placeholder.svg?height=100&width=100&text=Cat", 
  "/placeholder.svg?height=100&width=100&text=Bird",
  "/placeholder.svg?height=100&width=100&text=Fish"
]'
WHERE type = 'image-select' AND question = 'Which image shows a cat?';

-- Update correct answer indices that were pointing to the 5th option (index 4) to point to the 4th option (index 3)
-- This is just in case any were pointing to the removed 5th option
UPDATE questions 
SET correct_answer_index = CASE
  WHEN correct_answer_index >= 4 THEN 3
  ELSE correct_answer_index
END
WHERE correct_answer_index IS NOT NULL;

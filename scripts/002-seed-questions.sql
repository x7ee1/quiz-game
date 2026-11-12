-- Insert the 10 quiz questions
INSERT INTO questions (type, question, options, correct_answer_index, correct_answer_text, media_url) VALUES
(
  'text',
  'What''s the capital of Japan?',
  '["Seoul", "Tokyo", "Beijing", "Bangkok", "Manila"]',
  1,
  NULL,
  NULL
),
(
  'image-select',
  'Which image shows a cat?',
  NULL,
  1,
  NULL,
  NULL
),
(
  'image-identify',
  'What is seen in this image?',
  '["Ocean", "Mountain", "Desert", "Forest", "City"]',
  1,
  NULL,
  '/placeholder.svg?height=200&width=300&text=Mountain'
),
(
  'fill-blank',
  'Complete the following: Better late than',
  NULL,
  NULL,
  'never',
  NULL
),
(
  'audio',
  'What sound is this?',
  '["Dog barking", "Cat meowing", "Bird singing", "Rain falling", "Wind blowing"]',
  2,
  NULL,
  '/placeholder.mp3'
),
(
  'video',
  'What is shown in this video?',
  '["Person running", "Car driving", "Bird flying", "Water flowing", "Fire burning"]',
  0,
  NULL,
  '/placeholder.mp4'
),
(
  'text',
  'Which planet is known as the Red Planet?',
  '["Venus", "Jupiter", "Mars", "Saturn", "Mercury"]',
  2,
  NULL,
  NULL
),
(
  'text',
  'What is the largest ocean on Earth?',
  '["Atlantic", "Pacific", "Indian", "Arctic", "Southern"]',
  1,
  NULL,
  NULL
),
(
  'fill-blank',
  'Complete: The early bird catches the',
  NULL,
  NULL,
  'worm',
  NULL
),
(
  'text',
  'Who painted the Mona Lisa?',
  '["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo", "Rembrandt"]',
  2,
  NULL,
  NULL
);

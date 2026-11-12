-- Update the image-select question with proper image data
UPDATE questions 
SET images = '[
  "/placeholder.svg?height=100&width=100&text=Dog",
  "/placeholder.svg?height=100&width=100&text=Cat", 
  "/placeholder.svg?height=100&width=100&text=Bird",
  "/placeholder.svg?height=100&width=100&text=Fish",
  "/placeholder.svg?height=100&width=100&text=Rabbit"
]'
WHERE type = 'image-select' AND question = 'Which image shows a cat?';

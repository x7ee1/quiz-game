-- Add constraints to ensure all questions have proper answer data

-- Add a check constraint to ensure fill-blank questions have answer text
ALTER TABLE questions 
ADD CONSTRAINT check_fill_blank_answer 
CHECK (
    type != 'fill-blank' OR 
    (type = 'fill-blank' AND correct_answer_text IS NOT NULL AND correct_answer_text != '')
);

-- Add a check constraint to ensure multiple choice questions have answer index
ALTER TABLE questions 
ADD CONSTRAINT check_multiple_choice_answer 
CHECK (
    type NOT IN ('text', 'image-select', 'image-identify', 'audio', 'video') OR 
    (type IN ('text', 'image-select', 'image-identify', 'audio', 'video') AND correct_answer_index IS NOT NULL)
);

-- Add a check constraint to ensure answer index is within valid range (0-3 for 4 options)
ALTER TABLE questions 
ADD CONSTRAINT check_answer_index_range 
CHECK (
    correct_answer_index IS NULL OR 
    (correct_answer_index >= 0 AND correct_answer_index <= 3)
);

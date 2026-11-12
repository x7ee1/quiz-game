import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = neon(process.env.DATABASE_URL)

export interface Question {
  id: number
  type: "text" | "image-select" | "image-identify" | "fill-blank" | "audio" | "video"
  question: string
  options?: string[]
  images?: string[]
  correct_answer_index?: number
  correct_answer_text?: string
  media_url?: string
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id: number
  type: "text" | "image-select" | "image-identify" | "fill-blank" | "audio" | "video"
  question: string
  options?: string[]
  images?: string[]
  correctAnswer: string | number
  media?: string
}

export type PublicQuizQuestion = Omit<QuizQuestion, "correctAnswer">

export function toPublicQuizQuestion(question: QuizQuestion): PublicQuizQuestion {
  const { correctAnswer: _correctAnswer, ...publicQuestion } = question
  return publicQuestion
}

// Transform database question to quiz question format
function transformQuestion(dbQuestion: Question): QuizQuestion {
  const quizQuestion: QuizQuestion = {
    id: dbQuestion.id,
    type: dbQuestion.type,
    question: dbQuestion.question,
    options: dbQuestion.options,
    images: dbQuestion.images,
    correctAnswer: dbQuestion.correct_answer_text || dbQuestion.correct_answer_index || 0,
    media: dbQuestion.media_url,
  }

  return quizQuestion
}

export async function getRandomQuestions(count = 5): Promise<QuizQuestion[]> {
  try {
    const result = await sql`
      SELECT 
        id,
        type,
        question,
        options,
        images,
        correct_answer_index,
        correct_answer_text,
        media_url,
        created_at,
        updated_at
      FROM questions 
      ORDER BY RANDOM() 
      LIMIT ${count}
    `

    return result.map(transformQuestion)
  } catch (error) {
    console.error("Error fetching random questions:", error)
    throw new Error("Failed to fetch questions from database")
  }
}

export async function getAllQuestions(): Promise<Question[]> {
  try {
    const result = await sql`
      SELECT 
        id,
        type,
        question,
        options,
        images,
        correct_answer_index,
        correct_answer_text,
        media_url,
        created_at,
        updated_at
      FROM questions 
      ORDER BY id
    `

    // Return raw database questions for management interface
    return result.map((row: any) => ({
      id: row.id,
      type: row.type,
      question: row.question,
      options: row.options ? (typeof row.options === "string" ? JSON.parse(row.options) : row.options) : undefined,
      images: row.images ? (typeof row.images === "string" ? JSON.parse(row.images) : row.images) : undefined,
      correct_answer_index: row.correct_answer_index,
      correct_answer_text: row.correct_answer_text,
      media_url: row.media_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  } catch (error) {
    console.error("Error fetching all questions:", error)
    throw new Error("Failed to fetch questions from database")
  }
}

export async function getQuestionsByIds(ids: number[]): Promise<QuizQuestion[]> {
  if (ids.length === 0) {
    return []
  }

  try {
    const result = await sql`
      SELECT 
        id,
        type,
        question,
        options,
        images,
        correct_answer_index,
        correct_answer_text,
        media_url,
        created_at,
        updated_at
      FROM questions 
      WHERE id = ANY(${ids})
    `

    const byId = new Map(result.map((row) => [Number(row.id), transformQuestion(row as Question)]))
    return ids.flatMap((id) => {
      const question = byId.get(id)
      return question ? [question] : []
    })
  } catch (error) {
    console.error("Error fetching questions by IDs:", error)
    throw new Error("Failed to fetch questions from database")
  }
}

export async function getQuestionById(id: number): Promise<QuizQuestion | null> {
  try {
    const result = await sql`
      SELECT 
        id,
        type,
        question,
        options,
        images,
        correct_answer_index,
        correct_answer_text,
        media_url,
        created_at,
        updated_at
      FROM questions 
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return null
    }

    return transformQuestion(result[0] as Question)
  } catch (error) {
    console.error("Error fetching question by ID:", error)
    throw new Error("Failed to fetch question from database")
  }
}

export async function addQuestion(question: Omit<Question, "id" | "created_at" | "updated_at">): Promise<QuizQuestion> {
  try {
    const result = await sql`
      INSERT INTO questions (
        type, 
        question, 
        options, 
        images, 
        correct_answer_index, 
        correct_answer_text, 
        media_url
      )
      VALUES (
        ${question.type},
        ${question.question},
        ${question.options ? JSON.stringify(question.options) : null},
        ${question.images ? JSON.stringify(question.images) : null},
        ${question.correct_answer_index ?? null},
        ${question.correct_answer_text ?? null},
        ${question.media_url ?? null}
      )
      RETURNING 
        id,
        type,
        question,
        options,
        images,
        correct_answer_index,
        correct_answer_text,
        media_url,
        created_at,
        updated_at
    `

    return transformQuestion(result[0] as Question)
  } catch (error) {
    console.error("Error adding question:", error)
    throw new Error("Failed to add question to database")
  }
}

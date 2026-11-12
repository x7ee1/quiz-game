import { NextResponse } from "next/server"
import { getQuestionById, getAllQuestions } from "@/lib/database"
import { requireAdmin } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = neon(process.env.DATABASE_URL)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const unauthorized = await requireAdmin()
    if (unauthorized) {
      return unauthorized
    }

    const { id: rawId } = await params
    const id = Number.parseInt(rawId, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 })
    }

    const question = await getQuestionById(id)

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const unauthorized = await requireAdmin()
    if (unauthorized) {
      return unauthorized
    }

    const { id: rawId } = await params
    const id = Number.parseInt(rawId, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 })
    }

    const body = await request.json()

    // Ensure numbers come through as integers
    if (typeof body.correct_answer_index === "string") {
      body.correct_answer_index = Number.parseInt(body.correct_answer_index)
    }

    // Validate required fields
    if (!body.question) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 })
    }

    // Get the existing question to determine its type
    const existingQuestion = await sql`
      SELECT type, question, correct_answer_index, correct_answer_text FROM questions WHERE id = ${id}
    `

    if (existingQuestion.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const questionType = existingQuestion[0].type
    const currentQuestion = existingQuestion[0].question

    // Check for duplicate questions (excluding the current question being edited)
    if (body.question.trim().toLowerCase() !== currentQuestion.toLowerCase()) {
      try {
        const allQuestions = await getAllQuestions()
        const isDuplicate = allQuestions.some(
          (q) =>
            q.id !== id &&
            q.question.toLowerCase().trim() === body.question.toLowerCase().trim() &&
            q.type === questionType,
        )

        if (isDuplicate) {
          return NextResponse.json(
            { error: "A question with this text and type already exists. Please modify the question text." },
            { status: 409 },
          )
        }
      } catch (duplicateCheckError) {
        console.warn("Could not check for duplicates:", duplicateCheckError)
        // Continue with update if duplicate check fails
      }
    }

    // Type-specific validation
    switch (questionType) {
      case "text":
      case "image-identify":
      case "audio":
      case "video":
        if (!body.options || !Array.isArray(body.options) || body.options.length !== 4) {
          return NextResponse.json({ error: "Exactly 4 options are required for this question type" }, { status: 400 })
        }
        if (body.correct_answer_index === null || body.correct_answer_index === undefined) {
          return NextResponse.json({ error: "Correct answer index is required" }, { status: 400 })
        }
        if (body.correct_answer_index < 0 || body.correct_answer_index > 3) {
          return NextResponse.json({ error: "Correct answer index must be between 0 and 3" }, { status: 400 })
        }
        break

      case "image-select":
        if (!body.images || !Array.isArray(body.images) || body.images.length !== 4) {
          return NextResponse.json(
            { error: "Exactly 4 image URLs are required for image-select questions" },
            { status: 400 },
          )
        }
        if (body.correct_answer_index === null || body.correct_answer_index === undefined) {
          return NextResponse.json({ error: "Correct answer index is required" }, { status: 400 })
        }
        if (body.correct_answer_index < 0 || body.correct_answer_index > 3) {
          return NextResponse.json({ error: "Correct answer index must be between 0 and 3" }, { status: 400 })
        }
        break

      case "fill-blank":
        if (!body.correct_answer_text || !body.correct_answer_text.trim()) {
          return NextResponse.json(
            { error: "Correct answer text is required for fill-blank questions" },
            { status: 400 },
          )
        }
        break
    }

    // ---------- NEW SAFER UPDATE BLOCK ----------
    const correctedIndex =
      body.correct_answer_index !== null && body.correct_answer_index !== undefined
        ? body.correct_answer_index
        : existingQuestion[0].correct_answer_index

    const correctedText =
      body.correct_answer_text !== null && body.correct_answer_text !== undefined
        ? body.correct_answer_text
        : existingQuestion[0].correct_answer_text

    // Guard against the DB check constraint
    if (
      ["text", "image-select", "image-identify", "audio", "video"].includes(questionType) &&
      (correctedIndex === null || correctedIndex === undefined)
    ) {
      return NextResponse.json({ error: "A correct_answer_index is required for this question type." }, { status: 400 })
    }

    const result = await sql`
      UPDATE questions 
      SET 
        question = ${body.question.trim()},
        options  = ${body.options ? JSON.stringify(body.options) : null},
        images   = ${body.images ? JSON.stringify(body.images) : null},
        correct_answer_index = ${correctedIndex},
        correct_answer_text  = ${correctedText},
        media_url = ${body.media_url || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING 
        id, type, question, options, images,
        correct_answer_index, correct_answer_text,
        media_url, created_at, updated_at
    `
    // ---------- END UPDATE BLOCK ----------

    if (result.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    return NextResponse.json({ question: result[0] })
  } catch (error) {
    console.error("API Error:", error)

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("unique_question_type")) {
      return NextResponse.json(
        { error: "A question with this text and type already exists. Please modify the question text." },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update question",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const unauthorized = await requireAdmin()
    if (unauthorized) {
      return unauthorized
    }

    const { id: rawId } = await params
    const id = Number.parseInt(rawId, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM questions 
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete question",
      },
      { status: 500 },
    )
  }
}

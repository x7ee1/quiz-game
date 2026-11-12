import { NextResponse } from "next/server"
import { getRandomQuestions, getAllQuestions, addQuestion, toPublicQuizQuestion } from "@/lib/database"
import { requireAdmin, signQuizAttempt } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const count = searchParams.get("count")
    const random = searchParams.get("random")

    if (random === "true") {
      const requestedCount = count ? Number.parseInt(count) : 5
      const questionCount = Number.isFinite(requestedCount) ? Math.min(Math.max(requestedCount, 1), 5) : 5
      const questions = await getRandomQuestions(questionCount)
      const publicQuestions = questions.map(toPublicQuizQuestion)
      const attemptToken = await signQuizAttempt(publicQuestions.map((question) => question.id))
      return NextResponse.json({ questions: publicQuestions, attemptToken })
    }

    const unauthorized = await requireAdmin()
    if (unauthorized) {
      return unauthorized
    }

    const questions = await getAllQuestions()
    return NextResponse.json({ questions })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireAdmin()
    if (unauthorized) {
      return unauthorized
    }

    const body = await request.json()

    // Validate required fields
    if (!body.type || !body.question) {
      return NextResponse.json({ error: "Type and question are required" }, { status: 400 })
    }

    // Validate question type
    const validTypes = ["text", "image-select", "image-identify", "fill-blank", "audio", "video"]
    if (!validTypes.includes(body.type)) {
      return NextResponse.json({ error: "Invalid question type" }, { status: 400 })
    }

    // Check for duplicate questions (same question text and type)
    try {
      const existingQuestions = await getAllQuestions()
      const isDuplicate = existingQuestions.some(
        (q) => q.question.toLowerCase().trim() === body.question.toLowerCase().trim() && q.type === body.type,
      )

      if (isDuplicate) {
        return NextResponse.json(
          {
            error:
              "A question with this text and type already exists. Please modify the question or choose a different type.",
          },
          { status: 409 },
        )
      }
    } catch (duplicateCheckError) {
      console.warn("Could not check for duplicates:", duplicateCheckError)
      // Continue with creation if duplicate check fails
    }

    // Type-specific validation
    switch (body.type) {
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

    // Media URL validation for specific types
    if ((body.type === "image-identify" || body.type === "audio" || body.type === "video") && !body.media_url) {
      return NextResponse.json({ error: "Media URL is required for this question type" }, { status: 400 })
    }

    const questionData = {
      type: body.type,
      question: body.question.trim(),
      options: body.options,
      images: body.images,
      correct_answer_index: body.correct_answer_index,
      correct_answer_text: body.correct_answer_text,
      media_url: body.media_url,
    }

    const newQuestion = await addQuestion(questionData)
    return NextResponse.json({ question: newQuestion }, { status: 201 })
  } catch (error) {
    console.error("API Error:", error)

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("unique_question_type")) {
      return NextResponse.json(
        {
          error:
            "A question with this text and type already exists. Please modify the question or choose a different type.",
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create question",
      },
      { status: 500 },
    )
  }
}

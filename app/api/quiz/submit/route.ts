import { NextResponse } from "next/server"
import { getQuestionsByIds } from "@/lib/database"
import { verifyQuizAttempt } from "@/lib/auth"

const PASS_MARK = 65

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (typeof body.attemptToken !== "string") {
      return NextResponse.json({ error: "Quiz session is invalid or expired. Start the quiz again." }, { status: 401 })
    }

    const questionIds = await verifyQuizAttempt(body.attemptToken)
    if (!questionIds) {
      return NextResponse.json({ error: "Quiz session is invalid or expired. Start the quiz again." }, { status: 401 })
    }

    if (!Array.isArray(body.answers)) {
      return NextResponse.json({ error: "Answers are required" }, { status: 400 })
    }

    const answersById = new Map<number, string | number | null>()
    for (const entry of body.answers) {
      if (!entry || !Number.isInteger(entry.id)) {
        return NextResponse.json({ error: "Each answer needs a question id" }, { status: 400 })
      }
      if (typeof entry.answer !== "string" && typeof entry.answer !== "number" && entry.answer !== null) {
        return NextResponse.json({ error: "Invalid answer" }, { status: 400 })
      }
      answersById.set(entry.id, entry.answer)
    }

    const sameQuestions =
      answersById.size === questionIds.length && questionIds.every((id) => answersById.has(id))
    if (!sameQuestions) {
      return NextResponse.json({ error: "Answers do not match this quiz session" }, { status: 400 })
    }

    const questions = await getQuestionsByIds(questionIds)
    if (questions.length !== questionIds.length) {
      return NextResponse.json({ error: "One or more questions are no longer available" }, { status: 409 })
    }

    const answers = questionIds.map((id) => answersById.get(id) ?? null)
    const score = questions.reduce((total, question, index) => {
      const answer = answers[index]
      if (answer === null || answer === "") {
        return total
      }

      const correct =
        question.type === "fill-blank"
          ? answer.toString().toLowerCase().trim() === question.correctAnswer.toString().toLowerCase().trim()
          : answer === question.correctAnswer
      return total + (correct ? 1 : 0)
    }, 0)
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

    return NextResponse.json({
      score,
      percentage,
      passed: percentage >= PASS_MARK,
    })
  } catch (error) {
    console.error("Quiz submit error:", error)
    return NextResponse.json({ error: "Failed to score quiz" }, { status: 500 })
  }
}

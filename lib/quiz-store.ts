import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface QuizQuestion {
  id: number
  type: "text" | "image-select" | "image-identify" | "fill-blank" | "audio" | "video"
  question: string
  options?: string[]
  images?: string[]
  correctAnswer?: string | number
  media?: string
}

interface QuizState {
  // Quiz data
  selectedQuestions: QuizQuestion[]
  attemptToken: string | null
  currentQuestionIndex: number
  answers: (string | number)[]
  isQuizStarted: boolean
  isQuizCompleted: boolean
  score: number | null
  percentage: number | null
  passed: boolean | null

  // UI state
  isSubmitting: boolean
  isLoading: boolean
  error: string | null

  // Actions
  initializeQuiz: () => Promise<void>
  setAnswer: (index: number, answer: string | number) => void
  nextQuestion: () => void
  completeQuiz: () => Promise<boolean>
  resetQuiz: () => void

  // Getters
  getCurrentQuestion: () => QuizQuestion | null
  getProgress: () => number
  getScore: () => { score: number; percentage: number; passed: boolean }
  getResults: () => {
    questions: QuizQuestion[]
    answers: (string | number)[]
    score: number
    percentage: number
    passed: boolean
  } | null
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedQuestions: [],
      attemptToken: null,
      currentQuestionIndex: 0,
      answers: [],
      isQuizStarted: false,
      isQuizCompleted: false,
      score: null,
      percentage: null,
      passed: null,
      isSubmitting: false,
      isLoading: false,
      error: null,

      // Actions
      initializeQuiz: async () => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/questions?random=true&count=5")

          if (!response.ok) {
            // Attempt to parse JSON error message from API
            let errorMessage = "Failed to fetch questions"
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
            } catch (jsonError) {
              // If response is not JSON, use status text or a generic message
              errorMessage = `Failed to fetch questions: ${response.statusText || "Unknown error"}`
            }
            throw new Error(errorMessage)
          }

          const data = await response.json()

          set({
            selectedQuestions: data.questions,
            attemptToken: data.attemptToken,
            currentQuestionIndex: 0,
            answers: [],
            isQuizStarted: true,
            isQuizCompleted: false,
            score: null,
            percentage: null,
            passed: null,
            isSubmitting: false,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.error("Error initializing quiz:", error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to load quiz questions",
          })
        }
      },

      setAnswer: (index, answer) => {
        try {
          const { answers } = get()
          const newAnswers = [...answers]
          newAnswers[index] = answer
          set({ answers: newAnswers })
        } catch (error) {
          console.error("Error setting answer:", error)
        }
      },

      nextQuestion: () => {
        try {
          const { currentQuestionIndex, selectedQuestions } = get()
          if (currentQuestionIndex < selectedQuestions.length - 1) {
            set({ currentQuestionIndex: currentQuestionIndex + 1 })
          }
        } catch (error) {
          console.error("Error moving to next question:", error)
        }
      },

      completeQuiz: async () => {
        const { selectedQuestions, answers, attemptToken } = get()
        set({ isSubmitting: true, error: null })

        try {
          const response = await fetch("/api/quiz/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              attemptToken,
              answers: selectedQuestions.map((question, index) => ({
                id: question.id,
                answer: answers[index] ?? null,
              })),
            }),
          })

          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error || "Failed to score quiz")
          }

          set({
            isQuizCompleted: true,
            score: data.score,
            percentage: data.percentage,
            passed: data.passed,
            isSubmitting: false,
            error: null,
          })
          return true
        } catch (error) {
          console.error("Error completing quiz:", error)
          set({
            isSubmitting: false,
            error: error instanceof Error ? error.message : "Failed to score quiz",
          })
          return false
        }
      },

      resetQuiz: () => {
        try {
          set({
            selectedQuestions: [],
            attemptToken: null,
            currentQuestionIndex: 0,
            answers: [],
            isQuizStarted: false,
            isQuizCompleted: false,
            score: null,
            percentage: null,
            passed: null,
            isSubmitting: false,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.error("Error resetting quiz:", error)
        }
      },

      // Getters
      getCurrentQuestion: () => {
        try {
          const { selectedQuestions, currentQuestionIndex } = get()
          return selectedQuestions[currentQuestionIndex] || null
        } catch (error) {
          console.error("Error getting current question:", error)
          return null
        }
      },

      getProgress: () => {
        try {
          const { currentQuestionIndex, selectedQuestions } = get()
          if (selectedQuestions.length === 0) return 0
          return ((currentQuestionIndex + 1) / selectedQuestions.length) * 100
        } catch (error) {
          console.error("Error calculating progress:", error)
          return 0
        }
      },

      getScore: () => {
        const { score, percentage, passed } = get()
        return {
          score: score ?? 0,
          percentage: percentage ?? 0,
          passed: passed ?? false,
        }
      },

      getResults: () => {
        try {
          const { selectedQuestions, answers, isQuizCompleted, score, percentage, passed } = get()
          if (!isQuizCompleted || score === null || percentage === null || passed === null) return null

          return { questions: selectedQuestions, answers, score, percentage, passed }
        } catch (error) {
          console.error("Error getting results:", error)
          return null
        }
      },
    }),
    {
      name: "quiz-storage",
      partialize: (state) => ({
        selectedQuestions: state.isQuizCompleted
          ? state.selectedQuestions
          : state.selectedQuestions.map(({ correctAnswer: _correctAnswer, ...question }) => question),
        attemptToken: state.attemptToken,
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        isQuizStarted: state.isQuizStarted,
        isQuizCompleted: state.isQuizCompleted,
        score: state.score,
        percentage: state.percentage,
        passed: state.passed,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("Quiz state rehydrated successfully")
        }
      },
    },
  ),
)

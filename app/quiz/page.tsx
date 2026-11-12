"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, Volume2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useQuizStore } from "@/lib/quiz-store"

export default function QuizPage() {
  const router = useRouter()
  const [selectedAnswer, setSelectedAnswer] = useState<string | number>("")
  const [fillAnswer, setFillAnswer] = useState("")

  const {
    selectedQuestions,
    currentQuestionIndex,
    answers,
    isQuizStarted,
    isQuizCompleted,
    isSubmitting,
    isLoading,
    error,
    initializeQuiz,
    setAnswer,
    nextQuestion,
    completeQuiz,
    getCurrentQuestion,
    getProgress,
  } = useQuizStore()

  const currentQuestion = getCurrentQuestion()
  const progress = getProgress()

  useEffect(() => {
    if (isQuizCompleted) {
      router.push("/results")
      return
    }

    if (!isQuizStarted || selectedQuestions.length === 0) {
      initializeQuiz()
    }
  }, [isQuizStarted, selectedQuestions.length, isQuizCompleted, initializeQuiz, router])

  useEffect(() => {
    // Reset form when question changes
    setSelectedAnswer("")
    setFillAnswer("")
  }, [currentQuestionIndex])

  const handleNext = async () => {
    if (!currentQuestion) return

    let answerToSave = selectedAnswer
    if (currentQuestion.type === "fill-blank") {
      answerToSave = fillAnswer.toLowerCase().trim()
    }

    setAnswer(currentQuestionIndex, answerToSave)

    if (currentQuestionIndex < selectedQuestions.length - 1) {
      nextQuestion()
      return
    }

    const scored = await completeQuiz()
    if (scored) {
      router.push("/results")
    }
  }

  const canProceed = () => {
    if (!currentQuestion) return false
    if (currentQuestion.type === "fill-blank") {
      return fillAnswer.trim().length > 0
    }
    return selectedAnswer !== ""
  }

  if (error && selectedQuestions.length === 0) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => initializeQuiz()} className="flex-1 btn-turquoise">
                Try Again
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="flex-1 border-turquoise/30 text-turquoise hover:bg-turquoise/10"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading quiz questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-dark p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              Question {currentQuestionIndex + 1} of {selectedQuestions.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-coal-lighter" />
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.type === "text" && (
              <RadioGroup
                value={selectedAnswer.toString()}
                onValueChange={(value) => setSelectedAnswer(Number.parseInt(value))}
                className="space-y-3"
              >
                {currentQuestion.options?.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-coal-lighter/50 border border-border/30 hover:border-turquoise/30 transition-colors"
                  >
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                      className="border-turquoise/50 text-turquoise"
                    />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer text-foreground flex-1">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === "image-select" && (
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.images?.map((image, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer border-2 rounded-lg p-2 transition-colors ${
                      selectedAnswer === index
                        ? "border-turquoise bg-turquoise/10"
                        : "border-border/30 bg-coal-lighter/30 hover:border-turquoise/30"
                    }`}
                    onClick={() => setSelectedAnswer(index)}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`Option ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-20 object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            )}

            {currentQuestion.type === "image-identify" && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="border border-border/30 rounded-lg p-2 bg-coal-lighter/30">
                    <Image
                      src={currentQuestion.media! || "/placeholder.svg"}
                      alt="Question image"
                      width={300}
                      height={200}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <RadioGroup
                  value={selectedAnswer.toString()}
                  onValueChange={(value) => setSelectedAnswer(Number.parseInt(value))}
                  className="space-y-3"
                >
                  {currentQuestion.options?.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-coal-lighter/50 border border-border/30 hover:border-turquoise/30 transition-colors"
                    >
                      <RadioGroupItem
                        value={index.toString()}
                        id={`option-${index}`}
                        className="border-turquoise/50 text-turquoise"
                      />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer text-foreground flex-1">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {currentQuestion.type === "fill-blank" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg p-4 bg-coal-lighter/50 rounded-lg border border-border/30">
                  <span className="text-foreground">{currentQuestion.question}</span>
                  <Input
                    value={fillAnswer}
                    onChange={(e) => setFillAnswer(e.target.value)}
                    placeholder="..."
                    className="w-32 bg-coal border-turquoise/30 text-turquoise placeholder:text-muted-foreground focus:border-turquoise"
                  />
                </div>
              </div>
            )}

            {currentQuestion.type === "audio" && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-coal-lighter/50 border border-border/30 rounded-lg p-6 w-full max-w-md">
                    {currentQuestion.media ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center mb-4">
                          <Volume2 className="w-8 h-8 text-turquoise mr-3" />
                          <span className="text-foreground font-medium">Listen to the audio</span>
                        </div>
                        <audio
                          controls
                          className="w-full"
                          style={{
                            backgroundColor: "hsl(220, 13%, 15%)",
                            borderRadius: "8px",
                            outline: "none",
                          }}
                          preload="metadata"
                        >
                          <source src={currentQuestion.media} type="audio/mpeg" />
                          <source src={currentQuestion.media} type="audio/wav" />
                          <source src={currentQuestion.media} type="audio/ogg" />
                          <source src={currentQuestion.media} type="audio/mp3" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-8">
                        <Volume2 className="w-12 h-12 text-turquoise mr-2" />
                        <span className="text-muted-foreground">No audio file available</span>
                      </div>
                    )}
                  </div>
                </div>
                <RadioGroup
                  value={selectedAnswer.toString()}
                  onValueChange={(value) => setSelectedAnswer(Number.parseInt(value))}
                  className="space-y-3"
                >
                  {currentQuestion.options?.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-coal-lighter/50 border border-border/30 hover:border-turquoise/30 transition-colors"
                    >
                      <RadioGroupItem
                        value={index.toString()}
                        id={`option-${index}`}
                        className="border-turquoise/50 text-turquoise"
                      />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer text-foreground flex-1">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {currentQuestion.type === "video" && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-coal-lighter/50 border border-border/30 rounded-lg overflow-hidden">
                    {currentQuestion.media ? (
                      <video controls className="w-80 h-48 object-cover" preload="metadata">
                        <source src={currentQuestion.media} type="video/mp4" />
                        <source src={currentQuestion.media} type="video/webm" />
                        <source src={currentQuestion.media} type="video/ogg" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="w-80 h-48 flex items-center justify-center">
                        <span className="text-muted-foreground">No video available</span>
                      </div>
                    )}
                  </div>
                </div>
                <RadioGroup
                  value={selectedAnswer.toString()}
                  onValueChange={(value) => setSelectedAnswer(Number.parseInt(value))}
                  className="space-y-3"
                >
                  {currentQuestion.options?.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-coal-lighter/50 border border-border/30 hover:border-turquoise/30 transition-colors"
                    >
                      <RadioGroupItem
                        value={index.toString()}
                        id={`option-${index}`}
                        className="border-turquoise/50 text-turquoise"
                      />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer text-foreground flex-1">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="btn-turquoise font-semibold"
              >
                {currentQuestionIndex < selectedQuestions.length - 1 ? (
                  <>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : isSubmitting ? (
                  "Scoring..."
                ) : (
                  "Finish Quiz"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  RotateCcw,
  Home,
  Trophy,
  Target,
  Share2,
  Download,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react" // Removed Facebook icon
import Image from "next/image"
import { useQuizStore } from "@/lib/quiz-store"

export default function ResultsPage() {
  const router = useRouter()
  const { getResults, resetQuiz, isQuizCompleted } = useQuizStore()

  const results = getResults()

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [snsHandle, setSnsHandle] = useState("")
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null)
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false)
  const [certificateError, setCertificateError] = useState<string | null>(null)

  const handleRestartQuiz = () => {
    resetQuiz()
    router.push("/quiz")
  }

  const getAnswerDisplay = (question: any, userAnswer: string | number) => {
    if (userAnswer === null || userAnswer === undefined || userAnswer === "") {
      return "No answer"
    }
    if (question.type === "fill-blank") {
      return userAnswer.toString()
    } else if (question.options) {
      return question.options[userAnswer as number] || "No answer"
    }
    return "No answer"
  }

  const handleGenerateCertificate = async () => {
    if (!results || !username.trim()) {
      setCertificateError("Please enter a username.")
      return
    }

    setIsGeneratingCertificate(true)
    setCertificateError(null)
    setCertificateUrl(null)

    try {
      const response = await fetch("/api/generate-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          snsHandle: snsHandle.trim(),
          score: results.score,
          percentage: results.percentage,
          totalQuestions: results.questions.length,
        }),
      })

      // Read body ONCE as text
      const rawBody = await response.text()

      if (!response.ok) {
        // Try to parse error JSON; fall back to plain text
        let message = "Failed to generate certificate"
        try {
          const errJson = JSON.parse(rawBody)
          if (errJson?.error) message = errJson.error
        } catch {
          if (rawBody) message = rawBody.slice(0, 160)
        }
        throw new Error(message)
      }

      // Successful: parse JSON and set certificate URL
      const data = JSON.parse(rawBody)
      setCertificateUrl(data.certificateUrl)
    } catch (err) {
      console.error("Error generating certificate:", err)
      setCertificateError(err instanceof Error ? err.message : "Failed to generate certificate.")
    } finally {
      setIsGeneratingCertificate(false)
    }
  }

  const handleDownloadCertificate = () => {
    if (certificateUrl) {
      const link = document.createElement("a")
      link.href = certificateUrl
      link.download = `quiz-certificate-${username.replace(/\s/g, "-")}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleShareOnX = () => {
    if (certificateUrl) {
      const text = `I scored ${results?.percentage}% on the Quiz Challenge! Check out my certificate! ${snsHandle ? `My handle: @${snsHandle}` : ""}`
      // For actual image sharing, a dedicated image hosting service or direct file upload via X API would be needed.
      // For now, we'll just share the text and encourage manual image upload.
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank")
    }
  }

  // Removed handleShareOnFacebook function

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-dark p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Score Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-turquoise/10 rounded-full flex items-center justify-center border border-turquoise/20">
              {results.passed ? (
                <Trophy className="w-10 h-10 text-turquoise" />
              ) : (
                <Target className="w-10 h-10 text-turquoise" />
              )}
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">Quiz Results</CardTitle>
            <div className="space-y-2">
              <div className={`text-6xl font-bold ${results.passed ? "text-turquoise" : "text-destructive"}`}>
                {results.percentage}%
              </div>
              <div className="text-lg text-muted-foreground">
                {results.score} out of {results.questions.length} correct
              </div>
              <Badge
                variant={results.passed ? "default" : "destructive"}
                className={`text-lg px-4 py-1 font-semibold ${results.passed ? "badge-turquoise" : "bg-destructive text-destructive-foreground"}`}
              >
                {results.passed ? "PASSED" : "FAILED"}
              </Badge>
              <p className="text-sm text-muted-foreground">Pass mark: 65%</p>
            </div>
          </CardHeader>
        </Card>

        {/* Question Review */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Question Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.questions.map((question, index) => {
              const userAnswer = results.answers[index]

              return (
                <div key={question.id} className="border border-border/30 rounded-lg p-4 space-y-3 bg-coal-lighter/30">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 text-foreground">
                        Question {index + 1}: {question.question}
                      </h3>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Your answer:</span>
                          <span
                            className="px-3 py-1 rounded-md text-sm font-medium bg-coal border border-border/50"
                          >
                            {getAnswerDisplay(question, userAnswer)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={handleRestartQuiz}
            variant="outline"
            className="border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:text-turquoise bg-transparent"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Take Quiz Again
          </Button>
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-turquoise font-semibold">
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-card border-border/50 backdrop-blur-sm">
              {" "}
              {/* Increased max-w */}
              <DialogHeader>
                <DialogTitle className="text-foreground">Share Your Achievement!</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Enter your details to generate a personalized certificate.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">
                    Your Name / Username *
                  </Label>
                  <Input
                    id="username"
                    placeholder="e.g., QuizMaster2024"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="snsHandle" className="text-foreground">
                    Your SNS Handle (Optional)
                  </Label>
                  <Input
                    id="snsHandle"
                    placeholder="e.g., @YourTwitterHandle"
                    value={snsHandle}
                    onChange={(e) => setSnsHandle(e.target.value)}
                    className="bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
                  />
                </div>

                <Button
                  onClick={handleGenerateCertificate}
                  disabled={isGeneratingCertificate || !username.trim()}
                  className="w-full btn-turquoise font-semibold"
                >
                  {isGeneratingCertificate ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Certificate"
                  )}
                </Button>

                {certificateError && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{certificateError}</AlertDescription>
                  </Alert>
                )}

                {certificateUrl && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold text-foreground">Your Certificate:</h3>
                    <div className="border border-border/50 rounded-lg overflow-hidden">
                      <Image
                        src={certificateUrl || "/placeholder.svg"}
                        alt="Quiz Certificate"
                        width={800}
                        height={600}
                        layout="responsive"
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleDownloadCertificate} className="flex-1 btn-turquoise font-semibold">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={handleShareOnX}
                        variant="outline"
                        className="flex-1 border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:text-turquoise bg-transparent"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Share on X
                      </Button>
                      {/* Removed Facebook Share Button */}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Link href="/">
            <Button className="btn-turquoise font-semibold">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Save, AlertCircle, CheckCircle, X, List, LogOut } from "lucide-react"
import Link from "next/link"
import { AdminGuard } from "@/components/admin-guard"
import { useAdminAuth } from "@/lib/admin-auth"
import { useRouter } from "next/navigation"

type QuestionType = "text" | "image-select" | "image-identify" | "fill-blank" | "audio" | "video"

interface QuestionFormData {
  type: QuestionType
  question: string
  options: string[]
  images: string[]
  correctAnswerIndex: number
  correctAnswerText: string
  mediaUrl: string
}

const questionTypes = [
  { value: "text", label: "Multiple Choice Text", description: "Text question with 4 answer options" },
  { value: "image-select", label: "Image Selection", description: "Select the correct image from 4 options" },
  { value: "image-identify", label: "Image Identification", description: "Identify what's shown in an image" },
  { value: "fill-blank", label: "Fill in the Blank", description: "Complete a sentence or phrase" },
  { value: "audio", label: "Audio Question", description: "Listen and identify the sound" },
  { value: "video", label: "Video Question", description: "Watch and identify what's shown" },
]

function ManageQuestionsContent() {
  const { admin, logout } = useAdminAuth()
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<QuestionType | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const [formData, setFormData] = useState<QuestionFormData>({
    type: "text",
    question: "",
    options: ["", "", "", ""],
    images: ["", "", "", ""],
    correctAnswerIndex: 0,
    correctAnswerText: "",
    mediaUrl: "",
  })

  const handleTypeChange = (type: QuestionType) => {
    setSelectedType(type)
    setFormData({
      type,
      question: "",
      options: ["", "", "", ""],
      images: ["", "", "", ""],
      correctAnswerIndex: 0,
      correctAnswerText: "",
      mediaUrl: "",
    })
    setSubmitStatus(null)
  }

  const handleQuestionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, question: value }))
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData((prev) => ({ ...prev, options: newOptions }))
  }

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = value
    setFormData((prev) => ({ ...prev, images: newImages }))
  }

  const handleCorrectAnswerChange = (value: string | number) => {
    if (formData.type === "fill-blank") {
      setFormData((prev) => ({ ...prev, correctAnswerText: value as string }))
    } else {
      setFormData((prev) => ({ ...prev, correctAnswerIndex: value as number }))
    }
  }

  const handleMediaUrlChange = (value: string) => {
    setFormData((prev) => ({ ...prev, mediaUrl: value }))
  }

  const validateForm = (): string | null => {
    if (!formData.question.trim()) {
      return "Question text is required"
    }

    switch (formData.type) {
      case "text":
      case "image-identify":
      case "audio":
      case "video":
        if (formData.options.some((option) => !option.trim())) {
          return "All 4 answer options are required"
        }
        break

      case "image-select":
        if (formData.images.some((image) => !image.trim())) {
          return "All 4 image URLs are required"
        }
        break

      case "fill-blank":
        if (!formData.correctAnswerText.trim()) {
          return "Correct answer text is required"
        }
        break
    }

    if (
      (formData.type === "image-identify" || formData.type === "audio" || formData.type === "video") &&
      !formData.mediaUrl.trim()
    ) {
      return "Media URL is required for this question type"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setErrorMessage(validationError)
      setSubmitStatus("error")
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const payload = {
        type: formData.type,
        question: formData.question.trim(),
        options: formData.type === "image-select" ? null : formData.options.filter((opt) => opt.trim()),
        images: formData.type === "image-select" ? formData.images.filter((img) => img.trim()) : null,
        correct_answer_index: formData.type === "fill-blank" ? null : formData.correctAnswerIndex,
        correct_answer_text: formData.type === "fill-blank" ? formData.correctAnswerText.trim() : null,
        media_url: formData.mediaUrl.trim() || null,
      }

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save question")
      }

      setSubmitStatus("success")

      // Reset form after successful submission
      setTimeout(() => {
        setSelectedType("")
        setFormData({
          type: "text",
          question: "",
          options: ["", "", "", ""],
          images: ["", "", "", ""],
          correctAnswerIndex: 0,
          correctAnswerText: "",
          mediaUrl: "",
        })
        setSubmitStatus(null)
      }, 2000)
    } catch (error) {
      console.error("Error saving question:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to save question")
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/admin")
  }

  const renderQuestionForm = () => {
    if (!selectedType) return null

    const selectedTypeInfo = questionTypes.find((t) => t.value === selectedType)

    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Badge variant="secondary" className="badge-turquoise font-semibold">
                  {selectedTypeInfo?.label}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{selectedTypeInfo?.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedType("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Text */}
            <div className="space-y-2">
              <Label htmlFor="question" className="text-foreground">
                Question Text *
              </Label>
              <Textarea
                id="question"
                placeholder="Enter your question here..."
                value={formData.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                rows={3}
                className="bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
              />
            </div>

            {/* Media URL for image-identify, audio, video */}
            {(selectedType === "image-identify" || selectedType === "audio" || selectedType === "video") && (
              <div className="space-y-2">
                <Label htmlFor="mediaUrl" className="text-foreground">
                  {selectedType === "image-identify"
                    ? "Image URL"
                    : selectedType === "audio"
                      ? "Audio File URL"
                      : "Video File URL"}{" "}
                  *
                </Label>
                <Input
                  id="mediaUrl"
                  placeholder={`Enter ${selectedType === "image-identify" ? "image" : selectedType} URL...`}
                  value={formData.mediaUrl}
                  onChange={(e) => handleMediaUrlChange(e.target.value)}
                  className="bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
                />
              </div>
            )}

            {/* Answer Options for text, image-identify, audio, video */}
            {(selectedType === "text" ||
              selectedType === "image-identify" ||
              selectedType === "audio" ||
              selectedType === "video") && (
              <div className="space-y-4">
                <Label className="text-foreground">Answer Options *</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Badge
                      variant={formData.correctAnswerIndex === index ? "default" : "outline"}
                      className={
                        formData.correctAnswerIndex === index
                          ? "badge-turquoise font-semibold"
                          : "border-border/50 text-muted-foreground"
                      }
                    >
                      {index + 1}
                    </Badge>
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
                    />
                    <Button
                      type="button"
                      variant={formData.correctAnswerIndex === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCorrectAnswerChange(index)}
                      className={
                        formData.correctAnswerIndex === index
                          ? "btn-turquoise font-semibold"
                          : "border-turquoise/30 text-turquoise hover:bg-turquoise/10"
                      }
                    >
                      {formData.correctAnswerIndex === index ? "Correct" : "Set Correct"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Image URLs for image-select */}
            {selectedType === "image-select" && (
              <div className="space-y-4">
                <Label className="text-foreground">Image URLs *</Label>
                {formData.images.map((image, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Badge
                      variant={formData.correctAnswerIndex === index ? "default" : "outline"}
                      className={
                        formData.correctAnswerIndex === index
                          ? "badge-turquoise font-semibold"
                          : "border-border/50 text-muted-foreground"
                      }
                    >
                      {index + 1}
                    </Badge>
                    <Input
                      placeholder={`Image URL ${index + 1}`}
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      className="flex-1 bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
                    />
                    <Button
                      type="button"
                      variant={formData.correctAnswerIndex === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCorrectAnswerChange(index)}
                      className={
                        formData.correctAnswerIndex === index
                          ? "btn-turquoise font-semibold"
                          : "border-turquoise/30 text-turquoise hover:bg-turquoise/10"
                      }
                    >
                      {formData.correctAnswerIndex === index ? "Correct" : "Set Correct"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Fill-in-the-blank answer */}
            {selectedType === "fill-blank" && (
              <div className="space-y-2">
                <Label htmlFor="correctAnswer" className="text-foreground">
                  Correct Answer *
                </Label>
                <Input
                  id="correctAnswer"
                  placeholder="Enter the correct answer..."
                  value={formData.correctAnswerText}
                  onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                  className="bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
                />
                <p className="text-sm text-muted-foreground">This will be matched case-insensitively with user input</p>
              </div>
            )}

            {/* Status Messages */}
            {submitStatus === "success" && (
              <Alert className="bg-turquoise/10 border-turquoise/20">
                <CheckCircle className="h-4 w-4 text-turquoise" />
                <AlertDescription className="text-turquoise font-medium">Question saved successfully!</AlertDescription>
              </Alert>
            )}

            {submitStatus === "error" && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting} className="flex-1 btn-turquoise font-semibold">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-coal mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Question
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen gradient-dark p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Questions</h1>
            <p className="text-muted-foreground">
              Add new questions to the quiz database • Logged in as: {admin?.username}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/manage-questions/view">
              <Button
                variant="outline"
                className="border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:text-turquoise bg-transparent"
              >
                <List className="w-4 h-4 mr-2" />
                View All Questions
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:text-turquoise bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Question Type Selection */}
        {!selectedType && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Plus className="w-5 h-5 text-turquoise" />
                Select Question Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questionTypes.map((type) => (
                  <Card
                    key={type.value}
                    className="cursor-pointer hover:shadow-md transition-all border-2 border-border/30 hover:border-turquoise/50 bg-coal-lighter/30 hover:bg-coal-lighter/50"
                    onClick={() => handleTypeChange(type.value as QuestionType)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 text-foreground">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question Form */}
        {renderQuestionForm()}
      </div>
    </div>
  )
}

export default function ManageQuestionsPage() {
  return (
    <AdminGuard>
      <ManageQuestionsContent />
    </AdminGuard>
  )
}

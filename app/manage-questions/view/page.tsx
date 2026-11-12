"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Edit, Save, AlertCircle, CheckCircle, Search, Trash2, AlertTriangle, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminGuard } from "@/components/admin-guard"
import { useAdminAuth } from "@/lib/admin-auth"

interface Question {
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

interface EditFormData {
  question: string
  options: string[]
  images: string[]
  correctAnswerIndex: number
  correctAnswerText: string
  mediaUrl: string
}

function ViewQuestionsContent() {
  const { admin, logout } = useAdminAuth()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  // Edit state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null)
  const [saveMessage, setSaveMessage] = useState("")

  const [editFormData, setEditFormData] = useState<EditFormData>({
    question: "",
    options: ["", "", "", ""],
    images: ["", "", "", ""],
    correctAnswerIndex: 0,
    correctAnswerText: "",
    mediaUrl: "",
  })

  const questionTypes = [
    { value: "all", label: "All Types" },
    { value: "text", label: "Multiple Choice Text" },
    { value: "image-select", label: "Image Selection" },
    { value: "image-identify", label: "Image Identification" },
    { value: "fill-blank", label: "Fill in the Blank" },
    { value: "audio", label: "Audio Question" },
    { value: "video", label: "Video Question" },
  ]

  useEffect(() => {
    fetchQuestions()
  }, [])

  useEffect(() => {
    filterQuestions()
  }, [questions, searchTerm, filterType])

  const fetchQuestions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/questions")

      if (!response.ok) {
        throw new Error("Failed to fetch questions")
      }

      const data = await response.json()
      console.log("Fetched questions data:", data.questions)
      setQuestions(data.questions)
      setError(null)
    } catch (error) {
      console.error("Error fetching questions:", error)
      setError(error instanceof Error ? error.message : "Failed to load questions")
    } finally {
      setIsLoading(false)
    }
  }

  const filterQuestions = () => {
    let filtered = questions

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((q) => q.type === filterType)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.options?.some((option) => option.toLowerCase().includes(searchTerm.toLowerCase())) ||
          q.correct_answer_text?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredQuestions(filtered)
  }

  const handleEditClick = (question: Question) => {
    setEditingQuestion(question)

    // Initialize form data
    setEditFormData({
      question: question.question,
      options: question.options || ["", "", "", ""],
      images: question.images || ["", "", "", ""],
      correctAnswerIndex: question.correct_answer_index || 0,
      correctAnswerText: question.correct_answer_text || "",
      mediaUrl: question.media_url || "",
    })

    setSaveStatus(null)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingQuestion) return

    setIsSaving(true)
    setSaveStatus(null)

    try {
      const payload = {
        question: editFormData.question.trim(),
        options: editingQuestion.type === "image-select" ? null : editFormData.options.filter((opt) => opt.trim()),
        images: editingQuestion.type === "image-select" ? editFormData.images.filter((img) => img.trim()) : null,
        correct_answer_index: editingQuestion.type === "fill-blank" ? null : editFormData.correctAnswerIndex,
        correct_answer_text: editingQuestion.type === "fill-blank" ? editFormData.correctAnswerText.trim() : null,
        media_url: editFormData.mediaUrl.trim() || null,
      }

      const response = await fetch(`/api/questions/${editingQuestion.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update question")
      }

      setSaveStatus("success")
      setSaveMessage("Question updated successfully!")

      // Refresh questions list
      await fetchQuestions()

      // Close dialog after a short delay
      setTimeout(() => {
        setIsEditDialogOpen(false)
        setEditingQuestion(null)
      }, 1500)
    } catch (error) {
      console.error("Error updating question:", error)
      setSaveStatus("error")
      setSaveMessage(error instanceof Error ? error.message : "Failed to update question")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete question")
      }

      // Refresh questions list
      await fetchQuestions()
    } catch (error) {
      console.error("Error deleting question:", error)
      alert(error instanceof Error ? error.message : "Failed to delete question")
    }
  }

  const getCorrectAnswerDisplay = (question: Question) => {
    console.log(`Question ID ${question.id}:`, {
      type: question.type,
      correct_answer_index: question.correct_answer_index,
      correct_answer_text: question.correct_answer_text,
      options: question.options,
      images: question.images,
    })

    // Handle fill-blank questions
    if (question.type === "fill-blank") {
      if (question.correct_answer_text && question.correct_answer_text.trim()) {
        return question.correct_answer_text.trim()
      }
      return "⚠️ Missing answer text"
    }

    // Handle image-select questions
    if (question.type === "image-select") {
      if (
        question.correct_answer_index !== undefined &&
        question.correct_answer_index !== null &&
        !isNaN(question.correct_answer_index)
      ) {
        return `Image ${question.correct_answer_index + 1}`
      }
      return "⚠️ Missing answer index"
    }

    // Handle questions with options (text, image-identify, audio, video)
    if (question.options && Array.isArray(question.options) && question.options.length > 0) {
      if (
        question.correct_answer_index !== undefined &&
        question.correct_answer_index !== null &&
        !isNaN(question.correct_answer_index) &&
        question.correct_answer_index >= 0 &&
        question.correct_answer_index < question.options.length
      ) {
        return question.options[question.correct_answer_index]
      }
      return "⚠️ Invalid answer index"
    }

    return "⚠️ No answer data"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "No date"

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Invalid Date"
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Date formatting error:", error)
      return "Invalid Date"
    }
  }

  // Check for potential duplicates
  const findDuplicates = () => {
    const duplicates: Question[][] = []
    const seen = new Map<string, Question[]>()

    questions.forEach((question) => {
      const key = `${question.question.toLowerCase().trim()}-${question.type}`
      if (!seen.has(key)) {
        seen.set(key, [])
      }
      seen.get(key)!.push(question)
    })

    seen.forEach((questionGroup) => {
      if (questionGroup.length > 1) {
        duplicates.push(questionGroup)
      }
    })

    return duplicates
  }

  const duplicates = findDuplicates()

  const renderEditForm = () => {
    if (!editingQuestion) return null

    return (
      <div className="space-y-6">
        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor="edit-question" className="text-foreground">
            Question Text *
          </Label>
          <Textarea
            id="edit-question"
            value={editFormData.question}
            onChange={(e) => setEditFormData((prev) => ({ ...prev, question: e.target.value }))}
            rows={3}
            className="bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
          />
        </div>

        {/* Media URL for image-identify, audio, video */}
        {(editingQuestion.type === "image-identify" ||
          editingQuestion.type === "audio" ||
          editingQuestion.type === "video") && (
          <div className="space-y-2">
            <Label htmlFor="edit-media" className="text-foreground">
              {editingQuestion.type === "image-identify"
                ? "Image URL"
                : editingQuestion.type === "audio"
                  ? "Audio File URL"
                  : "Video File URL"}{" "}
              *
            </Label>
            <Input
              id="edit-media"
              value={editFormData.mediaUrl}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, mediaUrl: e.target.value }))}
              className="bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
            />
          </div>
        )}

        {/* Answer Options */}
        {(editingQuestion.type === "text" ||
          editingQuestion.type === "image-identify" ||
          editingQuestion.type === "audio" ||
          editingQuestion.type === "video") && (
          <div className="space-y-4">
            <Label className="text-foreground">Answer Options *</Label>
            {editFormData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <Badge
                  variant={editFormData.correctAnswerIndex === index ? "default" : "outline"}
                  className={
                    editFormData.correctAnswerIndex === index
                      ? "badge-turquoise font-semibold"
                      : "border-border/50 text-muted-foreground"
                  }
                >
                  {index + 1}
                </Badge>
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...editFormData.options]
                    newOptions[index] = e.target.value
                    setEditFormData((prev) => ({ ...prev, options: newOptions }))
                  }}
                  className="flex-1 bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
                />
                <Button
                  type="button"
                  variant={editFormData.correctAnswerIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditFormData((prev) => ({ ...prev, correctAnswerIndex: index }))}
                  className={
                    editFormData.correctAnswerIndex === index
                      ? "btn-turquoise font-semibold"
                      : "border-turquoise/30 text-turquoise hover:bg-turquoise/10"
                  }
                >
                  {editFormData.correctAnswerIndex === index ? "Correct" : "Set Correct"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Image URLs */}
        {editingQuestion.type === "image-select" && (
          <div className="space-y-4">
            <Label className="text-foreground">Image URLs *</Label>
            {editFormData.images.map((image, index) => (
              <div key={index} className="flex items-center gap-3">
                <Badge
                  variant={editFormData.correctAnswerIndex === index ? "default" : "outline"}
                  className={
                    editFormData.correctAnswerIndex === index
                      ? "badge-turquoise font-semibold"
                      : "border-border/50 text-muted-foreground"
                  }
                >
                  {index + 1}
                </Badge>
                <Input
                  value={image}
                  onChange={(e) => {
                    const newImages = [...editFormData.images]
                    newImages[index] = e.target.value
                    setEditFormData((prev) => ({ ...prev, images: newImages }))
                  }}
                  className="flex-1 bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
                />
                <Button
                  type="button"
                  variant={editFormData.correctAnswerIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditFormData((prev) => ({ ...prev, correctAnswerIndex: index }))}
                  className={
                    editFormData.correctAnswerIndex === index
                      ? "btn-turquoise font-semibold"
                      : "border-turquoise/30 text-turquoise hover:bg-turquoise/10"
                  }
                >
                  {editFormData.correctAnswerIndex === index ? "Correct" : "Set Correct"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Fill-in-the-blank answer */}
        {editingQuestion.type === "fill-blank" && (
          <div className="space-y-2">
            <Label htmlFor="edit-correct-answer" className="text-foreground">
              Correct Answer *
            </Label>
            <Input
              id="edit-correct-answer"
              value={editFormData.correctAnswerText}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, correctAnswerText: e.target.value }))}
              className="bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
            />
          </div>
        )}

        {/* Status Messages */}
        {saveStatus === "success" && (
          <Alert className="bg-turquoise/10 border-turquoise/20">
            <CheckCircle className="h-4 w-4 text-turquoise" />
            <AlertDescription className="text-turquoise font-medium">{saveMessage}</AlertDescription>
          </Alert>
        )}

        {saveStatus === "error" && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveMessage}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button onClick={fetchQuestions} className="flex-1 btn-turquoise">
                Try Again
              </Button>
              <Link href="/manage-questions">
                <Button
                  variant="outline"
                  className="flex-1 border-turquoise/30 text-turquoise hover:bg-turquoise/10 bg-transparent"
                >
                  Go Back
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    router.push("/admin")
  }

  return (
    <div className="min-h-screen gradient-dark p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">View Questions</h1>
            <p className="text-muted-foreground">
              {filteredQuestions.length} of {questions.length} questions • Logged in as: {admin?.username}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/manage-questions">
              <Button
                variant="outline"
                className="border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:text-turquoise bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Manage
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

        {/* Duplicate Warning */}
        {duplicates.length > 0 && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> {duplicates.length} duplicate question group(s) found. Run the cleanup script to
              remove duplicates and prevent future ones.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-turquoise w-4 h-4" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 bg-coal border border-border/50 text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-turquoise"
                >
                  {questionTypes.map((type) => (
                    <option key={type.value} value={type.value} className="bg-coal text-foreground">
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No questions found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            filteredQuestions.map((question) => {
              // Check if this question is a duplicate
              const isDuplicate = duplicates.some(
                (group) => group.some((q) => q.id === question.id) && group.length > 1,
              )

              const correctAnswer = getCorrectAnswerDisplay(question)
              const hasIssue = correctAnswer.startsWith("⚠️")

              return (
                <Card
                  key={question.id}
                  className={`hover:shadow-md transition-shadow border-border/50 bg-card/50 backdrop-blur-sm ${
                    isDuplicate ? "border-warning/50 bg-warning/5" : ""
                  } ${hasIssue ? "border-destructive/30 bg-destructive/5" : ""}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-turquoise/20 text-turquoise border-turquoise/30 font-semibold"
                          >
                            {question.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">ID: {question.id}</span>
                          {isDuplicate && (
                            <Badge
                              variant="destructive"
                              className="text-xs bg-warning/20 text-warning border-warning/30"
                            >
                              DUPLICATE
                            </Badge>
                          )}
                          {hasIssue && (
                            <Badge
                              variant="destructive"
                              className="text-xs bg-destructive/20 text-destructive border-destructive/30"
                            >
                              DATA ISSUE
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-lg text-foreground">{question.question}</h3>

                        <div className="text-sm text-muted-foreground">
                          <strong className="text-foreground">Correct Answer:</strong>{" "}
                          <span className={hasIssue ? "text-destructive font-medium" : "text-turquoise font-medium"}>
                            {correctAnswer}
                          </span>
                        </div>

                        {question.options && question.options.length > 0 && (
                          <div className="text-sm">
                            <strong className="text-foreground">Options:</strong>
                            <ul className="list-disc list-inside ml-2 mt-1">
                              {question.options.map((option, index) => (
                                <li
                                  key={index}
                                  className={
                                    question.correct_answer_index === index
                                      ? "font-semibold text-turquoise"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {option}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {question.media_url && (
                          <div className="text-sm">
                            <strong className="text-foreground">Media URL:</strong>
                            <a
                              href={question.media_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-turquoise hover:text-turquoise/80 hover:underline ml-1"
                            >
                              {question.media_url}
                            </a>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Created: <span className="text-foreground">{formatDate(question.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(question)}
                          className="border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:text-turquoise bg-transparent"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border/50 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Edit className="w-5 h-5 text-turquoise" />
                Edit Question
                {editingQuestion && (
                  <Badge
                    variant="secondary"
                    className="bg-turquoise/20 text-turquoise border-turquoise/30 font-semibold"
                  >
                    {editingQuestion.type}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {renderEditForm()}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 btn-turquoise font-semibold">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-coal mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSaving}
                className="border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:text-turquoise bg-transparent"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function ViewQuestionsPage() {
  return (
    <AdminGuard>
      <ViewQuestionsContent />
    </AdminGuard>
  )
}

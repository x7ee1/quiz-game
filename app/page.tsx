import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Play, Settings, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="w-full max-w-md mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-turquoise/10 rounded-full flex items-center justify-center border border-turquoise/20">
              <Brain className="w-8 h-8 text-turquoise" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Quiz Challenge</CardTitle>
            <CardDescription className="text-muted-foreground">
              Test your knowledge with our interactive quiz! Answer 5 random questions from various categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2 bg-coal-lighter/50 p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-turquoise" />
                <span>5 questions selected randomly</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-turquoise" />
                <span>4 answer choices per question</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-turquoise" />
                <span>Multiple question types</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-turquoise" />
                <span>Pass mark: 65%</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-turquoise" />
                <span>No registration required</span>
              </div>
            </div>
            <Link href="/quiz" className="block">
              <Button className="w-full btn-turquoise font-semibold" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Quiz
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Management Section */}
        <Card className="w-full max-w-md mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-foreground">Quiz Management</CardTitle>
            <CardDescription className="text-muted-foreground">
              Administrator access required to manage questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin" className="block">
              <Button
                variant="outline"
                className="w-full border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:text-turquoise bg-transparent"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

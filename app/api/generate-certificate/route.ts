import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username, snsHandle, score, percentage, totalQuestions } = await request.json()

    if (!username || score === undefined || percentage === undefined || !totalQuestions) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    // ---------- Build SVG certificate ----------
    const svg = `
      <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stop-color="hsl(220,13%,11%)"/>
            <stop offset="100%" stop-color="hsl(220,13%,9%)"/>
          </linearGradient>
        </defs>

        <rect width="800" height="600" fill="url(#bg)" />

        <text x="400" y="100" text-anchor="middle"
              fill="#E0FFFF" font-family="sans-serif" font-size="48" font-weight="700">
          Certificate of Achievement
        </text>

        <text x="400" y="180" text-anchor="middle"
              fill="#B0E0E6" font-family="sans-serif" font-size="28">
          Awarded to
        </text>

        <text x="400" y="250" text-anchor="middle"
              fill="#FFFFFF" font-family="sans-serif" font-size="40" font-weight="700">
          ${escapeXml(username)}
        </text>

        <text x="400" y="320" text-anchor="middle"
              fill="#B0E0E6" font-family="sans-serif" font-size="24">
          For mastering the Quiz Challenge!
        </text>

        <text x="400" y="390" text-anchor="middle"
              fill="#E0FFFF" font-family="sans-serif" font-size="28">
          Score: ${score}/${totalQuestions} (${percentage}%)
        </text>

        ${
          snsHandle
            ? `<text x="400" y="450" text-anchor="middle"
                     fill="#B0E0E6" font-family="sans-serif" font-size="20">
                 ${escapeXml(snsHandle)}
               </text>`
            : ""
        }

        <text x="400" y="500" text-anchor="middle"
              fill="#B0E0E6" font-family="sans-serif" font-size="18">
          ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </text>
      </svg>
    `.trim()

    // Encode as data-URL
    const base64 = Buffer.from(svg).toString("base64")
    const certificateUrl = `data:image/svg+xml;base64,${base64}`

    return NextResponse.json({ certificateUrl })
  } catch (err) {
    console.error("Certificate API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Very small helper to escape &, <, > in user-supplied text.
 */
function escapeXml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

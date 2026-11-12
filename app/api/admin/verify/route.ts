import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin-token")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    const admin = await verifyToken(token)

    if (admin) {
      return NextResponse.json({ authenticated: true, admin })
    } else {
      const response = NextResponse.json({ authenticated: false }, { status: 200 })
      response.cookies.set("admin-token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
      })
      return response
    }
  } catch (error) {
    console.error("Verify API Error:", error)
    return NextResponse.json({ authenticated: false, error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { verifyAdmin, generateToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const admin = await verifyAdmin(username, password)

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await generateToken(admin)

    const response = NextResponse.json({ success: true, admin: { id: admin.id, username: admin.username } })

    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
    })

    return response
  } catch (error) {
    console.error("Login API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

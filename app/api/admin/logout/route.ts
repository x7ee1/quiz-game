import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { revokeAdminToken } from "@/lib/auth"

export async function POST() {
  try {
    const cookieStore = await cookies()
    await revokeAdminToken(cookieStore.get("admin-token")?.value)

    const response = NextResponse.json({ success: true })
    response.cookies.set("admin-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    })
    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 })
  }
}

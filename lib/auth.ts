import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required")
}

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required")
}

const sql = neon(databaseUrl)

export interface AdminUser {
  id: number
  username: string
}

interface QuizAttemptToken {
  purpose: "quiz-attempt"
}

export async function verifyAdmin(username: string, password: string): Promise<AdminUser | null> {
  try {
    if (!username || !password) {
      return null
    }

    const result = await sql`
      SELECT id, username, password_hash 
      FROM admin 
      WHERE username = ${username}
    `

    if (result.length === 0) {
      return null
    }

    const admin = result[0]
    const isValid = await bcrypt.compare(password, admin.password_hash)
    if (!isValid) {
      return null
    }

    return {
      id: admin.id,
      username: admin.username,
    }
  } catch (error) {
    console.error("Admin verification error:", error)
    return null
  }
}

export async function generateToken(admin: AdminUser): Promise<string> {
  const sessionId = crypto.randomUUID()
  await sql`
    INSERT INTO admin_sessions (session_id, admin_id, expires_at)
    VALUES (${sessionId}, ${admin.id}, NOW() + INTERVAL '1 hour')
  `

  return jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "1h",
    jwtid: sessionId,
  })
}

export async function verifyToken(token: string): Promise<AdminUser | null> {
  let decoded: jwt.JwtPayload
  try {
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload
  } catch {
    return null
  }

  if (
    typeof decoded.id !== "number" ||
    typeof decoded.username !== "string" ||
    typeof decoded.jti !== "string"
  ) {
    return null
  }

  const sessions = await sql`
    SELECT a.id, a.username
    FROM admin_sessions s
    JOIN admin a ON a.id = s.admin_id
    WHERE s.session_id = ${decoded.jti}
      AND s.admin_id = ${decoded.id}
      AND a.username = ${decoded.username}
      AND s.revoked_at IS NULL
      AND s.expires_at > NOW()
  `
  if (sessions.length === 0) {
    return null
  }

  return {
    id: sessions[0].id,
    username: sessions[0].username,
  }
}

export async function signQuizAttempt(questionIds: number[]): Promise<string> {
  const attemptId = crypto.randomUUID()
  await sql`
    INSERT INTO quiz_attempts (attempt_id, question_ids, expires_at)
    VALUES (${attemptId}, ${questionIds}, NOW() + INTERVAL '2 hours')
  `

  const payload: QuizAttemptToken = { purpose: "quiz-attempt" }
  return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256", expiresIn: "2h", jwtid: attemptId })
}

export async function verifyQuizAttempt(token: string): Promise<number[] | null> {
  let decoded: jwt.JwtPayload
  try {
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload
  } catch {
    return null
  }

  if (decoded.purpose !== "quiz-attempt" || typeof decoded.jti !== "string") {
    return null
  }

  const attempts = await sql`
    UPDATE quiz_attempts
    SET consumed_at = NOW()
    WHERE attempt_id = ${decoded.jti}
      AND consumed_at IS NULL
      AND expires_at > NOW()
    RETURNING question_ids
  `
  const questionIds = attempts[0]?.question_ids
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return null
  }

  return questionIds.map(Number)
}

export async function revokeAdminToken(token: string | undefined): Promise<void> {
  if (!token) {
    return
  }

  let decoded: jwt.JwtPayload
  try {
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload
  } catch {
    return
  }
  if (typeof decoded.jti !== "string") {
    return
  }

  await sql`
    UPDATE admin_sessions
    SET revoked_at = NOW()
    WHERE session_id = ${decoded.jti}
      AND revoked_at IS NULL
  `
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

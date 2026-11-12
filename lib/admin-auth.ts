"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AdminUser {
  id: number
  username: string
}

interface AdminAuthState {
  admin: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (username: string, password: string) => {
        console.log("Store: login function called with username:", username)
        try {
          console.log("Store: Attempting fetch to /api/admin/login")
          const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          })
          console.log("Store: Fetch response received. Status:", response.status, "response.ok:", response.ok)

          const rawResponseText = await response.clone().text()
          console.log("Store: Raw response text:", rawResponseText)

          if (response.ok) {
            let data
            try {
              data = JSON.parse(rawResponseText)
              console.log("Store: Login API response OK. Parsed Data:", data)
            } catch (jsonParseError) {
              console.error("Store: Failed to parse JSON from response:", jsonParseError)
              console.error("Store: Raw response text that failed parsing:", rawResponseText)
              return false
            }

            set({
              admin: data.admin,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          } else {
            console.error("Store: Login API response NOT OK. Status:", response.status)
            console.error("Store: Raw response text (for non-OK response):", rawResponseText)

            let errorData = { error: "Unknown error" }
            try {
              errorData = JSON.parse(rawResponseText)
            } catch (jsonError) {
              console.warn("Store: Could not parse error JSON, using generic message.")
            }
            console.error("Store: Error data (from non-OK response):", errorData)
            return false
          }
        } catch (error) {
          console.error("Store: Network or fetch error during login:", error)
          return false
        }
      },

      logout: async () => {
        try {
          await fetch("/api/admin/logout", { method: "POST" })
        } catch (error) {
          console.error("Logout error:", error)
        } finally {
          set({
            admin: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      checkAuth: async () => {
        console.log("Store: checkAuth function called.") // New log
        set({ isLoading: true }) // Ensure loading state is set
        try {
          console.log("Store: Attempting fetch to /api/admin/verify") // New log
          const response = await fetch("/api/admin/verify")
          console.log("Store: Verify API response received. Status:", response.status, "response.ok:", response.ok) // New log

          if (response.ok) {
            const data = await response.json()
            console.log("Store: Verify API response OK. Data:", data) // New log
            if (data.authenticated) {
              set({
                admin: data.admin,
                isAuthenticated: true,
                isLoading: false,
              })
              console.log("Store: checkAuth successful. Authenticated:", get().isAuthenticated) // New log
              return
            }
          }

          console.log("Store: Verify API response NOT OK or not authenticated. Setting isAuthenticated to false.") // New log
          set({
            admin: null,
            isAuthenticated: false,
            isLoading: false,
          })
        } catch (error) {
          console.error("Store: Auth check error:", error) // New log
          set({
            admin: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: "admin-auth",
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

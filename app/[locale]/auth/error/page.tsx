"use client"

import { useSearchParams } from "next/navigation"
import Button from "@/app/components/Button"

const errors: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The token has expired or has already been used.",
  Default: "Unable to sign in.",
}

const errorIcons: Record<string, string> = {
  Configuration: "⚙️",
  AccessDenied: "🚫", 
  Verification: "⏰",
  Default: "❌",
}

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error")
  const errorMessage = error && errors[error] ? errors[error] : errors.Default
  const errorIcon = error && errorIcons[error] ? errorIcons[error] : errorIcons.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">{errorIcon}</span>
          </div>
          
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Authentication Error
          </h2>
          
          <p className="text-slate-600 mb-8">
            {errorMessage}
          </p>
          
          <Button
            href="/auth/signin"
            variant="primary"
            size="lg"
            fullWidth
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Try again
          </Button>
          
          <div className="mt-6">
            <Button
              href="/"
              variant="ghost"
              size="md"
            >
              Back to home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
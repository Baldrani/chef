"use client"

import { useSearchParams } from "next/navigation"
import { Link } from "@/i18n/navigation"

const errors: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The token has expired or has already been used.",
  Default: "Unable to sign in.",
}

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error && errors[error] ? errors[error] : errors.Default}
          </p>
        </div>
        <div>
          <Link
            href="/auth/signin"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  )
}
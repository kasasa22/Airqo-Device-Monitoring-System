"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [logoutMessage, setLogoutMessage] = useState("")

  useEffect(() => {
    // Check if user was redirected from logout
    const params = new URLSearchParams(window.location.search)
    if (params.get("logout") === "true") {
      setLogoutMessage("You have been successfully logged out")
    }
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsLoading(true)

    try {
      // Add your authentication logic here
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[350px]">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-8ystA7fUvSxUyn8lJlJplrEDq9D64a.png"
            alt="AirQo Logo"
            width={120}
            height={40}
            className="mb-4"
          />
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {logoutMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">{logoutMessage}</div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
                disabled={isLoading}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}


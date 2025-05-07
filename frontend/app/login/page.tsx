"use client"

import { useState, useEffect, FormEvent } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

// API URL - adjust this to point to your FastAPI backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [logoutMessage, setLogoutMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Check if user was redirected from logout
    const params = new URLSearchParams(window.location.search)
    if (params.get("logout") === "true") {
      setLogoutMessage("You have been successfully logged out")
    }
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError("") // Clear any existing errors

    try {
      console.log("Attempting login to:", API_URL);
      
      // Create form data for FastAPI OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', email); // FastAPI expects 'username' for email
      formData.append('password', password);

      // Make API call to your FastAPI authentication endpoint
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type for FormData
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Login successful!");
        
        // Save token and user data to localStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Authentication successful
        router.push("/dashboard");
      } else {
        // Try to get error message from response
        try {
          const errorText = await response.text();
          let errorMessage = "Invalid email or password. Please try again.";
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorMessage;
          } catch (e) {
            // If the response isn't valid JSON, use the text directly
            if (errorText) errorMessage = errorText;
          }
          
          setError(errorMessage);
        } catch (e) {
          setError("Invalid email or password. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Connection error. Please make sure the server is running.");
    } finally {
      setIsLoading(false);
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
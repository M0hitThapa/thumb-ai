"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithGoogle } from "@/lib/auth-client"
import { toast } from "sonner"
import { signUp } from "@/lib/auth-client"
import { GoogleLogo } from "../icons/logos"

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const handleGoogleSignup = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      toast.error("google sign-up failed")
    }
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const res = await signUp.email({
      name: "",
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    })
    console.log(res)

    if (res.error) {
      setError(res.error.message || "something went wrong")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-3xl shadow-[0px_0px_2px_9px_#d9d9d9] dark:shadow-[0px_0px_2px_9px_#3b3b3b]",
        className
      )}
      {...props}
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Signup with your Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <Button
                  onClick={handleGoogleSignup}
                  variant="outline"
                  type="button"
                >
                  <GoogleLogo />
                  Continue with Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit">SignUp</Button>
                <FieldDescription className="text-center">
                  Already have an account? <a href="#">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

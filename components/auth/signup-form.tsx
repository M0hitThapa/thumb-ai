'use client'
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
      name:"",
      email: formData.get("email") as string,
      password: formData.get("password") as string
    })
    console.log(res)

    if (res.error) {
      setError(res.error.message || "something went wrong")
    } else {
      router.push("/dashboard")
    }
    

    
   
  }


  return (
    <div className={cn("flex flex-col gap-6 shadow-[0px_0px_2px_9px_#d9d9d9] dark:shadow-[0px_0px_2px_9px_#3b3b3b] rounded-3xl ", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Signup with your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
              
                <Button onClick={handleGoogleSignup} variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
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
  <Input
    id="password"
    name="password"
    type="password"
    required
  />
</Field>
              <Field>
                {error && (
  <p className="text-red-500 text-sm">{error}</p>
)}
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

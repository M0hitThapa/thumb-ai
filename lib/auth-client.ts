import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: "http://localhost:3000"
})

export const {
    signIn,      // Email sign-in
    signUp,      // Email sign-up
    signOut,
    useSession
} = authClient

// Google sign-in helper
export async function signInWithGoogle() {
    return signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
    })
}
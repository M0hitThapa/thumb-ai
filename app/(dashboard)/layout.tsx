import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/login")

  return (
    <div className="min-h-screen">
      <main>{children}</main>
    </div>
  )
}

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect("/login")
  }
  const [creditBalance, subscription] = await Promise.all([
    prisma.creditBalance.findUnique({
      where: { userId: session.user.id },
      select: { credits: true, freeGenerationUsed: true },
    }),
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true },
    }),
  ])
}

import { ModeToggle } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <div>
      Hello,this is the link to login and signup
      <br />
      <div className="flex items-center justify-center gap-1">
          <Button>
        <Link href="/login">Login</Link>
      </Button>
      <Button>
        <Link href="/signup">Signup</Link>
      </Button>
      <ModeToggle />
    </div>
    </div>
  )
}
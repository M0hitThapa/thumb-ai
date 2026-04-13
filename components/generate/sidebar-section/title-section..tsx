import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { IconAsterisk } from "@tabler/icons-react"

export const TitleSection = () => {
  return (
    <div className="space-y-2">
      <Label
        htmlFor="title"
        className="text-xs font-semibold tracking-tight text-neutral-600 dark:text-neutral-400"
      >
        Title{" "}
        <span className="text-red-500">
          <IconAsterisk />
        </span>
      </Label>
      <Textarea id="title" />
    </div>
  )
}

import type { Metadata } from "next"
import { CreateWizard } from "./wizard-client"

export const metadata: Metadata = { title: "Create Resume — GlobalResumeAI" }

export default function CreatePage() {
  return <CreateWizard />
}

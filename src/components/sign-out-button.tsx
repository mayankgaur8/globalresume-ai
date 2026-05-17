"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="mr-3 h-4 w-4" /> Sign Out
    </Button>
  )
}

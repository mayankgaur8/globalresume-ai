import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Shield } from "lucide-react"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Preferences</h1>
        <p className="text-slate-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={session.user.image || ""} />
                <AvatarFallback className="text-xl">{session.user.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-slate-900">{session.user.name}</p>
                <p className="text-sm text-slate-500">{session.user.email}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input defaultValue={session.user.name || ""} disabled placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input defaultValue={session.user.email || ""} disabled type="email" />
            </div>
            <p className="text-xs text-slate-400">Profile editing coming soon. Contact support to update your details.</p>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Account Role</Label>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  session.user.role === "ADMIN"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {session.user.role}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-slate-600 mb-3">Password management</p>
              <Button variant="outline" disabled className="text-slate-600">
                Change Password (coming soon)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Email notification preferences coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

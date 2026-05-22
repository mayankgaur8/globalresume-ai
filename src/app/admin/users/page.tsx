import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { ManualUnlockButton } from "./manual-unlock-button"

type AdminUser = {
  id: string
  name: string | null
  email: string | null
  role: "USER" | "ADMIN"
  subscription: { plan: { name: string } | null } | null
  resumes: { id: string }[]
}

export default async function AdminUsersPage() {
  const users: AdminUser[] = await prisma.user.findMany({
    include: {
      subscription: { include: { plan: true } },
      resumes: { select: { id: true } },
    },
    orderBy: { id: "desc" },
    take: 100,
  })

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Users</h1>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            {users.length} Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase text-slate-500">
                  <th className="text-left py-3 pr-4">Name / Email</th>
                  <th className="text-left py-3 pr-4">Role</th>
                  <th className="text-left py-3 pr-4">Plan</th>
                  <th className="text-left py-3 pr-4">Resumes</th>
                  <th className="text-left py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{user.name || "—"}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          user.role === "ADMIN"
                            ? "bg-red-900/50 text-red-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded">
                        {user.subscription?.plan?.name || "FREE"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center">{user.resumes.length}</td>
                    <td className="py-3">
                      <ManualUnlockButton userId={user.id} userEmail={user.email || ""} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

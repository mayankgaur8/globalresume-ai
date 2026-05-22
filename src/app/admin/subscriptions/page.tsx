import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard } from "lucide-react"

type AdminSubscription = {
  id: string
  status: string | null
  stripeSubId: string | null
  user: { name: string | null; email: string | null } | null
  plan: { name: string } | null
}

export default async function AdminSubscriptionsPage() {
  const subscriptions: AdminSubscription[] = await prisma.subscription.findMany({
    include: {
      user: { select: { name: true, email: true } },
      plan: true,
    },
    orderBy: { id: "desc" },
  })

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Subscriptions</h1>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-400" />
            {subscriptions.length} Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase text-slate-500">
                  <th className="text-left py-3 pr-4">User</th>
                  <th className="text-left py-3 pr-4">Plan</th>
                  <th className="text-left py-3 pr-4">Status</th>
                  <th className="text-left py-3">Stripe Sub ID</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{sub.user?.name || "—"}</p>
                      <p className="text-xs text-slate-500">{sub.user?.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded">
                        {sub.plan?.name || "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          sub.status === "active"
                            ? "bg-green-900/40 text-green-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {sub.status || "unknown"}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-500 font-mono">
                      {sub.stripeSubId || "—"}
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

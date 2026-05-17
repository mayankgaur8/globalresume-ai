import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Lock, Unlock } from "lucide-react"

export default async function AdminTemplatesPage() {
  const templates = await prisma.template.findMany({
    include: { _count: { select: { purchases: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Templates</h1>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-400" />
            {templates.length} Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase text-slate-500">
                  <th className="text-left py-3 pr-4">Name</th>
                  <th className="text-left py-3 pr-4">Type</th>
                  <th className="text-left py-3 pr-4">Purchases</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 pr-4 font-medium text-white">{template.name}</td>
                    <td className="py-3 pr-4">
                      {template.isPremium ? (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <Lock className="h-3 w-3" /> Premium
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <Unlock className="h-3 w-3" /> Free
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{template._count.purchases}</td>
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

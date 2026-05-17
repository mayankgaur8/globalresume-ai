import { Skeleton } from "@/components/ui/skeleton"

export default function TemplatesLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 overflow-hidden">
            <Skeleton className="h-44 w-full rounded-none" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-8 w-full rounded-lg mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton"

export default function BuilderLoading() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-200 bg-white p-4 space-y-3 shrink-0">
        <Skeleton className="h-6 w-32 mb-4" />
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
      {/* Editor */}
      <div className="flex-1 p-6 space-y-4 overflow-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      {/* Preview */}
      <div className="hidden xl:block w-[420px] border-l border-slate-200 bg-slate-50 p-4">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    </div>
  )
}

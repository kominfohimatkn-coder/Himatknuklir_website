function Skeleton({
  className = '',
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-sm bg-slate-200/80 ${className}`}
    />
  )
}

export function PublicPageSkeleton() {
  return (
    <main
      className="min-h-[70vh] pt-28 pb-24"
      aria-busy="true"
      aria-label="Memuat halaman"
    >
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-b border-slate-100 pb-10">
          <Skeleton className="mb-4 h-3 w-32" />
          <Skeleton className="h-10 w-full max-w-xl sm:h-12" />
          <Skeleton className="mt-5 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(item => (
            <div
              key={item}
              className="rounded border border-slate-100 bg-white p-4"
            >
              <Skeleton className="aspect-[16/9] w-full" />
              <Skeleton className="mt-5 h-3 w-24" />
              <Skeleton className="mt-4 h-6 w-4/5" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export function StructurePageSkeleton() {
  return (
    <main
      className="min-h-[70vh] overflow-x-hidden pt-32 pb-24"
      aria-busy="true"
      aria-label="Memuat struktur kepengurusan"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl border-b border-slate-100 pb-8 text-center">
          <Skeleton className="mx-auto h-7 w-40" />
          <Skeleton className="mx-auto mt-5 h-11 w-full max-w-xl sm:h-14" />
          <Skeleton className="mx-auto mt-5 h-4 w-full max-w-lg" />
          <Skeleton className="mx-auto mt-2 h-4 w-full max-w-sm" />
        </div>

        <div className="mb-10 flex justify-center">
          <Skeleton className="h-11 w-64" />
        </div>

        <div className="mx-auto mb-12 max-w-md">
          <Skeleton className="mx-auto mb-3 h-3 w-24" />
          <Skeleton className="h-12 w-full" />
        </div>

        <Skeleton className="mx-auto mb-10 h-8 w-56" />

        <div className="flex flex-wrap justify-center gap-4">
          {[1, 2, 3].map(item => (
            <div
              key={item}
              className="w-full max-w-[280px] rounded border border-slate-100 p-5"
            >
              <Skeleton className="mx-auto h-28 w-28 rounded-full" />
              <Skeleton className="mx-auto mt-4 h-5 w-28" />
              <Skeleton className="mx-auto mt-4 h-6 w-44" />
              <Skeleton className="mx-auto mt-3 h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export function NewsPageSkeleton() {
  return (
    <main
      className="min-h-screen pt-28 pb-24"
      aria-busy="true"
      aria-label="Memuat publikasi"
    >
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <Skeleton className="mb-10 h-4 w-36" />

        <div className="mb-12 border-b border-slate-100 pb-10">
          <Skeleton className="mb-4 h-3 w-28" />
          <Skeleton className="h-11 w-full max-w-lg sm:h-14" />
          <Skeleton className="mt-5 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        </div>

        <Skeleton className="mb-10 h-16 w-full" />

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(item => (
            <div
              key={item}
              className="overflow-hidden rounded border border-slate-100 bg-white"
            >
              <Skeleton className="aspect-[16/9] w-full" />
              <div className="p-5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="mt-4 h-6 w-5/6" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
                <Skeleton className="mt-5 h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export function NewsDetailSkeleton() {
  return (
    <main
      className="min-h-screen pt-28 pb-24"
      aria-busy="true"
      aria-label="Memuat detail publikasi"
    >
      <article className="mx-auto max-w-4xl px-4 sm:px-6">
        <Skeleton className="mb-10 h-4 w-40" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-5 h-11 w-full" />
        <Skeleton className="mt-3 h-11 w-4/5" />
        <Skeleton className="mt-6 h-4 w-48" />
        <Skeleton className="mt-8 aspect-[16/9] w-full" />

        <div className="mt-10 space-y-3">
          {[1, 2, 3, 4, 5, 6].map(item => (
            <Skeleton
              key={item}
              className={item % 3 === 0 ? 'h-4 w-4/5' : 'h-4 w-full'}
            />
          ))}
        </div>
      </article>
    </main>
  )
}

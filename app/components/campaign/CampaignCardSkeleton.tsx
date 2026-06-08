export function CampaignCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#161210", border: "1px solid #2E2620" }}>
      <div className="h-48 shimmer" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 rounded-lg shimmer" />
        <div className="h-4 w-full rounded-lg shimmer" />
        <div className="h-4 w-2/3 rounded-lg shimmer" />
        <div className="h-1.5 w-full rounded-full shimmer mt-4" />
        <div className="flex justify-between mt-3">
          <div className="h-4 w-16 rounded shimmer" />
          <div className="h-4 w-20 rounded shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <div className="text-xs text-muted">Dashboard yuklanmoqda...</div>
      </div>
    </div>
  );
}

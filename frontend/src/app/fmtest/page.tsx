export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Page not found</h2>
        <p className="text-sm text-gray-500 mb-6">This test page has been removed.</p>
        <a href="/" className="btn-primary inline-block">Go Home</a>
      </div>
    </div>
  );
}

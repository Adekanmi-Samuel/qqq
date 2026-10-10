import Link from "next/link";
import WheelIcon from "@/components/WheelIcon";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-sh-green-950">
      <WheelIcon size={80} variant="light" />
      <h1 className="text-6xl font-bold text-white mt-8 mb-4">404</h1>
      <p className="text-sh-green-200 text-lg mb-8 text-center max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-sh-green-800 text-white rounded-lg font-medium hover:bg-sh-green-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}

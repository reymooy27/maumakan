import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-brand-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
        </div>

        <h1 className="text-5xl font-extrabold text-white mb-2">404</h1>
        <h2 className="text-lg font-semibold text-gray-300 mb-2">
          Page not found
        </h2>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          Looks like this page doesn&apos;t exist. The place you&apos;re
          looking for might have moved or been removed.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
        >
          Back to Map
        </Link>
      </div>
    </div>
  );
}

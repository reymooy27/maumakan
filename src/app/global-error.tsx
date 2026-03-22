'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#030712',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
          color: '#fff',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center', padding: '0 16px' }}>
          {/* Icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <svg
              width="40"
              height="40"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="#f87171"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p
            style={{
              color: '#9ca3af',
              fontSize: 14,
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            A critical error occurred. Please try refreshing the page.
            {error.digest && (
              <span
                style={{
                  display: 'block',
                  marginTop: 4,
                  color: '#6b7280',
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}
              >
                Error ID: {error.digest}
              </span>
            )}
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: '10px 20px',
                background: '#f97316',
                color: '#fff',
                fontWeight: 500,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                padding: '10px 20px',
                background: '#1f2937',
                color: '#e5e7eb',
                fontWeight: 500,
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              Go to home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

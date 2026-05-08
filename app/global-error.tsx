"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-lg font-semibold text-stone-900">Something went wrong.</h1>
          <p className="mt-2 text-sm text-stone-600">Please try again.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 cursor-pointer rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}


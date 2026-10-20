"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront Application Error:", error);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] items-center justify-center py-16 px-4">
      <div className="mx-auto max-w-lg text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-destructive">
          System Notice
        </p>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Something Went Wrong
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          We encountered an unexpected issue while loading this page. You can try refreshing the page or contact our wholesale desk directly.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()} variant="default" size="lg" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              <span>Go to Homepage</span>
            </Link>
          </Button>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
          Need immediate assistance? Contact Gayatri Store wholesale support on WhatsApp at{" "}
          <a
            href="https://wa.me/918849263377"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-bold text-fresh underline"
          >
            <MessageCircle className="h-3.5 w-3.5" /> +91 884 926 3377
          </a>
        </div>
      </div>
    </section>
  );
}


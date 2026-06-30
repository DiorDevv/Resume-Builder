"use client";

import React from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Builder Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex h-[calc(100vh-57px)] items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <h2 className="text-sm font-bold text-[#F8FAFC]">Xatolik yuz berdi</h2>
            <p className="mt-2 text-xs text-muted">Builder komponentida xatolik.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-input bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-glow"
            >
              Qayta yuklash
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

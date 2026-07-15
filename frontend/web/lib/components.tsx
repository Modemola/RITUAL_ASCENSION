"use client";

import { Component, CSSProperties, ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";

export const LoadingSpinner = ({
  size = "md",
  message,
}: {
  size?: "sm" | "md" | "lg";
  message?: string;
}) => {
  const sizeClass = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  }[size];

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClass} animate-spin text-cyan`}>
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {message ? <span className="text-sm text-muted">{message}</span> : null}
    </div>
  );
};

export const Skeleton = ({
  className = "",
  width,
  height,
}: {
  className?: string;
  width?: number | string;
  height?: number | string;
}) => {
  const style: CSSProperties = {};
  if (width !== undefined) style.width = typeof width === "number" ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`skeleton-wave bg-gradient-to-r from-black/20 via-cyan/10 to-black/20 ${className}`}
      style={style}
    />
  );
};

export const SkeletonText = ({
  className = "",
  lines = 1,
  width,
}: {
  className?: string;
  lines?: number;
  width?: number | string;
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        width={width}
        className={`h-4 rounded ${width ? "" : i === lines - 1 ? "w-3/4" : "w-full"}`}
      />
    ))}
  </div>
);

export const Toast = ({
  type = "info",
  message,
  onClose,
}: {
  type?: "success" | "error" | "info" | "warning";
  message: string;
  onClose: () => void;
}) => {
  const bgClass = {
    success: "border-green/30 bg-green/10 text-green",
    error: "border-red-500/30 bg-red-500/10 text-red-400",
    info: "border-cyan/30 bg-cyan/10 text-cyan",
    warning: "border-amber/30 bg-amber/10 text-amber",
  }[type];

  return (
    <div
      role="status"
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`fixed bottom-4 left-4 right-4 z-50 rounded-lg border px-4 py-3 shadow-lg animate-slide-up sm:right-auto sm:max-w-sm fade-in ${bgClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-md opacity-70 hover:opacity-100">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal = ({
  isOpen,
  title,
  children,
  onClose,
  actions,
}: {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = "modal-title";

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/64 backdrop-blur-md" onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div ref={panelRef} className="rune-panel w-full max-w-lg scale-in shadow-rune">
          <div className="flex items-center justify-between border-b border-cyan/12 px-5 py-4 sm:px-6">
            <h2 id={titleId} className="text-lg font-semibold sm:text-xl">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="quiet-button grid size-9 place-items-center text-muted transition-colors hover:text-cyan"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="px-5 py-5 sm:px-6">{children}</div>
          {actions ? <div className="flex gap-3 border-t border-cyan/12 px-5 py-4 sm:px-6">{actions}</div> : null}
        </div>
      </div>
    </>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// A real React error boundary (class components are the only way to catch
// render errors) — catches crashes in its subtree instead of showing a blank page.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="rune-panel border-red-500/30 bg-red-500/5 p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-red-400">Something went wrong</h3>
            <p className="mt-2 text-sm text-muted">{error.message}</p>
          </div>
          <button type="button" onClick={this.reset} className="rune-button px-4 py-2 text-sm font-semibold">
            Try again
          </button>
        </div>
      </div>
    );
  }
}

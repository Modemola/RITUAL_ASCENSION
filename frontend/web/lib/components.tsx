"use client";

import { CSSProperties, ReactNode } from "react";

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
      className={`fixed bottom-4 left-4 right-4 z-50 rounded-lg border px-4 py-3 shadow-lg animate-slide-up sm:right-auto sm:max-w-sm fade-in ${bgClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button type="button" onClick={onClose} className="text-lg font-bold opacity-70 hover:opacity-100">
          x
        </button>
      </div>
    </div>
  );
};

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
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
        <div className="rune-panel w-full max-w-md scale-in">
          <div className="flex items-center justify-between border-b border-cyan/15 px-6 py-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="text-muted transition-colors hover:text-cyan">
              x
            </button>
          </div>
          <div className="px-6 py-4">{children}</div>
          {actions ? <div className="flex gap-3 border-t border-cyan/15 px-6 py-4">{actions}</div> : null}
        </div>
      </div>
    </>
  );
};

export const ErrorBoundary = ({
  children,
  error,
  onRetry,
}: {
  children: ReactNode;
  error?: string | null;
  onRetry?: () => void;
}) => {
  if (!error) return <>{children}</>;

  return (
    <div className="rune-panel border-red-500/30 bg-red-500/5 p-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-red-400">Something went wrong</h3>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </div>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="rune-button px-4 py-2 text-sm font-semibold">
            Try Again
          </button>
        ) : null}
      </div>
    </div>
  );
};

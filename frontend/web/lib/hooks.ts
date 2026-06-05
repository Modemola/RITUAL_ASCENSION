"use client";

import { useCallback, useEffect, useState } from "react";

// Form validation
export const validators = {
  wallet: (value: string) => {
    if (!value) return "Wallet address is required";
    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return "Invalid wallet address format";
    return null;
  },

  txHash: (value: string) => {
    if (!value) return "Transaction hash is required";
    if (!/^0x[a-fA-F0-9]{64}$/.test(value) && !value.startsWith("http")) {
      return "Invalid transaction hash or URL";
    }
    return null;
  },

  message: (value: string) => {
    if (!value || value.trim().length === 0) return "Message cannot be empty";
    if (value.length > 1000) return "Message is too long (max 1000 characters)";
    return null;
  },

  class: (value: string | number) => {
    const classId = typeof value === "string" ? parseInt(value) : value;
    if (!classId || classId < 1 || classId > 5) return "Invalid class selection";
    return null;
  },
};

// Custom hook for form handling
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value, type } = e.target;
      const fieldValue =
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({
        ...prev,
        [name]: fieldValue,
      }));

      // Clear error when user starts typing
      if (errors[name as keyof T]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
  }, [initialValues]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      try {
        await onSubmit(values);
        setSubmitSuccess(true);
        setValues(initialValues);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Submission failed");
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit, initialValues]
  );

  return {
    values,
    setValues,
    errors,
    setErrors,
    isSubmitting,
    submitError,
    submitSuccess,
    handleChange,
    handleSubmit,
    resetForm,
  };
};

// Hook for async operations
export const useAsync = <TArgs extends unknown[], T, E = string>(
  asyncFunction: (...args: TArgs) => Promise<T>,
  immediate = true
) => {
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">(
    "idle"
  );
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async (...args: TArgs) => {
    setStatus("pending");
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction(...args);
      setData(response);
      setStatus("success");
      return response;
    } catch (error) {
      setError(error as E);
      setStatus("error");
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as TArgs));
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
};

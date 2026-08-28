"use client";

import { useCallback } from "react";
import { translateApiError } from "./apiErrors";
import { useDictionary } from "./DictionaryProvider";
import { useLocale } from "./useLocale";

/**
 * `const apiError = useApiError();` … `setError(apiError(data, t.saveFailed));`
 *
 * A hook rather than calling `translateApiError(dict, locale, body, fallback)`
 * directly, because every one of the twenty call sites is a Client Component
 * that would otherwise have to fetch the dictionary and the locale itself and
 * thread both into an async handler. Here they are captured once at the top of
 * the component and the handler closes over one function.
 *
 * The second argument is the caller's own translated line for "this particular
 * thing failed" — `t.createFailed`, `t.uploadFailed`. It is used when the API
 * did not send a code this build knows, which is the deploy-skew case.
 */
export function useApiError() {
  const dict = useDictionary();
  const locale = useLocale();

  return useCallback(
    (body: unknown, fallback?: string) =>
      translateApiError(dict, locale, body, fallback),
    [dict, locale],
  );
}

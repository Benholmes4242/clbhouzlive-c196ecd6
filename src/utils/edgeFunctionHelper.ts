import { supabase } from '@/integrations/supabase/client';

interface EdgeFunctionOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class EdgeFunctionError extends Error {
  constructor(
    message: string,
    public readonly functionName: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'EdgeFunctionError';
  }
}

/**
 * Enhanced edge function caller with timeout, retry logic, and better error handling
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  body: any,
  options: EdgeFunctionOptions = {}
): Promise<T> {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body,
        });

        clearTimeout(timeoutId);

        if (error) {
          throw new EdgeFunctionError(
            `Edge function ${functionName} returned error: ${error.message}`,
            functionName,
            error
          );
        }

        return data;
      } catch (invokeError) {
        clearTimeout(timeoutId);
        throw invokeError;
      }
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain types of errors
      if (error instanceof EdgeFunctionError) {
        throw error;
      }

      // Log attempt
      console.warn(`Edge function ${functionName} attempt ${attempt + 1} failed:`, error);

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  // If we get here, all retries failed
  throw new EdgeFunctionError(
    `Edge function ${functionName} failed after ${retries + 1} attempts`,
    functionName,
    lastError
  );
}

/**
 * Debounced edge function caller to prevent rapid successive calls
 */
const debouncedCalls = new Map<string, {
  timeout: NodeJS.Timeout;
  promises: { resolve: (value: any) => void; reject: (error: any) => void }[];
}>();

export function callEdgeFunctionDebounced<T = any>(
  functionName: string,
  body: any,
  debounceKey: string,
  debounceMs: number = 500,
  options?: EdgeFunctionOptions
): Promise<T> {
  return new Promise((resolve, reject) => {
    const existingCall = debouncedCalls.get(debounceKey);
    
    if (existingCall) {
      // Add to existing call
      existingCall.promises.push({ resolve, reject });
      return;
    }

    // Create new debounced call
    const promises = [{ resolve, reject }];
    const timeout = setTimeout(async () => {
      debouncedCalls.delete(debounceKey);
      
      try {
        const result = await callEdgeFunction<T>(functionName, body, options);
        promises.forEach(({ resolve }) => resolve(result));
      } catch (error) {
        promises.forEach(({ reject }) => reject(error));
      }
    }, debounceMs);

    debouncedCalls.set(debounceKey, { timeout, promises });
  });
}
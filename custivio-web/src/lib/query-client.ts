import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type MutationMeta = {
  successMessage?: string;
  errorMessage?: string;
};

function mutationMeta(meta: unknown): MutationMeta {
  return meta && typeof meta === "object" ? (meta as MutationMeta) : {};
}

export function createAppQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        if (typeof window === "undefined") return;
        const message = mutationMeta(mutation.options.meta).successMessage ?? "Action completed.";
        toast.success(message);
      },
      onError: (error, _variables, _context, mutation) => {
        if (typeof window === "undefined") return;
        const fallback = mutationMeta(mutation.options.meta).errorMessage ?? "Action failed.";
        toast.error(error instanceof Error ? error.message : fallback);
      },
    }),
  });
}

import { useNavigate } from "@tanstack/react-router";

/** Minimal router shim so imported screens keep their original navigation calls. */
export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => {
      void navigate({ to: href as never });
    },
    replace: (href: string) => {
      void navigate({ to: href as never, replace: true });
    },
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => window.location.reload(),
    prefetch: () => {},
  };
}

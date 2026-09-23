import { Link as RouterLink } from "@tanstack/react-router";
import type { AnchorHTMLAttributes } from "react";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** Drop-in link: internal paths route client-side, hashes/external fall back to <a>. */
export default function Link({ href, children, ...rest }: LinkProps) {
  if (!href || !href.startsWith("/")) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Any = RouterLink as any;
  return (
    <Any to={href} {...rest}>
      {children}
    </Any>
  );
}

export { Link };

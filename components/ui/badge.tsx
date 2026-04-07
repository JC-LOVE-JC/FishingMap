import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-[#081521]/92 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-white/72",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

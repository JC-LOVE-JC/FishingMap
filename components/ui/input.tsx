import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[20px] border border-white/10 bg-[#08140a]/92 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-emerald-500/30 focus:bg-[#0d1d11] focus:ring-2 focus:ring-emerald-500/12",
        className
      )}
      {...props}
    />
  );
}

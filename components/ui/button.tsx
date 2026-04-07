import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "accent";
  }
>;

const variants = {
  primary:
    "border-emerald-900/50 bg-[#162116] text-emerald-100 hover:bg-[#1f2c1f] shadow-[0_0_24px_rgba(74,222,128,0.08)]",
  secondary: "border-white/8 bg-[#08140a]/98 text-white hover:bg-[#112015]",
  ghost: "border-white/8 bg-[#071009]/96 text-white/76 hover:bg-[#102015] hover:text-white",
  accent:
    "border-emerald-800/40 bg-[#0d1d10] text-emerald-100 hover:bg-[#163019] shadow-[0_0_24px_rgba(74,222,128,0.1)]"
};

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

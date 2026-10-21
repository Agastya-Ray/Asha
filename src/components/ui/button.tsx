import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const styles = {
  primary: "btn-primary bg-sage text-paper",
  quiet: "border border-line bg-paper text-ink",
  sos: "btn-sos bg-sos text-paper",
  ghost: "bg-transparent text-ink",
} as const;

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-lg font-bold transition-transform duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

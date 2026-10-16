import { cn } from "../../lib/cn.js";

const VARIANTS = {
  primary: "bg-accent text-white hover:brightness-110 active:brightness-95 shadow-sm",
  secondary: "border border-line bg-surface text-fg hover:bg-raised",
  ghost: "text-muted hover:text-fg hover:bg-raised",
  success: "bg-mint text-white hover:brightness-110",
  danger: "border border-rose/40 text-rose-fg hover:bg-rose/10",
};
const SIZES = { sm: "h-8 px-3 text-[13px] gap-1.5", md: "h-10 px-4 text-sm gap-2", lg: "h-12 px-6 text-[15px] gap-2" };

export function Button({ variant = "secondary", size = "md", className, children, ...rest }) {
  return (
    <button
      type="button"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-[background,filter,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]", VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

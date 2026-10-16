import { cn } from "../../lib/cn.js";

export function Card({ interactive, className, children, ...rest }) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface", interactive && "transition duration-200 hover:scale-[1.012] hover:border-accent/50 hover:shadow-lg hover:shadow-black/10", className)} {...rest}>
      {children}
    </div>
  );
}
export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-prose text-[15px] text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

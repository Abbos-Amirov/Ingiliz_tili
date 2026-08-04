import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface border border-border rounded-2xl card-shadow ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

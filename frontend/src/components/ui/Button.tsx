"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ConflictingProps =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, ConflictingProps> {
  variant?: Variant;
  size?: Size;
}

// Primary/danger get a solid "lip" under them so they read as pressable
// buttons at a glance; the lip collapses on press (see whileTap below).
const variantClasses: Record<Variant, string> = {
  primary:
    "gradient-primary text-white shadow-[0_4px_0_0_var(--primary-strong),0_10px_24px_-10px_rgba(85,25,158,0.6)] hover:brightness-110 active:shadow-[0_1px_0_0_var(--primary-strong)]",
  secondary:
    "bg-surface text-primary border-2 border-primary/35 shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_25%,transparent)] hover:bg-primary/5 hover:border-primary/60 active:shadow-none",
  ghost: "bg-transparent text-primary hover:bg-primary/10",
  danger:
    "bg-danger text-white shadow-[0_4px_0_0_#991b1b] hover:brightness-110 active:shadow-[0_1px_0_0_#991b1b]",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-sm rounded-xl",
  md: "px-5 py-2.5 text-base rounded-xl",
  lg: "px-8 py-3.5 text-lg rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={disabled ? undefined : { y: 3, scale: 0.98 }}
        whileHover={disabled ? undefined : { y: -1 }}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 font-bold tracking-tight transition-[filter,background-color,border-color,box-shadow] duration-150 disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none min-h-11 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";

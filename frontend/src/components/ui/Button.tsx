"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";
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

// Solid, high-contrast variants so every action is obvious at a glance.
// "gold" is for buttons that sit on the dark ink panels (hero, CTA).
const variantClasses: Record<Variant, string> = {
  primary:
    "gradient-primary text-white shadow-[0_10px_24px_-10px_rgba(58,15,115,0.7)] ring-1 ring-inset ring-white/10 hover:brightness-115 hover:shadow-[0_14px_28px_-10px_rgba(58,15,115,0.75)]",
  secondary:
    "bg-surface text-foreground border-2 border-foreground/15 hover:border-primary hover:text-primary",
  ghost: "bg-transparent text-primary hover:bg-primary/10",
  danger: "bg-danger text-white shadow-[0_10px_24px_-12px_rgba(198,40,40,0.7)] hover:brightness-110",
  gold: "bg-gold text-[#1b1035] shadow-[0_10px_28px_-10px_rgba(233,168,35,0.7)] hover:brightness-105",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-1.5 text-sm rounded-xl",
  md: "px-6 py-2.5 text-[15px] rounded-xl",
  lg: "px-8 py-3.5 text-base sm:text-lg rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        whileHover={disabled ? undefined : { y: -1 }}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 font-bold tracking-tight transition-[filter,background-color,border-color,box-shadow,color] duration-200 disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none min-h-11 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";

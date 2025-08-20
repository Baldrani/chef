"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { Link } from "@/i18n/navigation";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "success" | "warm" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    href?: string;
    target?: string;
    rel?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ 
        children, 
        className = "", 
        variant = "primary", 
        size = "md", 
        fullWidth = false,
        loading = false,
        disabled = false,
        icon,
        href,
        target,
        rel,
        ...props 
    }, ref) => {
        const baseClasses = "btn";
        
        const variantClasses = {
            primary: "btn-primary",
            secondary: "btn-secondary", 
            success: "btn-success",
            warm: "btn-warm",
            danger: "btn-danger",
            ghost: "btn-ghost"
        };
        
        const sizeClasses = {
            sm: "px-3 py-2 text-xs",
            md: "px-6 py-3 text-sm",
            lg: "px-8 py-4 text-base"
        };
        
        const classes = [
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            fullWidth && "w-full",
            (disabled || loading) && "opacity-60 cursor-not-allowed",
            className
        ].filter(Boolean).join(" ");

        const buttonContent = (
            <>
                {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {icon && !loading && <span className="mr-2">{icon}</span>}
                {children}
            </>
        );

        if (href) {
            if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                return (
                    <a 
                        href={href} 
                        target={target} 
                        rel={rel}
                        className={classes}
                    >
                        {buttonContent}
                    </a>
                );
            }
            
            return (
                <Link href={href} className={classes}>
                    {buttonContent}
                </Link>
            );
        }

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || loading}
                {...props}
            >
                {buttonContent}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;

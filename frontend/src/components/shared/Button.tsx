import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'touch-target clay-button font-body font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-clay-primary text-white focus:ring-clay-primary',
    secondary: 'bg-clay-secondary text-white focus:ring-clay-secondary',
    outline: 'bg-white text-clay-primary border-2 border-clay-primary focus:ring-clay-primary',
    ghost: 'bg-transparent text-clay-primary hover:bg-clay-lavender focus:ring-clay-primary',
  };

  const sizeClasses = {
    sm: 'px-4 py-2.5 text-sm rounded-[18px]',
    md: 'px-6 py-3 text-base rounded-[20px]',
    lg: 'px-8 py-4 text-lg rounded-[22px]',
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}


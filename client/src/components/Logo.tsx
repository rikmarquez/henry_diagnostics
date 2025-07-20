interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img
        src="/logo-henrys-diagnostics.png"
        alt="Henry Diagnostics"
        className={`${sizeClasses[size]} w-auto object-contain`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <span className="hidden text-xl font-bold text-blue-600">
        HENRY DIAGNOSTICS
      </span>
    </div>
  );
};
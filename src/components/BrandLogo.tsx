interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function BrandLogo({ size = 'md', showText = true, className = '' }: BrandLogoProps) {
  const sizeMap = {
    sm: { box: 'w-6 h-6', outerRing: 'w-6 h-6 border-[2px]', innerCircle: 'w-2.5 h-2.5', text: 'text-base' },
    md: { box: 'w-8 h-8', outerRing: 'w-8 h-8 border-[2px]', innerCircle: 'w-3.5 h-3.5', text: 'text-xl' },
    lg: { box: 'w-12 h-12', outerRing: 'w-12 h-12 border-[2.5px]', innerCircle: 'w-5 h-5', text: 'text-2xl' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Animated Yellow Circle Logo with Round Offset Stroke */}
      <div className={`relative ${current.box} flex items-center justify-center shrink-0`}>
        {/* Outer Round Offset Stroke Ring rotating smoothly */}
        <span 
          className={`absolute inset-0 rounded-full border-dashed border-[#F5C518]/75 animate-spin [animation-duration:8s] ${current.outerRing}`} 
        />
        {/* Inner Yellow Circle Coming On and Off (Pulsing Glow) */}
        <span 
          className={`rounded-full bg-[#F5C518] animate-pulse shadow-sm shadow-amber-400/60 ${current.innerCircle}`} 
        />
      </div>

      {showText && (
        <span className={`font-black tracking-tight text-foreground ${current.text}`}>
          market<span className="text-[#F5C518]">OS</span>
        </span>
      )}
    </div>
  );
}

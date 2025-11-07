interface TimelineScrollbarProps {
  totalDays: number;
  currentIndex: number;
  onNavigate: (index: number) => void;
  isAnimating: boolean;
}

export const TimelineScrollbar = ({ 
  totalDays, 
  currentIndex, 
  onNavigate,
  isAnimating 
}: TimelineScrollbarProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      {Array.from({ length: totalDays }).map((_, index) => {
        const isCurrent = index === currentIndex;
        
        return (
          <button
            key={index}
            onClick={() => !isAnimating && onNavigate(index)}
            disabled={isAnimating}
            className="relative group transition-all duration-300"
            aria-label={`Navigate to day ${index + 1}`}
          >
            {/* Bubble highlight for current day */}
            {isCurrent && (
              <div 
                className="absolute inset-0 -inset-x-2 -inset-y-1 bg-foreground/5 rounded-full animate-scale-in"
                style={{
                  transform: 'scale(1.2)',
                }}
              />
            )}
            
            {/* The horizontal line */}
            <div 
              className={`relative w-8 h-[1px] transition-all duration-300 ${
                isCurrent 
                  ? 'bg-foreground' 
                  : 'bg-border group-hover:bg-foreground/40'
              }`}
              style={{
                width: isCurrent ? '40px' : '32px',
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

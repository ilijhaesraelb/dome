const flags = [
  "🇺🇸", "🇲🇽", "🇧🇷", "🇮🇳", "🇨🇳", "🇵🇭", "🇻🇳", "🇰🇷", "🇯🇵", "🇬🇧",
  "🇨🇦", "🇩🇪", "🇫🇷", "🇮🇹", "🇪🇸", "🇦🇺", "🇳🇬", "🇪🇹", "🇨🇴", "🇵🇰",
  "🇧🇩", "🇪🇬", "🇵🇪", "🇻🇪", "🇬🇹", "🇭🇳", "🇸🇻", "🇯🇲", "🇭🇹", "🇩🇴",
  "🇹🇷", "🇮🇷", "🇮🇶", "🇸🇦", "🇦🇪", "🇰🇪", "🇬🇭", "🇿🇦", "🇹🇭", "🇮🇩",
  "🇵🇱", "🇷🇴", "🇺🇦", "🇷🇺", "🇦🇷", "🇨🇱", "🇪🇨", "🇨🇺", "🇳🇵", "🇱🇰",
  "🇲🇾", "🇸🇬", "🇳🇿", "🇮🇪", "🇵🇹", "🇬🇷", "🇸🇪", "🇳🇴", "🇨🇭", "🇦🇹",
];

const FlagsWatermark = () => {
  // Create a repeating grid of flags
  const rows = 8;
  const cols = 10;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div
        className="absolute inset-0 flex flex-col justify-around items-center"
        style={{ opacity: 0.06, transform: "rotate(-12deg) scale(1.3)" }}
      >
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-10 md:gap-14 whitespace-nowrap">
            {Array.from({ length: cols }).map((_, colIdx) => {
              const flagIdx = (rowIdx * cols + colIdx + rowIdx * 3) % flags.length;
              return (
                <span key={colIdx} className="text-3xl md:text-5xl">
                  {flags[flagIdx]}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlagsWatermark;

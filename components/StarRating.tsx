"use client";

type Props = {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
};

export default function StarRating({ rating, size = "md", interactive, onChange }: Props) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : "img"} aria-label={`${rating} out of 5 stars`}>
      {stars.map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;

        return (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            disabled={!interactive}
            onClick={interactive ? () => onChange?.(star) : undefined}
            aria-label={interactive ? `${star} star` : undefined}
            className={`${interactive ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss" : ""} ${sizeClass}`}
          >
            <svg viewBox="0 0 24 24" fill={filled || half ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className={`${sizeClass} transition-colors duration-150 ${filled ? "text-moss" : half ? "text-moss" : "text-stone/40"}`}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
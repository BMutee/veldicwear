"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import StarRating from "./StarRating";

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { firstName: string; lastName: string };
};

type Props = {
  productId: string;
};

export default function ReviewSection({ productId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setAverage(data.average ?? 0);
        setCount(data.count ?? 0);
        if (user) {
          setHasReviewed(data.reviews?.some((r: Review) => r.user.firstName === user.firstName && r.user.lastName === user.lastName) ?? false);
        }
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Deferred so the initial fetch doesn't set state synchronously in the
    // effect body (same macrotask pattern as the cart page's initial load).
    const timer = window.setTimeout(() => {
      void fetchReviews();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (rating < 1) {
      setFormError("Please select a rating.");
      return;
    }
    if (comment.trim().length < 5) {
      setFormError("Comment must be at least 5 characters.");
      return;
    }

    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment: comment.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to submit review.");
        return;
      }

      // Refresh reviews
      setRating(0);
      setComment("");
      await fetchReviews();
    } catch {
      setFormError("Unable to connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="border-t border-stone/10 pt-8">
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
        Reviews
      </h2>

      {/* Average rating summary */}
      {!loading && count > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <StarRating rating={average} size="md" />
          <span className="font-mono text-lg text-ink">{average.toFixed(1)}</span>
          <span className="font-sans text-sm text-stone">({count} review{count !== 1 ? "s" : ""})</span>
        </div>
      )}

      {/* Write a Review form */}
      {user && !hasReviewed && (
        <form onSubmit={handleSubmit} className="mt-6 border border-stone/10 bg-white p-5 shadow-card rounded-lg sm:p-6 shadow-card rounded-lg">
          <h3 className="eyebrow">Write a review</h3>

          <div className="mt-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-stone mb-2">
              Your rating
            </p>
            <StarRating rating={rating} size="lg" interactive onChange={setRating} />
          </div>

          <div className="mt-4">
            <label htmlFor="review-comment" className="sr-only">Comment</label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product…"
              className="w-full border border-stone/20 bg-white px-4 py-3 font-sans text-sm text-ink outline-none transition-colors duration-150 placeholder:text-stone resize-y focus:border-moss"
            />
          </div>

          {formError && (
            <p className="mt-2 font-sans text-xs text-clay">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`mt-4 px-6 py-3 font-sans text-sm font-medium uppercase tracking-wide transition-colors duration-150 cursor-pointer ${
              submitting
                ? "cursor-not-allowed bg-stone/5 text-stone"
                : "bg-moss text-white hover:bg-moss-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss"
            }`}
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}

      {user && hasReviewed && (
        <p className="mt-4 font-sans text-xs text-stone">
          You have already reviewed this product.
        </p>
      )}

      {!user && count === 0 && !loading && (
        <p className="mt-4 font-sans text-sm text-stone">
          <button
            onClick={() => router.push("/login")}
            className="underline decoration-moss/40 underline-offset-2 transition-colors duration-150 hover:decoration-moss cursor-pointer"
          >
            Sign in
          </button>{" "}
          to leave a review.
        </p>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="mt-6 flex items-center justify-center py-8">
          <p className="font-sans text-sm text-stone">Loading reviews…</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="mt-6 flex flex-col items-center border border-stone/10 bg-white px-6 py-10 shadow-card rounded-lg text-center">
          <p className="font-display text-base font-semibold text-stone">
            No reviews yet
          </p>
          <p className="mt-2 font-sans text-sm text-stone">
            Be the first to share your thoughts.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-stone/10 bg-white p-5 shadow-card rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-sans text-sm font-semibold text-ink">
                    {review.user.firstName} {review.user.lastName}
                  </p>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <p className="shrink-0 font-sans text-xs text-stone">
                  {formatDate(review.createdAt)}
                </p>
              </div>
              <p className="mt-3 font-sans text-sm leading-relaxed text-stone">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
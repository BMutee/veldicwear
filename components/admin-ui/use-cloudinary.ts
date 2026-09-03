"use client";

import { useCallback } from "react";
import { useToast } from "./toast";

type CloudinaryResult = {
  event?: string;
  info?: { secure_url?: string };
};

declare global {
  interface Window {
    cloudinary?: {
      openUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: Error | null, result?: CloudinaryResult) => void
      ) => void;
    };
  }
}

/**
 * Shared Cloudinary upload widget opener. Returns a function that opens the
 * upload widget and hands the resulting secure URL to `onUpload`. Errors and
 * missing-config cases surface as toasts instead of the legacy alert() calls.
 */
export function useCloudinaryUpload(onUpload: (url: string) => void): () => void {
  const { toast } = useToast();

  const upload = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.cloudinary) {
      toast("error", "Cloudinary widget not loaded yet. Please refresh the page.");
      return;
    }
    if (!window.cloudinary.openUploadWidget) {
      toast("error", "Cloudinary upload API not available. Try refreshing the page.");
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast("error", "Cloudinary is not configured. Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env");
      return;
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ["local", "url", "camera"],
        multiple: false,
        cropping: false,
        styles: {
          palette: {
            window: "#FAFAF9",
            sourceBg: "#171512",
            windowBorder: "#E2E8F0",
            tabIcon: "#B5602E",
            inactiveTabIcon: "#8C8677",
            menuIcons: "#171512",
            link: "#B5602E",
            action: "#B5602E",
            inProgress: "#B5602E",
            complete: "#171512",
            error: "#DC2626",
            textDark: "#171512",
            textLight: "#FAFAF9",
          },
        },
      },
      (error: Error | null, result?: CloudinaryResult) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          toast("error", "Cloudinary upload failed.");
          return;
        }
        if (result?.event === "success" && result?.info?.secure_url) {
          onUpload(result.info.secure_url);
        }
      }
    );
  }, [onUpload, toast]);

  return upload;
}
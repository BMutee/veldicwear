/**
 * Shared size-chart data model: stored on Product.sizeChart (Json), edited in
 * Admin → Products, rendered by components/SizeChart on the storefront.
 *
 * Keep this module free of server-only imports — it is used by client
 * components (admin form, product page) as well as API routes.
 */

export type SizeChartRow = {
  /** Measurement label shown in the row header (e.g. "Chest"). */
  label: string;
  /** Numbered badge matching the diagram callout; empty hides the badge. */
  callout: string;
  /** Value per size column in inches; null/missing renders "—". */
  values: Record<string, number | null>;
};

export type SizeChartData = {
  /** Subheading above the diagram (e.g. "Laid flat · Unisex"). */
  heading?: string;
  /** Column labels in display order. */
  sizes?: string[];
  rows?: SizeChartRow[];
  /** Footnote paragraph under the table. */
  notes?: string;
  calloutTitle?: string;
  calloutBody?: string;
};

export const DEFAULT_HEADING = "Laid flat · Unisex";
export const DEFAULT_SIZES = ["S", "M", "L", "XL", "2XL"];
export const DEFAULT_NOTES =
  "1: one inch below the armhole, doubled. 2: high point of shoulder to hem. Cut oversized; take your usual size, or one size down for a closer fit.";
export const DEFAULT_CALLOUT_TITLE = "Not sure?";
export const DEFAULT_CALLOUT_BODY =
  "Measure a tee you already own, laid flat, and match the chest number.";

export const DEFAULT_CHART_ROWS: SizeChartRow[] = [
  {
    label: "Chest",
    callout: "1",
    values: { S: 20.5, M: 22.5, L: 24.5, XL: 26.5, "2XL": 28.5 },
  },
  {
    label: "Length",
    callout: "2",
    values: { S: 28, M: 29, L: 30, XL: 31, "2XL": 32 },
  },
];

/** Parse a comma-separated size list into deduped column labels. */
export function parseSizesText(text: string): string[] {
  const seen = new Set<string>();
  const sizes: string[] = [];
  for (const part of text.split(",")) {
    const size = part.trim();
    if (!size) continue;
    const key = size.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    sizes.push(size);
  }
  return sizes;
}

/** Admin form shape (strings, ready for text inputs). */
export type SizeChartForm = {
  heading: string;
  /** Comma-separated column labels (e.g. "S, M, L, XL, 2XL"). */
  sizesText: string;
  rows: { label: string; callout: string; values: string[] }[];
  notes: string;
  calloutTitle: string;
  calloutBody: string;
};

/** Fully prefilled form (default chart content) for a new product. */
export function defaultSizeChartForm(): SizeChartForm {
  const sizes = DEFAULT_SIZES;
  return {
    heading: DEFAULT_HEADING,
    sizesText: sizes.join(", "),
    rows: DEFAULT_CHART_ROWS.map((row) => ({
      label: row.label,
      callout: row.callout,
      values: sizes.map((size) => {
        const value = row.values[size];
        return value == null ? "" : String(value);
      }),
    })),
    notes: DEFAULT_NOTES,
    calloutTitle: DEFAULT_CALLOUT_TITLE,
    calloutBody: DEFAULT_CALLOUT_BODY,
  };
}

/** Map stored Product.sizeChart JSON onto the admin form. */
export function sizeChartToForm(data: unknown): SizeChartForm {
  const base = defaultSizeChartForm();
  if (!data || typeof data !== "object" || Array.isArray(data)) return base;
  const chart = data as Partial<SizeChartData>;

  const sizes =
    Array.isArray(chart.sizes)
      ? chart.sizes.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : parseSizesText(base.sizesText);

  const rows = Array.isArray(chart.rows)
    ? chart.rows
        .filter((row) => row && typeof row === "object")
        .map((row) => ({
          label: typeof row.label === "string" ? row.label : "",
          callout: typeof row.callout === "string" ? row.callout : "",
          values: sizes.map((size) => {
            const value = row.values?.[size];
            return typeof value === "number" ? String(value) : "";
          }),
        }))
    : base.rows;

  return {
    heading: typeof chart.heading === "string" ? chart.heading : base.heading,
    sizesText: sizes.join(", "),
    rows: rows.length > 0 ? rows : base.rows,
    notes: typeof chart.notes === "string" ? chart.notes : base.notes,
    calloutTitle:
      typeof chart.calloutTitle === "string" ? chart.calloutTitle : base.calloutTitle,
    calloutBody:
      typeof chart.calloutBody === "string" ? chart.calloutBody : base.calloutBody,
  };
}

/** Serialize the admin form into the JSON stored on Product.sizeChart. */
export function serializeSizeChart(form: SizeChartForm): SizeChartData {
  const sizes = parseSizesText(form.sizesText);
  const rows = form.rows
    .filter((row) => row.label.trim().length > 0)
    .map((row) => {
      const values: Record<string, number | null> = {};
      for (let i = 0; i < sizes.length; i++) {
        const raw = (row.values[i] ?? "").trim();
        const parsed = Number(raw);
        values[sizes[i]] =
          raw !== "" && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
      }
      return { label: row.label.trim(), callout: row.callout.trim(), values };
    });

  return {
    heading: form.heading.trim(),
    sizes,
    rows,
    notes: form.notes.trim(),
    calloutTitle: form.calloutTitle.trim(),
    calloutBody: form.calloutBody.trim(),
  };
}

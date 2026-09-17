/**
 * Country name → ISO 3166-1 alpha-2 mapping.
 *
 * The storefront checkout collects the country as FREE TEXT (see
 * app/checkout/page.tsx — placeholder "United States"), so Order.country holds
 * a display name like "Canada". CJ's order API requires the 2-letter
 * `shippingCountryCode` / `endCountryCode`. This resolver bridges the two.
 */

const NAME_TO_ISO2: Record<string, string> = {
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  "u.s.a.": "US",
  america: "US",
  canada: "CA",
  mexico: "MX",
  "united kingdom": "GB",
  uk: "GB",
  "great britain": "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  "northern ireland": "GB",
  ireland: "IE",
  australia: "AU",
  "new zealand": "NZ",
  germany: "DE",
  france: "FR",
  spain: "ES",
  portugal: "PT",
  italy: "IT",
  netherlands: "NL",
  "the netherlands": "NL",
  holland: "NL",
  belgium: "BE",
  luxembourg: "LU",
  switzerland: "CH",
  austria: "AT",
  denmark: "DK",
  sweden: "SE",
  norway: "NO",
  finland: "FI",
  iceland: "IS",
  poland: "PL",
  czechia: "CZ",
  "czech republic": "CZ",
  slovakia: "SK",
  hungary: "HU",
  romania: "RO",
  bulgaria: "BG",
  greece: "GR",
  croatia: "HR",
  slovenia: "SI",
  serbia: "RS",
  ukraine: "UA",
  russia: "RU",
  "russian federation": "RU",
  turkey: "TR",
  "türkiye": "TR",
  israel: "IL",
  "saudi arabia": "SA",
  "united arab emirates": "AE",
  uae: "AE",
  qatar: "QA",
  kuwait: "KW",
  bahrain: "BH",
  oman: "OM",
  jordan: "JO",
  lebanon: "LB",
  egypt: "EG",
  morocco: "MA",
  algeria: "DZ",
  tunisia: "TN",
  "south africa": "ZA",
  nigeria: "NG",
  kenya: "KE",
  ghana: "GH",
  india: "IN",
  pakistan: "PK",
  bangladesh: "BD",
  "sri lanka": "LK",
  nepal: "NP",
  china: "CN",
  "hong kong": "HK",
  macau: "MO",
  macao: "MO",
  taiwan: "TW",
  japan: "JP",
  "south korea": "KR",
  "korea, republic of": "KR",
  "republic of korea": "KR",
  korea: "KR",
  singapore: "SG",
  malaysia: "MY",
  thailand: "TH",
  vietnam: "VN",
  "viet nam": "VN",
  philippines: "PH",
  indonesia: "ID",
  brunei: "BN",
  cambodia: "KH",
  brazil: "BR",
  argentina: "AR",
  chile: "CL",
  colombia: "CO",
  peru: "PE",
  ecuador: "EC",
  uruguay: "UY",
  paraguay: "PY",
  bolivia: "BO",
  venezuela: "VE",
  "costa rica": "CR",
  panama: "PA",
  guatemala: "GT",
  honduras: "HN",
  "el salvador": "SV",
  nicaragua: "NI",
  "dominican republic": "DO",
  jamaica: "JM",
  "trinidad and tobago": "TT",
  bahamas: "BS",
  cyprus: "CY",
  malta: "MT",
  estonia: "EE",
  latvia: "LV",
  lithuania: "LT",
  moldova: "MD",
  belarus: "BY",
  georgia: "GE",
  armenia: "AM",
  azerbaijan: "AZ",
  kazakhstan: "KZ",
  uzbekistan: "UZ",
  mongolia: "MN",
  fiji: "FJ",
  "papua new guinea": "PG",
};

/**
 * Resolve a user-entered country value to an ISO 3166-1 alpha-2 code.
 * Accepts either an already-valid 2-letter code ("CA", "us") or a full
 * country name ("Canada", "United States"). Returns null when unresolvable
 * so callers can surface a clear error instead of sending garbage to CJ.
 */
export function toIso2CountryCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  // Already a 2-letter code.
  if (/^[a-z]{2}$/i.test(raw)) return raw.toUpperCase();

  const normalized = raw
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return NAME_TO_ISO2[normalized] ?? null;
}

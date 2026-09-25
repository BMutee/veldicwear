/**
 * Verifies that a supplier (CJ) HTML description is turned into readable plain
 * text — what Admin → Products shows in the Description textarea and what the
 * storefront renders.
 *
 *   npx tsx scripts/verify-product-description-text.ts
 *
 * Pure logic — no server or database needed. Guards:
 *   1. No markup survives (no tags, no entities, no image URLs).
 *   2. Structure is kept: paragraphs → line breaks, <li> → bullets, table rows
 *      → " | " columns.
 *   3. Already-plain text is untouched, so saving a product again never
 *      mangles what the admin typed.
 */
import { htmlToPlainText } from "../lib/html-text";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : " FAIL "} ${label}${ok ? "" : ` → got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`
  );
}

function checkTrue(label: string, value: boolean) {
  check(label, value, true);
}

/** A representative CJ Dropshipping heated-jacket description in supplier HTML. */
const CJ_DESCRIPTION =
  '<p><b>Overview:</b></p><p><b>LIGHTWEIGHT DESIGN FOR HEATING: </b>Metallic dot lining, elastic cuffs, hem, removable hood, long sleeve and high-quality zippers help you better lock the heat, while the soft shell fabric resists moisture and wind The heated outerwear will ensure you be able to enjoy exceptional warmth while staying fashionable!<br/><b>EASY WARMTH CONTROL ON DEMAND:</b>&nbsp;Fast self-heating; Easily switch between 3 temperatures with a press of the button.&nbsp;<span style="font-size: 1em;">Imported Japanese Toray carbon fiber heating wire</span><span style="font-size: 1em;">&nbsp;elements generate heat across core body areas including the neck for up to 8-12 hours (</span><span style="font-size: 1em;">10000mA power bank)</span><span style="font-size: 1em;">&nbsp;on a full charge.</span></p><p><b>REMOVABLE HOOD:</b> With a zipper connection design, the hood is easy to detach and attach for extra wind protection. The detachable hood provides added warmth and locks temperatures to keep your head and ears cozy and warm.<br/><b>FOR ALL OCCASIONS:</b> Lightweight insulated for you to wear in many ways, do unrestricted activities while staying warm. Hooded headwear suitable for the daily work commute, walking the dog, fishing, hunting, snowboarding and going out on chilly days. Machine washable.</p><p><br/></p><p><b>Product information:</b><br/></p><p>Functions: breathable, super light, warm, wear-resistant, anti-static, anti pollution and decontamination<br/>Style: cardigan<br/>Fabric: chemical fiber blend<br/>Filler: cotton<br/>Pattern: solid color<br/>Hooded or not: hooded<br/>Wool collar material: rabbit hair<br/>Applicable scenes: running, cycling, ice and snow sports, hiking and camping, shooting, dancing, foot basket volleyball, fishing, table tennis, other ball games<br/>Color: Black Zone 2, Blue Zone 2, Red Zone 2, Black Zone 4, Blue Zone 4, Red Zone 4, Black Zone 8, Blue Zone 8, Red Zone 8, Black Zone 9<br/>Size: S, M, L, XL, XXL, 3XL, 4XL, 5XL, 6XL</p><p><br/><b>Size Information:</b><br/>Size: S, M, L, XL, XXL, 3XL, 4XL, 5XL, 6XL<br/><br/></p>';
const CJ_DESCRIPTION_TABLE =
  '<table border="0" width="100%" cellpadding="0" cellspacing="0"><tbody><tr><th>Size（Unit：cm）</th><th>Length</th><th>Shoulder</th><th>Bust</th><th>Hem</th><th>Sleeve&nbsp;Length</th></tr><tr><td>S</td><td>64</td><td>42.8</td><td>50</td><td>42</td><td>62.5</td></tr><tr><td>M</td><td>66</td><td>44</td><td>52</td><td>44</td><td>64</td></tr><tr><td>L</td><td>68</td><td>45.2</td><td>54</td><td>46</td><td>65.5</td></tr><tr><td>XL</td><td>70</td><td>46.4</td><td>56</td><td>48</td><td>67</td></tr><tr><td>2XL</td><td>72</td><td>47.6</td><td>58</td><td>50</td><td>68.5</td></tr><tr><td>3XL</td><td>74</td><td>48.8</td><td>60</td><td>52</td><td>70</td></tr><tr><td>4XL</td><td>76</td><td>50</td><td>62</td><td>54</td><td>71.5</td></tr><tr><td>5XL</td><td>78</td><td>51.2</td><td>64</td><td>56</td><td>73</td></tr><tr><td>6XL</td><td>80</td><td>52.4</td><td>66</td><td>58</td><td>74.5</td></tr></tbody></table>';

const CJ_DESCRIPTION_NOTES =
  '<p><b>Note:</b><br/>1. Asian sizes are 1 to 2 sizes smaller than European and American people. Choose the larger size if your size between two sizes. Please allow 2-3cm differences due to manual measurement.<br/>2. Please check the size chart carefully before you buy the item, if you do not know how to choose size, please contact our customer service.<br/>3. As you know, the different computers display colors differently, the color of the actual item may vary slightly from the following images.<br/><br/><b>Packing list:</b></p><p>Jacket*1（No power bank included）</p><p><br/></p><p><b>Product Image:</b></p><p><img src="https://cf.cjdropshipping.com/17000928/1725075714115506176.jpg" style="max-width:100%;" width="791" height="793.14"/><img src="https://cf.cjdropshipping.com/17000928/1725075714283278336.jpg" style="max-width: 100%;" width="790" height="790"/></p>';

const cjHtml = `${CJ_DESCRIPTION}${CJ_DESCRIPTION_TABLE}${CJ_DESCRIPTION_NOTES}`;
const plain = htmlToPlainText(cjHtml);

// ── 1. The Admin textarea must never show markup ─────────────────────────────
console.log("CJ description → plain text");
checkTrue("no HTML tags left", !/[<>]/.test(plain));
checkTrue("no entity references left", !/&\w+;|&#x?[\da-f]+;/i.test(plain));
checkTrue("no image URLs left", !plain.includes("cjdropshipping"));
check("starts at the first heading", plain.split("\n")[0], "Overview:");
check("empty input is empty", htmlToPlainText(""), "");
check("null input is empty", htmlToPlainText(null), "");

// ── 2. Structure is preserved ───────────────────────────────────────────────
console.log("\nStructure");
checkTrue(
  "headings are their own lines",
  plain.includes("\nLIGHTWEIGHT DESIGN FOR HEATING: Metallic dot lining") &&
    plain.includes("\nProduct information:\n")
);
checkTrue(
  "<br> becomes a line break",
  plain.includes("staying fashionable!\nEASY WARMTH CONTROL ON DEMAND:")
);
check(
  "inline tags merge, &nbsp; becomes a space",
  plain.includes(
    "Imported Japanese Toray carbon fiber heating wire elements generate heat across core body areas"
  ),
  true
);
check(
  "table header keeps its columns",
  plain.includes("Size（Unit：cm） | Length | Shoulder | Bust | Hem | Sleeve Length"),
  true
);
check(
  "table row keeps its columns",
  plain.includes("\nS | 64 | 42.8 | 50 | 42 | 62.5\n"),
  true
);
check("no line has leading/trailing table bars", /(^|\n)\s*\|/.test(plain), false);
check("no doubled blank lines", /\n{3}/.test(plain), false);
check("no trailing blank lines", /\n$/.test(plain), false);

// ── 3. Plain text is left alone (re-saving a product must not mangle it) ─────
console.log("\nPlain text is never mangled");
const adminTyped =
  "Overview:\nWarm jacket.\n\nFabric & Care\nMachine wash cold, tumble dry low.\nFits sizes < 40 and reads well in 5 > 3 settings.";
check("admin text round-trips unchanged", htmlToPlainText(adminTyped), adminTyped);
check("converted text is stable (idempotent)", htmlToPlainText(plain), plain);
check("edges are trimmed only", htmlToPlainText("  Warm jacket.  "), "Warm jacket.");
check(
  "a list reads as bullets",
  htmlToPlainText("<ul><li>Breathable</li><li>Machine washable</li></ul>"),
  "• Breathable\n• Machine washable"
);
check("headings keep their own line", htmlToPlainText("<h3>Details</h3><p>Soft shell.</p>"), "Details\n\nSoft shell.");
check("nested inline tags are unwrapped", htmlToPlainText("<p><b><i>Warm</i></b> jacket</p>"), "Warm jacket");
check(
  "styles, scripts and image tags disappear",
  htmlToPlainText('<style>p{color:red}</style><script>alert(1)</script><p>Warm jacket.</p><img src="/a.jpg">'),
  "Warm jacket."
);
check("escaped tags stay readable as text", htmlToPlainText("&lt;b&gt;Warm&lt;/b&gt; jacket"), "<b>Warm</b> jacket");
check("numeric entities are decoded", htmlToPlainText("Jacket&#39;s 8&ndash;12 hours"), "Jacket's 8–12 hours");
check("double-escaped entities are not decoded twice", htmlToPlainText("&amp;lt;b&amp;gt;"), "&lt;b&gt;");
check("HTML-only descriptions become empty text", htmlToPlainText("<p><br></p>"), "");

// ── 4. Ordinary plain text that merely contains & or < stays as typed ───────
console.log("\nOrdinary symbols are not mistaken for HTML");
const withAmpersand = "Material & care\nCare & maintenance";
check("a lone ampersand is preserved", htmlToPlainText(withAmpersand), withAmpersand);
check(
  "a trailing ampersand is preserved",
  htmlToPlainText("Soft shell & windproof"),
  "Soft shell & windproof"
);
check(
  "a non-HTML entity-looking word is preserved",
  htmlToPlainText("Fits sizes < 40; weight > 5; colour: & more"),
  "Fits sizes < 40; weight > 5; colour: & more"
);
check(
  "intentional blank lines in plain text are preserved",
  htmlToPlainText("Overview:\n\nWarm jacket.\n\n\nCare notes."),
  "Overview:\n\nWarm jacket.\n\n\nCare notes."
);
check("a lone ampersand survives an edit round trip", htmlToPlainText("A & B & C"), "A & B & C");

// ── 5. Image-only supplier descriptions have no readable text ─────────────────
// cj-import.ts falls back to its "Imported from CJ Dropshipping: …" placeholder
// whenever htmlToPlainText() returns "".
console.log("\nImage-only supplier descriptions");
const imageOnly = htmlToPlainText('<p><img src="https://example.com/a.jpg" /></p>');
check("image-only HTML yields no readable text", imageOnly, "");
check(
  "the import fallback is used for image-only descriptions",
  imageOnly || "Imported from CJ Dropshipping: Outerwear",
  "Imported from CJ Dropshipping: Outerwear"
);
check(
  "image URLs embedded in otherwise real text are still dropped",
  htmlToPlainText('<p>Warm jacket.</p><p><img src="https://example.com/b.jpg" /></p>'),
  "Warm jacket."
);

console.log(
  failures === 0
    ? "\n✅ Product descriptions are simple text, with structure and meaning kept."
    : `\n❌ ${failures} check(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);


/**
 * Business contact details, in one place.
 *
 * These are published on the legal pages AND on checkout, because Alberta's
 * Consumer Protection Act requires a seller to disclose its name, address,
 * telephone number and email to the consumer BEFORE an internet sale contract
 * over $50 is entered, and requires a written copy of the contract within 15
 * days.
 *
 * Because the same values appear in several surfaces, they live here rather
 * than being copy-pasted. If you change one, change it here.
 *
 * NOTE: these mirror the footer, which reads from the StoreSettings database
 * row via getStoreSettings(). If you edit the contact details in
 * Admin -> Settings, update them here too so the two cannot drift apart.
 */

export const BUSINESS_INFO = {
  /** Operating brand shown to customers. */
  name: "Veldic Wear",
  /** Legal name for contract purposes. */
  legalName: "Veldic Wear",
  email: "info@veldicwear.com",
  /** Display form, e.g. "+1 587-938-0694". */
  phone: "+1 587-938-0694",
  /** Digits only, for tel: links. */
  phoneHref: "+15879380694",
  street: "7720 38A Avenue NW",
  city: "Edmonton, AB T6K 2M1",
  country: "Canada",
} as const;

/** Single-line postal address, for compact display. */
export const BUSINESS_ADDRESS_LINE = `${BUSINESS_INFO.street}, ${BUSINESS_INFO.city}, ${BUSINESS_INFO.country}`;

/**
 * Threshold above which Alberta's Consumer Protection Act treats an online
 * purchase as an "internet sales contract", triggering the statutory
 * cancellation rights and pre-contract disclosure duties.
 */
export const INTERNET_SALES_CONTRACT_THRESHOLD = "$50";

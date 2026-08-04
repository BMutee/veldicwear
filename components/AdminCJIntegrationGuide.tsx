type Props = {
  webhookUrl?: string;
};

export default function AdminCJIntegrationGuide({ webhookUrl }: Props = {}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">How to Add Products from CJ</h2>
      <p className="mt-3 text-black/70">
        Browse products directly on the CJ website and use <strong>“List to store”</strong> — products are added to
        your store automatically through the CJ webhook. No need to import manually here.
      </p>

      <div className="mt-6 space-y-6 text-sm text-black/80">
        <section>
          <h3 className="text-lg font-semibold">Steps — List to Store</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              Go to{" "}
              <a
                href="https://www.cjdropshipping.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-clay underline underline-offset-2 hover:text-[#B57904] cursor-pointer"
              >
                cjdropshipping.com
              </a>{" "}
              and sign in with your CJ account.
            </li>
            <li>Search or browse the product you want to sell.</li>
            <li>
              On the product page, click <strong>“List to store”</strong> (or “Source to My Store”).
            </li>
            <li>
              Choose this store from the list of connected shops and set your selling price.
            </li>
            <li>
              Confirm — CJ sends a <code>PRODUCT</code> webhook to this store, and the product is imported
              automatically. Refresh the{" "}
              <a
                href="/admin/products"
                className="font-medium text-clay underline underline-offset-2 hover:text-[#B57904] cursor-pointer"
              >
                Products
              </a>{" "}
              page to see it.
            </li>
          </ol>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Webhook URL (required)</h3>
          <p className="mt-2">
            For “List to store” to deliver products, configure this webhook URL in your CJ account's developer /
            webhook settings. Products are signed with your openId (HMAC-SHA256) for security.
          </p>
          {webhookUrl ? (
            <code className="mt-3 block rounded-lg border border-black/10 bg-white px-3 py-2 font-mono text-xs break-all">
              {webhookUrl}
            </code>
          ) : (
            <p className="mt-3 text-black/60">
              The webhook URL is shown on the main CJ Dropshipping admin page.
            </p>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold">What happens automatically</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>PRODUCT</strong> webhook — a product is created or updated; it is imported into the store with
              its image, name, price, and description.
            </li>
            <li>
              <strong>VARIANT</strong> / <strong>STOCK</strong> webhooks — product variants, sizes, colors, and
              prices are kept in sync automatically.
            </li>
            <li>You can still set featured status, collections, and your own pricing in the Products admin.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Manual import (optional)</h3>
          <p className="mt-2">
            The{" "}
            <a
              href="/admin/cj/browse"
              className="font-medium text-clay underline underline-offset-2 hover:text-[#B57904] cursor-pointer"
            >
              Browse CJ Catalog
            </a>{" "}
            page remains available if you prefer to search CJ's catalog and import products from the admin panel
            instead of the CJ website.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Troubleshooting</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Make sure the webhook URL is publicly reachable (not localhost) and HTTPS in production.</li>
            <li>Verify your CJ account's openId matches the one used to sign webhooks.</li>
            <li>Products imported with “List to store” are active immediately; check the Products admin to edit.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
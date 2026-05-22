/**
 * Verify callback for `express.json({ verify })` so handlers can read `req.rawBody`
 * for webhook signatures (Stripe, etc.). Nest mounted similar middleware globally;
 * here prefer attaching only on routes that need it.
 *
 * @example
 * app.post('/webhooks/stripe', express.json({
 *   verify: rawBodySaver(),
 * }), stripeHandler);
 */
export default function rawBodySaver() {
  return function verify(req, res, buf) {
    if (buf?.length) {
      req.rawBody = Buffer.from(buf);
    }
  };
}

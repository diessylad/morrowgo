// The server revalidates the package and price before creating a Stripe session.
export async function startCheckout(iso, plan) {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ iso, plan: plan.id }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok || !data.url) throw new Error('Checkout unavailable');
  const url = new URL(data.url);
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Invalid checkout URL');
  window.location.assign(url.href);
}

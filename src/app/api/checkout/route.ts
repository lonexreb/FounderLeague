import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, PLANS } from '@/lib/stripe';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { origin } = new URL(request.url);

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: PLANS.premium.priceId,
        quantity: 1,
      },
    ],
    customer_email: user.email || undefined,
    metadata: { user_id: user.id },
    success_url: `${origin}/profile?upgraded=true`,
    cancel_url: `${origin}/profile`,
  });

  return NextResponse.json({ url: session.url });
}

/**
 * Open a Telegram Stars invoice for a catalog item and resolve with its status.
 * Crediting happens server-side in the webhook; the caller only updates the UI.
 */

export type PurchaseStatus = 'paid' | 'cancelled' | 'failed' | 'pending' | 'error';

export async function startPurchase(packId: string): Promise<{ status: PurchaseStatus; error?: string }> {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return { status: 'error', error: 'Open the app in Telegram' };

  try {
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: tg.initData, packId }),
    });
    const data = await res.json();
    if (!data.ok) return { status: 'error', error: data.error || 'Error' };

    return await new Promise((resolve) => {
      tg.openInvoice(data.invoiceUrl, (status: PurchaseStatus) => {
        if (status === 'paid') tg.HapticFeedback?.notificationOccurred('success');
        resolve({ status });
      });
    });
  } catch {
    return { status: 'error', error: 'Error creating invoice' };
  }
}

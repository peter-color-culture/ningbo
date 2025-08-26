import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }


    const n8nWebhookUrl = 'https://internal.colorculture.com/n8n/webhook/e94b7663-4505-41d2-8a5e-a5023461f038';
    //console.log('Calling n8n webhook with orderId:', orderId);
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-token': 'wduw4m6h83xl2m',
      },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // console.log('n8n webhook response:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Order processed successfully',
      result 
    });
  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process order', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

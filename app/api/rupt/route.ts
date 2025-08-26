import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Always use "Shenzen" sheet
    const sheet = 'Shenzen';

    const n8nWebhookUrl = 'https://internal.colorculture.com/n8n/webhook/e94b7663-4505-41d2-8a5e-a5023461f038';
    //console.log('Calling rupt n8n webhook with sheet:', sheet);
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-token': 'wduw4m6h83xl2m',
      },
      body: JSON.stringify({ sheet }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    //console.log('Rupt n8n webhook response:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rupt sheet processed successfully',
      result 
    });
  } catch (error) {
    console.error('Error calling rupt n8n webhook:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process rupt sheet', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

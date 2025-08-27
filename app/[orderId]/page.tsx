'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams } from 'next/navigation';

interface ParsedUrlField {
  text: string;
  url: string;
}

interface RuptOrderItem {
  row_number: number;
  houstonCCOrder: string;
  ruptOrder: string;
  company: string;
  customerName: string;
  customerAddress: string;
  dateOrderReceived: string;
  shipTo: string;
  orderTotal: number;
  sku: string;
  size: string;
  mockUp1Url: string;
  artwork1Url: string;
  mockUp2Url: string;
  artwork2Url: string;
  // Parsed fields for display
  mockUp1Parsed: ParsedUrlField | null;
  artwork1Parsed: ParsedUrlField | null;
  mockUp2Parsed: ParsedUrlField | null;
  artwork2Parsed: ParsedUrlField | null;
  quantity: number;
  cost: number;
  imprints: number;
  neckLabel: string;
  lineItemTotal: number;
  status: string;
  notes: string;
  estimatedShippingDate: string;
  tracking: string;
}

interface RuptOrder {
  orderId: string;
  ruptOrder: string;
  company: string;
  customerName: string;
  customerAddress: string;
  dateOrderReceived: string;
  shipTo: string;
  orderTotal: number;
  items: RuptOrderItem[];
}

function RuptOrderContent() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [loading, setLoading] = useState(false);
  const [ruptOrder, setRuptOrder] = useState<RuptOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItemExpansion = (index: number) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(index)) {
      newExpandedItems.delete(index);
    } else {
      newExpandedItems.add(index);
    }
    setExpandedItems(newExpandedItems);
  };

  // Function to parse text and URL from field values
  const parseUrlField = (fieldValue: string): ParsedUrlField | null => {
    if (!fieldValue || fieldValue.trim() === '') return null;
    
    // Check if it contains a URL
    const urlRegex = /https?:\/\/[^\s]+/;
    const urlMatch = fieldValue.match(urlRegex);
    
    if (urlMatch) {
      const url = urlMatch[0];
      // Remove the URL from the text and clean up any extra punctuation
      let text = fieldValue.replace(url, '').trim();
      // Clean up common separators like colons, dashes, etc.
      text = text.replace(/^[:-\s]+|[:-\s]+$/g, '').trim();
      
      return {
        text: text || 'Link',
        url: url
      };
    }
    
    // If no URL found, treat the entire value as text
    return {
      text: fieldValue.trim(),
      url: ''
    };
  };

  // Transform n8n response into structured order format
  const transformRuptOrder = (data: Array<Record<string, unknown>>): RuptOrder | null => {
    if (!data || data.length === 0) return null;
    
    const firstItem = data[0];
    
    return {
      orderId: String(firstItem['Houston CC \nOrder #'] || firstItem['Shenzen CC \nOrder #'] || ''),
      ruptOrder: String(firstItem['Rupt \nOrder #'] || ''),
      company: String(firstItem['Company'] || ''),
      customerName: String(firstItem['Customer \nName'] || ''),
      customerAddress: String(firstItem['Customer \nAddress'] || ''),
      dateOrderReceived: String(firstItem['Date Order\nReceived'] || ''),
      shipTo: String(firstItem['Ship To:'] || ''),
      orderTotal: Number(firstItem['Order Total\n(US$)'] || 0),
      items: data.map(item => {
        const mockUp1Url = String(item['Mock Up 1\n (URL)'] || '');
        const artwork1Url = String(item['Artwork 1\n(URL)'] || '');
        const mockUp2Url = String(item['Mock Up 2\n (URL)'] || '');
        const artwork2Url = String(item['Artwork 2\n(URL)'] || '');
        
        return {
          row_number: Number(item.row_number || 0),
          houstonCCOrder: String(item['Houston CC \nOrder #'] || ''),
          ruptOrder: String(item['Rupt \nOrder #'] || ''),
          company: String(item['Company'] || ''),
          customerName: String(item['Customer \nName'] || ''),
          customerAddress: String(item['Customer \nAddress'] || ''),
          dateOrderReceived: String(item['Date Order\nReceived'] || ''),
          shipTo: String(item['Ship To:'] || ''),
          orderTotal: Number(item['Order Total\n(US$)'] || 0),
          sku: String(item['SKU'] || ''),
          size: String(item['Size'] || ''),
          mockUp1Url,
          artwork1Url,
          mockUp2Url,
          artwork2Url,
          // Parse the fields for display
          mockUp1Parsed: parseUrlField(mockUp1Url),
          artwork1Parsed: parseUrlField(artwork1Url),
          mockUp2Parsed: parseUrlField(mockUp2Url),
          artwork2Parsed: parseUrlField(artwork2Url),
          quantity: Number(item['Quantity'] || 0),
          cost: Number(item['Cost'] || 0),
          imprints: Number(item['Imprints \n($2)'] || 0),
          neckLabel: String(item['Neck Label \n(75¢)'] || ''),
          lineItemTotal: Number(item['Line Item Total\n(US$)'] || 0),
          status: String(item['Status'] || ''),
          notes: String(item['Notes'] || ''),
          estimatedShippingDate: String(item['Estimated \nShipping Date'] || ''),
          tracking: String(item['Tracking'] || ''),
        };
      })
    };
  };

  const processOrder = useCallback(async () => {
    if (!orderId) {
      setError('No order ID provided');
      return;
    }

    setLoading(true);
    setError(null);
    setRuptOrder(null);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/ningbo';
      const response = await fetch(`${basePath}/api/ruptOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to process order: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the n8n response into structured order format
      if (data && data.result && Array.isArray(data.result)) {
        const transformedOrder = transformRuptOrder(data.result);
        setRuptOrder(transformedOrder);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);



  // Auto-process the order when the page loads
  useEffect(() => {
    if (orderId) {
      processOrder();
    }
  }, [orderId, processOrder]);

  if (!orderId) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Ningbo Order</h1>
          <p className="text-gray-600 mb-4">
            No order ID provided. Please provide an order ID in the URL.
          </p>
          <p className="text-sm text-gray-500">
            Example: /rupt/HT001
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">
            Ningbo Order <span className="font-mono bg-gray-100 px-3 py-1 rounded text-lg">{orderId}</span>
          </h1>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back
          </button>
        </div>
        
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-800">Processing order through n8n workflow...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {ruptOrder && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Order: <span className="font-mono bg-gray-100 px-3 py-1 rounded text-lg">{orderId}</span></h3>
            
            {/* Order Header - Two Columns */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="mb-2"><span className="font-medium">{orderId?.startsWith('HT') ? 'Houston CC Order #' : 'Shenzen CC Order #'}:</span></p>
                <p className="mb-2"><span className="font-medium">Order #:</span></p>
                <p className="mb-2"><span className="font-medium">Company:</span></p>
                <p className="mb-2"><span className="font-medium">Customer Name:</span></p>
                <p className="mb-2"><span className="font-medium">Customer Address:</span></p>
                <p className="mb-2"><span className="font-medium">Date Order Received:</span></p>
                <p className="mb-2"><span className="font-medium">Order Total (US$):</span></p>
              </div>
              <div>
                <p className="mb-2"><span className="font-mono bg-blue-100 px-2 py-1 rounded">{orderId}</span></p>
                <p className="mb-2"><span className="font-mono bg-blue-100 px-2 py-1 rounded">{ruptOrder.ruptOrder}</span></p>
                <p className="mb-2">{ruptOrder.company || '—'}</p>
                <p className="mb-2">{ruptOrder.customerName || '—'}</p>
                <p className="mb-2">{ruptOrder.customerAddress || '—'}</p>
                <p className="mb-2">{ruptOrder.dateOrderReceived || '—'}</p>
                <p className="mb-2"><span className="font-bold text-lg">${ruptOrder.orderTotal.toFixed(2)}</span></p>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-blue-200 rounded">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Size</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Quantity</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Cost</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Imprints</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Neck Label</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200">
                  {ruptOrder.items.map((item, index) => {
                    const hasImages = item.mockUp1Parsed || item.mockUp2Parsed || item.artwork1Parsed || item.artwork2Parsed;
                    
                    return [
                      // Main data row
                      <tr key={`${index}-main`} className="hover:bg-blue-50">
                        <td className="px-3 py-2 text-sm text-gray-900 font-mono">{item.sku}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.size}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 font-bold">{item.quantity}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">${item.cost.toFixed(2)}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.imprints}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.neckLabel}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 font-bold">${item.lineItemTotal.toFixed(2)}</td>
                      </tr>,
                      
                      // Collapsible header row (only if images exist)
                      hasImages && (
                        <tr key={`${index}-header`} className="bg-gray-100 border-t border-gray-200">
                          <td colSpan={7} className="px-3 py-2">
                            <button
                              onClick={() => toggleItemExpansion(index)}
                              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${expandedItems.has(index) ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span>View Mock Ups & Artwork</span>
                              <span className="text-xs text-gray-500">
                                ({[
                                                      item.mockUp1Parsed && 'Mock Up 1',
                    item.mockUp2Parsed && 'Mock Up 2',
                    item.artwork1Parsed && 'Artwork 1',
                    item.artwork2Parsed && 'Artwork 2'
                                ].filter(Boolean).length} items)
                              </span>
                            </button>
                          </td>
                        </tr>
                      ),
                      
                      // Collapsible content row (only if expanded and images exist)
                      hasImages && expandedItems.has(index) && (
                        <tr key={`${index}-images`} className="bg-gray-50">
                          <td colSpan={7} className="px-3 py-4">
                            <div className="grid grid-cols-2 gap-6">
                              {/* Mock Ups Section */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Mock Ups</h4>
                                <div className="space-y-3">
                                  {item.mockUp1Parsed && (
                                    <div className="flex items-center space-x-3">
                                      <span className="text-xs text-gray-500 w-16">Mock Up 1:</span>
                                                                             {item.mockUp1Parsed.url ? (
                                         <a 
                                           href={item.mockUp1Parsed.url} 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           className="text-blue-600 hover:underline truncate max-w-[150px]"
                                         >
                                           {item.mockUp1Parsed.text}
                                         </a>
                                       ) : (
                                         <span className="text-gray-700 truncate max-w-[150px]">
                                           {item.mockUp1Parsed.text}
                                         </span>
                                       )}
                                    </div>
                                  )}
                                  {item.mockUp2Parsed && (
                                    <div className="flex items-center space-x-3">
                                      <span className="text-xs text-gray-500 w-16">Mock Up 2:</span>
                                                                             {item.mockUp2Parsed.url ? (
                                         <a 
                                           href={item.mockUp2Parsed.url} 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           className="text-blue-600 hover:underline truncate max-w-[150px]"
                                         >
                                           {item.mockUp2Parsed.text}
                                         </a>
                                       ) : (
                                         <span className="text-gray-700 truncate max-w-[150px]">
                                           {item.mockUp2Parsed.text}
                                         </span>
                                       )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Artwork Section */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Artwork</h4>
                                <div className="space-y-3">
                                  {item.artwork1Parsed && (
                                    <div className="flex items-center space-x-3">
                                      <span className="text-xs text-gray-500 w-16">Artwork 1:</span>
                                      {item.artwork1Parsed.url ? (
                                        <a 
                                          href={item.artwork1Parsed.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline truncate max-w-[150px]"
                                        >
                                          {item.artwork1Parsed.text}
                                        </a>
                                      ) : (
                                        <span className="text-gray-700 truncate max-w-[150px]">
                                          {item.artwork1Parsed.text}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {item.artwork2Parsed && (
                                    <div className="flex items-center space-x-3">
                                      <span className="text-xs text-gray-500 w-16">Artwork 2:</span>
                                      {item.artwork2Parsed.url ? (
                                        <a 
                                          href={item.artwork2Parsed.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline truncate max-w-[150px]"
                                        >
                                          {item.artwork2Parsed.text}
                                        </a>
                                      ) : (
                                        <span className="text-gray-700 truncate max-w-[150px]">
                                          {item.artwork2Parsed.text}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    ].filter(Boolean); // Remove any falsy values
                  })}
                </tbody>
              </table>
            </div>


          </div>
        )}

        {/* <div className="mt-6">
          <button
            onClick={processOrder}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Process Order Again'}
          </button>
        </div> */}
      </div>
    </div>
  );
}

export default function RuptOrderPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Ningbo Order</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-800">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <RuptOrderContent />
    </Suspense>
  );
}

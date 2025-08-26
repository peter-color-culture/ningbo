'use client';

import { useState, useEffect } from 'react';

interface RuptOrderItem {
  'Houston CC \nOrder #'?: string;
  'Shenzen CC \nOrder #'?: string;
  'Rupt \nOrder #'?: string;
  'Company'?: string;
  'Customer \nName'?: string;
  'Customer \nAddress'?: string;
  'Date Order\nReceived'?: string;
  'Order Total\n(US$)'?: number;
  [key: string]: unknown;
}

export default function RuptPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; result: unknown } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processRuptSheet = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/ningbo';
      const response = await fetch(`${basePath}/api/rupt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Failed to process rupt sheet: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process rupt sheet');
    } finally {
      setLoading(false);
    }
  };

  // Call the rupt route on component mount
  useEffect(() => {
    processRuptSheet();
  }, []);

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Orders for Ningbo</h1>
        


        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-800">Processing order sheet ...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">

            
            {result.result !== undefined && Array.isArray(result.result) && result.result.length > 0 && (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-green-200 rounded">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                          Shenzen CC Order #
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                          Order #
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                          Customer Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                          Customer Address
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                          Date Order Received
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                          Order Total (US$)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-200">
                      {result.result
                        .filter((item: RuptOrderItem, index: number, self: RuptOrderItem[]) => {
                          // Remove duplicates based on order number (Houston CC or Shenzen CC)
                          const orderNumber = item['Houston CC \nOrder #'] || item['Shenzen CC \nOrder #'];
                          return orderNumber && self.findIndex((x: RuptOrderItem) => 
                            (x['Houston CC \nOrder #'] || x['Shenzen CC \nOrder #']) === orderNumber
                          ) === index;
                        })
                        .map((item: RuptOrderItem, index: number) => {
                          const orderNumber = item['Houston CC \nOrder #'] || item['Shenzen CC \nOrder #'];
                          return (
                        <tr 
                          key={index} 
                          className="hover:bg-green-50 cursor-pointer"
                          onClick={() => {
                            if (orderNumber) {
                              const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/ningbo';
                                window.location.href = `${basePath}/${orderNumber}`;
                            }
                          }}
                        >
                          <td className="px-3 py-2 text-sm text-gray-900 font-mono">
                            {orderNumber || '—'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 font-mono">
                            {item['Rupt \nOrder #'] || '—'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {item['Company'] || '—'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {item['Customer \nName'] || '—'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {item['Customer \nAddress'] || '—'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {item['Date Order\nReceived'] || '—'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 font-bold">
                            ${Number(item['Order Total\n(US$)'] || 0).toFixed(2)}
                          </td>
                        </tr>
                        );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {result.result !== undefined && (!Array.isArray(result.result) || result.result.length === 0) && (
              <div>
                <h4 className="font-medium text-green-800 mb-2">n8n Response:</h4>
                <pre className="bg-white border border-green-200 rounded p-3 text-sm overflow-x-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

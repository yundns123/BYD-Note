// 中英重点标注工具的划词翻译服务
// 平台托管密钥 INTEGRATIONS_API_KEY 仅在服务端读取，前端一律经由此函数调用百度翻译
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const JSON_HEADERS = { 'Content-Type': 'application/json' };

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, ...JSON_HEADERS },
    });
  }

  // --- 解析客户端请求 ---
  let q: string;
  let from: string;
  let to: string;
  try {
    const body = await req.json();
    q = body.q;
    from = body.from ?? 'auto';
    to = body.to ?? 'en';
    if (!q || typeof q !== 'string') throw new Error('Missing q');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, ...JSON_HEADERS },
    });
  }

  // --- 注入平台密钥（禁止暴露到前端） ---
  const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, ...JSON_HEADERS },
    });
  }

  try {
    // --- 调用上游官方网关 ---
    const upstream = await fetch(
      'https://app-9dpn3ot2cvep-api-e94GZ5j0PWpa-gateway.appmiaoda.com/rpc/2.0/mt/texttrans/v1',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'X-Gateway-Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ q, from, to }),
      }
    );

    // 透传配额超限与余额不足错误
    if (upstream.status === 429 || upstream.status === 402) {
      const errText = await upstream.text();
      return new Response(errText, {
        status: upstream.status,
        headers: { ...CORS_HEADERS, ...JSON_HEADERS },
      });
    }

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `Upstream error: ${upstream.status}` }), {
        status: 502,
        headers: { ...CORS_HEADERS, ...JSON_HEADERS },
      });
    }

    const data = await upstream.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...CORS_HEADERS, ...JSON_HEADERS },
    });
  } catch (err) {
    console.error('text-translation 请求失败:', err);
    return new Response(JSON.stringify({ error: 'Translation request failed' }), {
      status: 502,
      headers: { ...CORS_HEADERS, ...JSON_HEADERS },
    });
  }
});

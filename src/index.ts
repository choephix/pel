import { Elysia } from 'elysia';
import { ip } from 'elysia-ip';
import UAParser from 'ua-parser-js';

const PORT = process.env.PORT || 2600;

const onePixelGif = 'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
const onePixelBuffer = Buffer.from(onePixelGif, 'base64');
const onePixelHeaders = {
  'Content-Type': 'image/gif',
  'Content-Length': onePixelBuffer.length.toString(),
};

async function getIpInfo(ip: string) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    return await response.json();
  } catch (error) {
    return { ipInfoError: String(error) };
  }
}

const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;
async function postAnalyticsData(data: any) {
  try {
    if (!NOCODB_API_TOKEN) {
      throw new Error('No NOCODB_API_TOKEN environment variable found.');
    }

    const table_id = 'm5kw3rj86rdectu';
    const response = await fetch(`https://nocodb.prj.cx/api/v2/tables/${table_id}/records`, {
      method: 'POST',
      headers: { 'xc-token': NOCODB_API_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error posting data to NocoDB: ${response.statusText}`);
    }

    await response.json();
  } catch (error) {
    console.error('Error posting data to NocoDB:', error);
  }
}

const app = new Elysia()
  .use(ip())
  .get('/', () => 'Hello Elysia')
  .get('/favicon.ico', () => {
    return new Response(null, { status: 204 });
  })
  .get('/:filename', async req => {
    const ip = req.query.ip_override || req.ip;
    const referrer = req.headers['referer'] || 'Direct';

    const ua = new UAParser(req.headers['user-agent']);

    const ipInfo = await getIpInfo(ip);

    const headersString = Object.entries(req.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const pelFileName = req.params['filename'];

    const analyticsData = {
      timestamp: new Date(),
      ip: ip,
      browser: ua.getBrowser().name,
      browserVersion: ua.getBrowser().version,
      browserEngine: ua.getEngine().name,
      browserEngineVersion: ua.getEngine().version,
      os: ua.getOS().name,
      osVersion: ua.getOS().version,
      osType: ua.getDevice().type,
      device: ua.getDevice().model,
      deviceType: ua.getDevice().type,
      deviceVendor: ua.getDevice().vendor,
      cpuArchitecture: ua.getCPU().architecture,
      referrer: referrer,
      headers: headersString,
      ...ipInfo,
      pelFileName,
    };

    await postAnalyticsData(analyticsData);

    return new Response(onePixelBuffer, { headers: onePixelHeaders });
  })
  .listen(PORT);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

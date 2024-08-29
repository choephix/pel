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
  const response = await fetch(`http://ip-api.com/json/${ip}`);
  return await response.json();
}

const app = new Elysia()
  .use(ip())
  .get('/', () => 'Hello Elysia')
  .get('/pixel.gif',async req => {
    const ip = req.ip;
    const referrer = req.headers['referer'] || 'Direct';

    const ua = new UAParser(req.headers['user-agent']);

    const ipInfo = await getIpInfo(ip);

    const headersString = Object.entries(req.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

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
    };

    console.log(analyticsData);

    return new Response(onePixelBuffer, { headers: onePixelHeaders });
  })
  .listen(PORT);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

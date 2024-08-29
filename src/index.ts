import { Elysia } from 'elysia';

const onePixelGif = 'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
const onePixelBuffer = Buffer.from(onePixelGif, 'base64');
const onePixelHeaders = {
  'Content-Type': 'image/gif',
  'Content-Length': onePixelBuffer.length.toString(),
};

const app = new Elysia()
  .get('/', () => 'Hello Elysia')
  .get('/pixel.gif', () => {
    return new Response(onePixelBuffer, { headers: onePixelHeaders });
  })
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export const onRequest = () =>
  Response.json({ message: 'Cloudflare API 경로를 찾을 수 없습니다.' }, { status: 404 });

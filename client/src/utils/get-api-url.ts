export function getApiBaseURL(): string {
  const isLocalhost = import.meta.url.match('//localhost');
  const isPublicIP = import.meta.url.match(/\/\/(\d+\.\d+\.\d+\.\d+)/);

  return isLocalhost
    ? // running npm run dev
      'http://localhost:3000'
    : // running npx serve -s dist -p 5173
    isPublicIP
    ? `http://${isPublicIP[1]}`
    : // from domain(production)
      '.';
}

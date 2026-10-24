const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;

  const path = url.replace(/^\/+/, "");
  return API_BASE_URL ? `${API_BASE_URL.replace(/\/+$/, "")}/${path}` : url;
}

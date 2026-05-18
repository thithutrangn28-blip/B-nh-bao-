// simple fingerprint generator
function getDeviceFingerprint(): string {
  // Try to use a persistent random string from localStorage if possible
  // so it persists across reloads of the same browser
  let fp = localStorage.getItem('__apihub_fp_seed');
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem('__apihub_fp_seed', fp);
  }
  return fp;
}

export async function encryptApiKey(plainKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainKey);
  
  const seed = encoder.encode(getDeviceFingerprint());
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    seed.slice(0, 32),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  const payload = {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
  return JSON.stringify(payload);
}

export async function decryptApiKey(encryptedPayload: string): Promise<string> {
  try {
    const payload = JSON.parse(encryptedPayload);
    const encryptedBytes = Uint8Array.from(atob(payload.encrypted), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
    
    const encoder = new TextEncoder();
    const seed = encoder.encode(getDeviceFingerprint());
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      seed.slice(0, 32),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decryptedUrl = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedBytes
    );
    return new TextDecoder().decode(decryptedUrl);
  } catch (e) {
    console.error('Failed to decrypt API Key', e);
    return '';
  }
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '•'.repeat(8);
  return `${key.slice(0, 3)}${'•'.repeat(20)}${key.slice(-3)}`;
}

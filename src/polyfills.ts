// polyfills.ts - Polyfills para Node.js v18 en Railway
import * as crypto from 'crypto';

// Polyfill para crypto global
if (!globalThis.crypto) {
  // @ts-ignore - Ignorar errores de tipo para compatibilidad
  globalThis.crypto = crypto;
}

// Polyfill para randomUUID si no existe
if (!crypto.randomUUID) {
  // @ts-ignore - Ignorar error de readonly
  crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

// Asegurar que crypto esté disponible globalmente
if (!global.crypto) {
  // @ts-ignore - Ignorar errores de tipo para compatibilidad
  global.crypto = crypto;
}

export {}; 
// Function to generate a random encryption key
const generateKey = async () => {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
};

// Function to export the key to a string
const exportKey = async (key) => {
  const exported = await window.crypto.subtle.exportKey(
    "raw",
    key
  );
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

// Function to import the key from a string
const importKey = async (keyString) => {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return window.crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
};

// Function to encrypt data
export const encryptData = async (data) => {
  try {
    const key = await generateKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encodedData
    );

    const exportedKey = await exportKey(key);
    
    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
      iv: btoa(String.fromCharCode(...iv)),
      key: exportedKey
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Function to decrypt data
export const decryptData = async (encryptedData) => {
  try {
    const key = await importKey(encryptedData.key);
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    const encrypted = Uint8Array.from(atob(encryptedData.encrypted), c => c.charCodeAt(0));

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encrypted
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}; 
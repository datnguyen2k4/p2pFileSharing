import os from 'os';

export function getPrivateIP(): string {
  const networkInterfaces = os.networkInterfaces();

  // Loop through all network interfaces
  for (const [interfaceName, addresses] of Object.entries(networkInterfaces)) {
    if (interfaceName.toLowerCase().includes('wi-fi') && addresses) {
      // Check each address for the Wi-Fi adapter
      for (const address of addresses) {
        if (address.family === 'IPv4' && !address.internal) {
          return address.address; // Return the IPv4 address
        }
      }
    }
  }

  return 'No Wi-Fi private IP found';
}

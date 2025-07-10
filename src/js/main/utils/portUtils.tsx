import { net } from "../../lib/cep/node";

/**
 * Checks if a specific port is available on localhost
 * @param port - The port number to check
 * @returns Promise<boolean> - true if port is available, false if in use
 */
export async function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, '127.0.0.1', () => {
            server.close(() => {
                resolve(true);
            });
        });
        
        server.on('error', () => {
            resolve(false);
        });
    });
}

/**
 * Finds the next available port starting from a base port
 * @param startPort - The port to start checking from (default: 8080)
 * @param maxPort - The maximum port to check (default: 8090)
 * @returns Promise<number> - The first available port found
 */
export async function findAvailablePort(startPort: number = 8080, maxPort: number = 8090): Promise<number> {
    for (let port = startPort; port <= maxPort; port++) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    
    // If no port found in range, throw error
    throw new Error(`No available ports found between ${startPort} and ${maxPort}`);
}

/**
 * Tests connection to a specific port
 * @param port - The port to test connection to
 * @param timeout - Connection timeout in milliseconds (default: 3000)
 * @returns Promise<boolean> - true if connection successful, false otherwise
 */
export async function testConnection(port: number, timeout: number = 3000): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let resolved = false;
        
        const onConnect = () => {
            if (!resolved) {
                resolved = true;
                socket.destroy();
                resolve(true);
            }
        };
        
        const onError = () => {
            if (!resolved) {
                resolved = true;
                socket.destroy();
                resolve(false);
            }
        };
        
        const onTimeout = () => {
            if (!resolved) {
                resolved = true;
                socket.destroy();
                resolve(false);
            }
        };
        
        socket.setTimeout(timeout);
        socket.on('connect', onConnect);
        socket.on('error', onError);
        socket.on('timeout', onTimeout);
        
        socket.connect(port, '127.0.0.1');
    });
}

/**
 * Gets the stored port from localStorage or returns default
 * @param defaultPort - Default port if none stored (default: 8080)
 * @returns number - The port number to use
 */
export function getStoredPort(defaultPort: number = 8080): number {
    try {
        const stored = localStorage.getItem('tas_socket_port');
        if (stored) {
            const port = parseInt(stored, 10);
            if (port >= 1024 && port <= 65535) {
                return port;
            }
        }
    } catch (error) {
        console.warn('Failed to get stored port:', error);
    }
    return defaultPort;
}

/**
 * Stores the successful port in localStorage
 * @param port - The port number to store
 */
export function storePort(port: number): void {
    try {
        localStorage.setItem('tas_socket_port', port.toString());
    } catch (error) {
        console.warn('Failed to store port:', error);
    }
}

/**
 * Clears the stored port from localStorage
 */
export function clearStoredPort(): void {
    try {
        localStorage.removeItem('tas_socket_port');
    } catch (error) {
        console.warn('Failed to clear stored port:', error);
    }
}

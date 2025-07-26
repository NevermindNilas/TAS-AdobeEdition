// #!/usr/bin/env node
import { child_process, path, util } from "../../lib/cep/node";

const sh = util.promisify(child_process.exec);

interface DiskUsage {
    free: number;
    size: number;
}

function getSystemDrive(): string {
    if (process.platform === 'win32') {
        // fall back to “C:” if env vars are missing
        return (process.env.SystemDrive ||
            path.parse(process.env.SystemRoot || 'C:\\').root)
            .replace(/\\?$/, ''); // -> "C:"
    }
    return '/';
}

async function getDiskUsage(drive: string): Promise<DiskUsage> {
    if (process.platform === 'win32') {
        const psCommand = `powershell -Command "Get-CimInstance -ClassName Win32_LogicalDisk -Filter \\"DeviceID='${drive}'\\" | Select-Object FreeSpace,Size | ConvertTo-Json"`;
        const { stdout } = await sh(psCommand);
        let free = 0, size = 0;
        try {
            const result = JSON.parse(stdout);
            if (Array.isArray(result)) {
                free = Number(result[0]?.FreeSpace);
                size = Number(result[0]?.Size);
            } else if (typeof result === 'object' && result !== null) {
                free = Number(result.FreeSpace);
                size = Number(result.Size);
            }
        } catch {
            throw new Error('PowerShell parse failure');
        }
        if (!Number.isFinite(free) || !Number.isFinite(size)) {
            throw new Error('PowerShell parse failure');
        }
        return { free, size };
    }

    const { stdout } = await sh(`df -kP ${drive} | tail -1`);
    const [, blocks, , avail] = stdout.trim().split(/\s+/);
    return {
        free: Number(avail) * 1024,
        size: Number(blocks) * 1024,
    };
}

export async function checkDiskSpace(): Promise<{ drive: string; free: number; size: number }> {
    const drive = getSystemDrive();
    const { free, size } = await getDiskUsage(drive);
    return { drive, free, size };
}

if (require.main === module) {
    (async () => {
        try {
            const { drive, free, size } = await checkDiskSpace();
            const gib = (n: number): string => (n / 1_073_741_824).toFixed(1);
            console.log(`${drive} — ${gib(free)} GiB free / ${gib(size)} GiB total`);
        } catch (err: any) {
            console.error('Unable to read system-disk space:', err.message);
            process.exitCode = 1;
        }
    })();
}

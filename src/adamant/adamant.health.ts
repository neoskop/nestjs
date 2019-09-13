import { AdamantConnectionManager } from '@neoskop/adamant';
import { Injectable } from '@nestjs/common';
import { HealthIndicator } from '@nestjs/terminus';

const TIMEOUT = Symbol.for('Timeout');

@Injectable()
export class AdamantHealthIndicator extends HealthIndicator {
    constructor(protected readonly manager : AdamantConnectionManager) {
        super();
    }

    async pingCheck(key: string, { timeout = 1000 }: { timeout?: number } = {}) {
        let isHealthy = true;
        const info : { [key: string]: boolean } = {}
        for(const conn of this.manager.getOpenConnections()) {
            let isConnectionHealthy : boolean;
            try {
                const res = await this.timeout(conn.info(), timeout)
                isConnectionHealthy = res !== TIMEOUT;
            } catch {
                isConnectionHealthy = false;
            }
            info[conn.name] = isConnectionHealthy;
            isHealthy = isHealthy && isConnectionHealthy;
        }

        return this.getStatus(key, isHealthy, info);
    }

    private timeout<T>(promise : Promise<T>, timeout : number) : Promise<T|typeof TIMEOUT> {
        return Promise.race([
            promise,
            new Promise<typeof TIMEOUT>(resolve => {
                setTimeout(() => resolve(TIMEOUT), timeout)
            })
        ])
    }
}
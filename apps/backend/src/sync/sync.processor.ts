import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SyncService } from './sync.service';

export const SYNC_QUEUE = 'sync';

@Processor(SYNC_QUEUE)
export class SyncProcessor extends WorkerHost {
  constructor(private readonly syncService: SyncService) {
    super();
  }

  async process(job: Job<{ type: string; providerId?: string }>): Promise<void> {
    switch (job.data.type) {
      case 'daily-sync':
        await this.syncService.runDailySync(job.data.providerId);
        break;
      case 'availability-verify':
        await this.syncService.runAvailabilityVerify();
        break;
      case 'cleanup-expired':
        await this.syncService.runCleanupExpired();
        break;
    }
  }
}

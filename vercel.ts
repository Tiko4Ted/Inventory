import { type VercelConfig } from '@vercel/config/v1'

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'pnpm --filter @pharmacy/api build',
  crons: [
    { path: '/api/jobs/reminders', schedule: '0 7 * * *' },
    { path: '/api/jobs/cleanup', schedule: '30 2 * * *' },
  ],
}

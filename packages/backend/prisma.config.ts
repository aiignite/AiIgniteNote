import { PrismaConfig } from '@prisma/engine-scripts'

const config: PrismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}

export default config

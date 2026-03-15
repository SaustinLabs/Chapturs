
import { prisma } from './src/lib/database/PrismaService.ts'
import fs from 'fs'

// Manually load .env if it exists for the test script
if (fs.existsSync('.env')) {
  const env = fs.readFileSync('.env', 'utf8')
  env.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
  })
}

async function test() {
  try {
    console.log('Environment Check:')
    console.log(`DATABASE_URL defined: ${!!process.env.DATABASE_URL}`)
    console.log(`DIRECT_URL defined: ${!!process.env.DIRECT_URL}`)
    
    console.log('Testing database connection...')
    const userCount = await prisma.user.count()
    console.log(`Success! User count: ${userCount}`)
  } catch (error) {
    console.error('Database connection failed:', error)
  } finally {
    process.exit()
  }
}

test()

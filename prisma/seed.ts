import 'dotenv/config'
import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log(`Start seeding ...`)

  // 1. Create Plans
  const plans = [
    { name: 'FREE', price: 0, stripePriceId: 'price_free_dummy' },
    { name: 'BASIC', price: 9, stripePriceId: 'price_basic_dummy' },
    { name: 'PRO', price: 15, stripePriceId: 'price_pro_dummy' },
    { name: 'GLOBAL', price: 29, stripePriceId: 'price_global_dummy' },
  ]
  
  for (const p of plans) {
    await prisma.plan.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    })
  }

  // 2. Create Templates
  const templates = [
    { name: 'Modern', isPremium: false },
    { name: 'Classic', isPremium: true },
    { name: 'Executive', isPremium: true },
    { name: 'Minimal', isPremium: true },
    { name: 'Creative', isPremium: true },
    { name: 'ATS Friendly', isPremium: true },
    { name: 'European CV', isPremium: true },
    { name: 'German Lebenslauf', isPremium: true },
    { name: 'French CV', isPremium: true },
    { name: 'Japanese Rirekisho', isPremium: true },
    { name: 'Spanish CV', isPremium: true },
    { name: 'Portuguese CV', isPremium: true },
  ]

  for (const t of templates) {
    await prisma.template.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    })
  }

  // 3. Create Languages
  const languages = [
    { code: 'en', name: 'English', isPremium: false },
    { code: 'de', name: 'German', isPremium: true },
    { code: 'fr', name: 'French', isPremium: true },
    { code: 'ja', name: 'Japanese', isPremium: true },
    { code: 'zh', name: 'Chinese', isPremium: true },
    { code: 'pt', name: 'Portuguese', isPremium: true },
    { code: 'es', name: 'Spanish', isPremium: true },
  ]

  for (const l of languages) {
    await prisma.language.upsert({
      where: { code: l.code },
      update: {},
      create: l,
    })
  }

  // 4. Create Users (Admin & Demo)
  const hashedAdminPassword = await bcrypt.hash('Admin@12345', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@globalresumeai.com' },
    update: { hashedPassword: hashedAdminPassword, role: 'ADMIN' },
    create: {
      email: 'admin@globalresumeai.com',
      name: 'Admin User',
      hashedPassword: hashedAdminPassword,
      role: 'ADMIN',
    },
  })
  // Ensure admin has a FREE subscription
  const adminSub = await prisma.subscription.findUnique({ where: { userId: adminUser.id } })
  if (!adminSub) {
    const freePlan = await prisma.plan.findUnique({ where: { name: 'FREE' } })
    if (freePlan) {
      await prisma.subscription.create({ data: { userId: adminUser.id, status: 'active', planId: freePlan.id } })
    }
  }

  const hashedDemoPassword = await bcrypt.hash('Demo@12345', 12)
  await prisma.user.upsert({
    where: { email: 'demo@globalresumeai.com' },
    update: { hashedPassword: hashedDemoPassword },
    create: {
      email: 'demo@globalresumeai.com',
      name: 'Demo User',
      hashedPassword: hashedDemoPassword,
      role: 'USER',
      subscription: {
        create: {
          status: 'active',
          plan: { connect: { name: 'FREE' } }
        }
      }
    },
  })

  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

// Cambia la contraseña de un admin directo en la base.
// Uso: DATABASE_URL=... ADMIN_PASSWORD=... npm run admin:password [email]
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] ?? 'admin@prometeo.com'
  const password = process.env.ADMIN_PASSWORD
  if (!password || password.length < 12) {
    throw new Error('Definí ADMIN_PASSWORD (mínimo 12 caracteres)')
  }

  const user = await prisma.user.update({
    where: { email },
    data: { password: await bcrypt.hash(password, 10) },
  })
  console.log(`✓ Contraseña actualizada para ${user.email}`)
}

main()
  .catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

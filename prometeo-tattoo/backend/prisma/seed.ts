import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('[seed] Iniciando seed de base de datos...')

  // Categorías
  const tintas = await prisma.category.upsert({
    where: { slug: 'tintas' },
    update: {},
    create: { name: 'Tintas', slug: 'tintas', image: 'https://picsum.photos/seed/tintas/400/300' },
  })
  const agujas = await prisma.category.upsert({
    where: { slug: 'agujas' },
    update: {},
    create: { name: 'Agujas', slug: 'agujas', image: 'https://picsum.photos/seed/agujas/400/300' },
  })
  const maquinas = await prisma.category.upsert({
    where: { slug: 'maquinas' },
    update: {},
    create: { name: 'Máquinas', slug: 'maquinas', image: 'https://picsum.photos/seed/maquinas/400/300' },
  })
  const fuentes = await prisma.category.upsert({
    where: { slug: 'fuentes-de-poder' },
    update: {},
    create: { name: 'Fuentes de poder', slug: 'fuentes-de-poder', image: 'https://picsum.photos/seed/fuentes/400/300' },
  })
  const grips = await prisma.category.upsert({
    where: { slug: 'grips-tips' },
    update: {},
    create: { name: 'Grips & Tips', slug: 'grips-tips', image: 'https://picsum.photos/seed/grips/400/300' },
  })
  const transfer = await prisma.category.upsert({
    where: { slug: 'transfer-stencil' },
    update: {},
    create: { name: 'Transfer & Stencil', slug: 'transfer-stencil', image: 'https://picsum.photos/seed/transfer/400/300' },
  })
  const aftercare = await prisma.category.upsert({
    where: { slug: 'aftercare' },
    update: {},
    create: { name: 'Aftercare', slug: 'aftercare', image: 'https://picsum.photos/seed/aftercare/400/300' },
  })
  const mobiliario = await prisma.category.upsert({
    where: { slug: 'mobiliario' },
    update: {},
    create: { name: 'Mobiliario', slug: 'mobiliario', image: 'https://picsum.photos/seed/mobiliario/400/300' },
  })
  const accesorios = await prisma.category.upsert({
    where: { slug: 'accesorios' },
    update: {},
    create: { name: 'Accesorios', slug: 'accesorios', image: 'https://picsum.photos/seed/accesorios/400/300' },
  })
  const joyeria = await prisma.category.upsert({
    where: { slug: 'joyeria-piercings' },
    update: {},
    create: { name: 'Joyería & Piercings', slug: 'joyeria-piercings', image: 'https://picsum.photos/seed/joyeria/400/300' },
  })

  console.log('[seed] ✓ 10 categorías creadas')

  const productos = [
    // TINTAS
    {
      name: 'Eternal Ink — Set de Negros Profesional',
      slug: 'eternal-ink-set-negros',
      description: 'Set de 6 tintas negras de distintas densidades. Fórmula vegana, no tóxica. Ideal para líneas y rellenos. La elección de profesionales en todo el mundo.',
      price: 139900,
      comparePrice: null,
      onSale: false,
      stock: 50,
      images: ['https://cdn.shopify.com/s/files/1/1898/6511/files/Eternal-Ink-E02-TripleBlack-1oz.jpg'],
      brand: 'Eternal Ink',
      featured: true,
      categoryId: tintas.id,
    },
    {
      name: 'Eternal Ink — Color Set Vibrante 12 Tintas',
      slug: 'eternal-ink-color-set-12',
      description: 'Set completo de 12 colores vibrantes listos para usar. Alta pigmentación, excelente retención en piel. Colores que no destiñen con el tiempo.',
      price: 279900,
      comparePrice: null,
      onSale: true,
      stock: 30,
      images: ['https://picsum.photos/seed/eternal-color/600/450'],
      brand: 'Eternal Ink',
      featured: false,
      categoryId: tintas.id,
    },
    {
      name: 'Eternal Ink — Skin Tones Collection',
      slug: 'eternal-ink-skin-tones',
      description: 'Colección especializada en tonos de piel. Perfecta para retratos y realismo. 8 tonos cuidadosamente formulados para mezclar.',
      price: 184900,
      comparePrice: null,
      onSale: false,
      stock: 20,
      images: ['https://picsum.photos/seed/eternal-skin/600/450'],
      brand: 'Eternal Ink',
      featured: false,
      categoryId: tintas.id,
    },
    {
      name: 'Dynamic Black — Tinta Negra 1oz',
      slug: 'dynamic-black-1oz',
      description: 'La tinta negra más usada en el mundo. Pigmentación máxima, fluidez perfecta. Ideal para Black & Grey y líneas definidas. 1oz (30ml).',
      price: 19900,
      comparePrice: null,
      onSale: false,
      stock: 120,
      images: ['https://picsum.photos/seed/dynamic-black/600/450'],
      brand: 'Dynamic',
      featured: false,
      categoryId: tintas.id,
    },
    {
      name: 'Dynamic Triple Black — Tinta Negra 4oz',
      slug: 'dynamic-triple-black-4oz',
      description: 'Versión concentrada de la clásica Dynamic Black. 4oz de tinta de máxima intensidad. Para sombreados profundos y rellenos sólidos.',
      price: 44900,
      comparePrice: null,
      onSale: true,
      stock: 45,
      images: ['https://picsum.photos/seed/dynamic-triple/600/450'],
      brand: 'Dynamic',
      featured: true,
      categoryId: tintas.id,
    },
    // MÁQUINAS
    {
      name: 'Cheyenne Hawk Pen — Máquina Rotativa',
      slug: 'cheyenne-hawk-pen',
      description: 'Máquina rotativa de precisión alemana. Motor sin escobillas, vibración mínima. Compatible con cartuchos Cheyenne y universales. El estándar de la industria.',
      price: 1199900,
      comparePrice: null,
      onSale: false,
      stock: 15,
      images: ['https://cdn.shopify.com/s/files/1/0823/5902/5995/files/HAWK-Pen-silver_CB-5.10-S.jpg'],
      brand: 'Cheyenne',
      featured: true,
      categoryId: maquinas.id,
    },
    {
      name: 'FK Irons Spektra Xion — Rotativa Premium',
      slug: 'fk-irons-spektra-xion',
      description: 'Motor Faulhaber de alta precisión. Stroke ajustable de 2.5mm a 4.2mm. Diseño ergonómico, peso ultraligero. Para artistas que exigen lo mejor.',
      price: 1729900,
      comparePrice: null,
      onSale: false,
      stock: 10,
      images: ['https://cdn.shopify.com/s/files/1/0024/3164/7803/products/Stealth-1.png'],
      brand: 'FK Irons',
      featured: true,
      categoryId: maquinas.id,
    },
    {
      name: 'Bishop Fantom Rotary 3.5mm',
      slug: 'bishop-rotary-v6',
      description: 'Rotativa de alta gama con motor DC de largo ciclo de vida. Grip intercambiable, compatible con todos los cartuchos. Edición con acabado gunmetal.',
      price: 1329900,
      comparePrice: null,
      onSale: false,
      stock: 8,
      images: ['https://cdn.shopify.com/s/files/1/1723/7747/products/fantom1_2000x_e9dbecf4-7472-4636-a5ad-b5fb63f992d0.jpg'],
      brand: 'Bishop',
      featured: false,
      categoryId: maquinas.id,
    },
    {
      name: 'Bishop Power Wand XLUMEN — Set completo',
      slug: 'bishop-wand-wireless',
      description: 'Máquina inalámbrica con batería de 8 horas. Carga rápida USB-C. Pantalla OLED integrada con voltaje y batería. Liberate del cable.',
      price: 3599900,
      comparePrice: null,
      onSale: true,
      stock: 12,
      images: ['https://cdn.shopify.com/s/files/1/1723/7747/files/XLUMEN-SHADER-POWER-WAND-PRODUCT-SHOTS-1.jpg'],
      brand: 'Bishop',
      featured: true,
      categoryId: maquinas.id,
    },
    {
      name: 'Bishop Wand 3.5 Pen',
      slug: 'bishop-wand-35-pen',
      description: 'La nueva generación de máquinas Bishop. Motor sin escobillas, grip 3.5mm, compatible con todos los cartuchos. Diseño minimalista y funcional.',
      price: 98000,
      comparePrice: null,
      onSale: false,
      stock: 6,
      images: ['https://picsum.photos/seed/bishop-wand35/600/450'],
      brand: 'Bishop',
      featured: false,
      categoryId: maquinas.id,
    },
    // AGUJAS
    {
      name: 'Cheyenne Cartridge Needles — Round Liner 10',
      slug: 'cheyenne-cartridge-rl-10',
      description: 'Cartuchos de agujas Round Liner 10. Membrana de seguridad integrada. Punta ultra-fina, configuración tight. Caja de 20 unidades.',
      price: 50900,
      comparePrice: null,
      onSale: false,
      stock: 200,
      images: ['https://cdn.shopify.com/s/files/1/0823/5902/5995/files/Master_Liner_0.40_Safety_Cartridges.png'],
      brand: 'Cheyenne',
      featured: false,
      categoryId: agujas.id,
    },
    {
      name: 'Kwadron Cartridges — Magnum Curved 15',
      slug: 'kwadron-magnum-curved',
      description: 'Cartuchos Magnum Curved para sombreado y rellenos suaves. 15 agujas curvadas. Configuración medium taper. Caja de 20 unidades.',
      price: 70900,
      comparePrice: null,
      onSale: false,
      stock: 150,
      images: ['https://picsum.photos/seed/kwadron/600/450'],
      brand: 'Kwadron',
      featured: false,
      categoryId: agujas.id,
    },
    {
      name: 'Kwadron Round Shader — 9RS',
      slug: 'kwadron-round-shader-9',
      description: 'Cartuchos Round Shader 9. Ideales para sombreado y color packing. Membrana de retención. Caja 20 unidades.',
      price: 70900,
      comparePrice: null,
      onSale: false,
      stock: 180,
      images: ['https://picsum.photos/seed/kwadron-rs/600/450'],
      brand: 'Kwadron',
      featured: false,
      categoryId: agujas.id,
    },
    // FUENTES
    {
      name: 'Critical AtomX2 — Fuente de poder',
      slug: 'critical-cx2-power-supply',
      description: 'Fuente de poder digital de alta precisión. Pantalla táctil, memoria de 5 perfiles. Salida 0-18V estabilizada. Compatible con todas las máquinas.',
      price: 544900,
      comparePrice: null,
      onSale: false,
      stock: 25,
      images: ['https://picsum.photos/seed/critical-power/600/450'],
      brand: 'Critical',
      featured: true,
      categoryId: fuentes.id,
    },
    {
      name: 'FK Irons Flux Max + 2 PowerBolt II — Inalámbrica',
      slug: 'fk-irons-flux-max',
      description: 'Máquina pen inalámbrica con 2 baterías PowerBolt II intercambiables. Stroke ajustable, motor de alta precisión. Lista para tatuar sin cables.',
      price: 3039900,
      comparePrice: null,
      onSale: true,
      stock: 18,
      images: ['https://cdn.shopify.com/s/files/1/0024/3164/7803/products/Flux-Max-Bubblegum-3.png'],
      brand: 'FK Irons',
      featured: false,
      categoryId: fuentes.id,
    },
    // AFTERCARE
    {
      name: 'Hustle Butter Deluxe — 5oz',
      slug: 'hustle-butter-deluxe-5oz',
      description: 'El lubricante y aftercare más utilizado a nivel mundial. Fórmula 100% natural. Acelera la cicatrización, mantiene los colores vibrantes. Sin petrolato.',
      price: 49900,
      comparePrice: null,
      onSale: false,
      stock: 100,
      images: ['https://cdn.shopify.com/s/files/1/0279/2620/0368/files/Balm_5-oz_Lid_On_d1ec4d87-9bb9-41b8-9643-f6fbda371b0d.png'],
      brand: 'Hustle Butter',
      featured: false,
      categoryId: aftercare.id,
    },
    {
      name: 'Recovery Derm Shield — Sheet Pack 15x20cm',
      slug: 'recovery-derm-shield-50',
      description: 'Film protector para tatuajes recién hechos. Transpirable, impermeable. Mantiene la humedad natural de la piel. Pack de 50 unidades 4x6 pulgadas.',
      price: 33900,
      comparePrice: null,
      onSale: false,
      stock: 60,
      images: ['https://cdn.shopify.com/s/files/1/0605/8734/4119/products/Med-201_1_1000px.jpg'],
      brand: 'Recovery',
      featured: false,
      categoryId: aftercare.id,
    },
    // GRIPS
    {
      name: 'Cheyenne Hawk Grip — 25mm',
      slug: 'cheyenne-hawk-grip-25',
      description: 'Grip oficial Cheyenne para Hawk Pen. Diámetro 25mm, agarre ergonómico antideslizante. Material grip rubber de alta densidad. Esterilizable en autoclave.',
      price: 69900,
      comparePrice: null,
      onSale: false,
      stock: 40,
      images: ['https://cdn.shopify.com/s/files/1/0823/5902/5995/files/HAWK_Pen_Grips_Master_1.jpg'],
      brand: 'Cheyenne',
      featured: false,
      categoryId: grips.id,
    },
    // TRANSFER
    {
      name: 'Spirit Transfer Paper — 100 Hojas A4',
      slug: 'spirit-transfer-paper-100',
      description: 'El papel de transferencia más usado por tatuadores profesionales. 100 hojas A4, compatible con máquinas térmicas y método manual.',
      price: 144900,
      comparePrice: null,
      onSale: false,
      stock: 60,
      images: ['https://picsum.photos/seed/spirit-paper/600/450'],
      brand: 'Spirit',
      featured: false,
      categoryId: transfer.id,
    },
    {
      name: 'Stencil Stuff — Transfer Solution 4oz',
      slug: 'stencil-stuff-4oz',
      description: 'Solución para transferencia de stencil. Agarre superior al agua con jabón. Secado rápido, no mancha. La preferida por artistas de todo el mundo.',
      price: 25900,
      comparePrice: null,
      onSale: false,
      stock: 80,
      images: ['https://picsum.photos/seed/stencil-stuff/600/450'],
      brand: 'Stencil Stuff',
      featured: false,
      categoryId: transfer.id,
    },
    // JOYERÍA
    {
      name: 'Aro Septum — Acero Quirúrgico 316L',
      slug: 'aro-septum-acero-316l',
      description: 'Aro de septum en acero quirúrgico 316L. Hipoalergénico, apto para pieles sensibles. Cierre a presión. Diámetro interno 8mm, grosor 1.2mm.',
      price: 4900,
      comparePrice: null,
      onSale: false,
      stock: 80,
      images: ['https://picsum.photos/seed/septum/600/450'],
      brand: 'Prometeo Jewelry',
      featured: false,
      categoryId: joyeria.id,
    },
    {
      name: 'Expansor Acrílico — 10mm',
      slug: 'expansor-acrilico-10mm',
      description: 'Expansor de oreja en acrílico premium. Color negro mate. Par incluido. Disponible en tamaño 10mm (00g). Fácil de limpiar.',
      price: 4500,
      comparePrice: null,
      onSale: false,
      stock: 120,
      images: ['https://picsum.photos/seed/expansor/600/450'],
      brand: 'Prometeo Jewelry',
      featured: false,
      categoryId: joyeria.id,
    },
    {
      name: 'Anillo Segment Clicker — Dorado 18k',
      slug: 'anillo-segment-clicker-dorado',
      description: 'Anillo segment clicker bañado en oro 18k. Acero quirúrgico base, recubrimiento PVD. Sin plomo ni níquel. Cierre de bisagra. Diámetro 8mm.',
      price: 8900,
      comparePrice: null,
      onSale: true,
      stock: 50,
      images: ['https://picsum.photos/seed/clicker/600/450'],
      brand: 'Prometeo Jewelry',
      featured: true,
      categoryId: joyeria.id,
    },
    {
      name: 'Arito Opalo Sintético — Titanio G23',
      slug: 'arito-opalo-sintetico-titanio',
      description: 'Arito de helix en titanio G23 con opalo sintético. Anodizado en colores. Rosca interna. Apto para pieles sensibles. Incluye 2 unidades.',
      price: 24900,
      comparePrice: null,
      onSale: false,
      stock: 35,
      images: ['https://picsum.photos/seed/opalo/600/450'],
      brand: 'Prometeo Jewelry',
      featured: true,
      categoryId: joyeria.id,
    },
    {
      name: 'Piercing Labret Flat Back — Pack x5',
      slug: 'piercing-labret-flat-back-pack',
      description: 'Pack de 5 piercings labret flat back en acero quirúrgico. Largo 6mm, grosor 1.2mm. Cabeza plana, ideal para nose, labio, helix. Distintos colores.',
      price: 11900,
      comparePrice: null,
      onSale: false,
      stock: 90,
      images: ['https://picsum.photos/seed/labret/600/450'],
      brand: 'Prometeo Jewelry',
      featured: false,
      categoryId: joyeria.id,
    },
  ]

  let created = 0
  for (const producto of productos) {
    await prisma.product.upsert({
      where: { slug: producto.slug },
      update: {},
      create: producto,
    })
    created++
  }

  console.log(`[seed] ✓ ${created} productos creados`)

  // Admin user — la contraseña nunca va en el repo, se pasa por env
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('[seed] Definí ADMIN_PASSWORD (mínimo 12 caracteres) antes de correr el seed')
  }
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  await prisma.user.upsert({
    where: { email: 'admin@prometeo.com' },
    update: {},
    create: {
      email: 'admin@prometeo.com',
      password: hashedPassword,
      name: 'Admin Prometeo',
      role: 'ADMIN',
    },
  })
  console.log('[seed] ✓ Admin: admin@prometeo.com')

  // Store config
  const configs = [
    { key: 'store_name', value: 'Prometeo Tattoo' },
    { key: 'store_description', value: 'Insumos profesionales para tatuadores' },
    { key: 'store_phone', value: '+54 9 11 3905-0618' },
    { key: 'store_email', value: 'prometeo.tatto@gmail.com' },
    { key: 'store_address', value: 'Arturo Jauretche 1001, B1686 Hurlingham' },
    { key: 'free_shipping_threshold', value: '15000' },
    { key: 'shipping_cost', value: '3500' },
    { key: 'currency', value: 'ARS' },
    { key: 'instagram_url', value: 'https://www.instagram.com/prometeo.tattoo' },
    { key: 'whatsapp_number', value: '541139050618' },
    { key: 'announcement_bar', value: 'Envío gratis en compras mayores a $15.000' },
  ]
  for (const cfg of configs) {
    await prisma.storeConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value },
      create: cfg,
    })
  }
  console.log('[seed] ✓ Store config cargada')

  console.log(`[seed] Categorías extra: ${mobiliario.name}, ${accesorios.name}`)
  console.log('[seed] ✓ Seed completado exitosamente')
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

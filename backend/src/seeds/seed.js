/* eslint-disable no-console */
const mongoose = require('mongoose');
const env = require('../config/env');
const slugify = require('../utils/slugify');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const DeliveryPartner = require('../models/DeliveryPartner');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

const CATEGORIES = [
  { name: 'Fruits & Vegetables', icon: 'leaf', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300' },
  { name: 'Dairy & Bakery', icon: 'milk', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300' },
  { name: 'Atta, Rice & Dals', icon: 'wheat', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300' },
  { name: 'Snacks & Drinks', icon: 'cookie', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300' },
  { name: 'Eggs, Meat & Fish', icon: 'egg', image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=300' },
  { name: 'Cleaning & Household', icon: 'spray', image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300' },
  { name: 'Personal Care', icon: 'sparkles', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300' },
  { name: 'Sweets & Chocolates', icon: 'candy', image: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=300' },
];

const PRODUCTS_BY_CATEGORY = {
  'Fruits & Vegetables': [
    { name: 'fresho! Watermelon - Small', mrp: 99, price: 60, unit: '1 pc (approx 1.8 - 2.5 kg)', images: [
      'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=800',
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800',
      'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=800',
    ], isBestseller: true },
    { name: 'fresho! Cucumber', mrp: 29, price: 15, unit: '500 g', images: [
      'https://images.unsplash.com/photo-1568584711271-6c929fb49b60?w=800',
      'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=800',
    ] },
    { name: 'fresho! Local Tomato', mrp: 56, price: 34, unit: '1 kg', images: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
      'https://images.unsplash.com/photo-1546470427-227df1e3c84e?w=800',
      'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=800',
    ], isBestseller: true },
    { name: 'fresho! Safeda Mango', mrp: 137, price: 89, unit: '1 kg', images: [
      'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=800',
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800',
      'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=800',
    ], isFeatured: true },
    { name: 'fresho! Onion', mrp: 47, price: 27, unit: '1 kg', images: [
      'https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?w=800',
      'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=800',
    ] },
    { name: 'fresho! Potato', mrp: 70, price: 35, unit: '1 kg', images: [
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800',
      'https://images.unsplash.com/photo-1591019479261-1a103585c559?w=800',
    ] },
    { name: 'fresho! Tender Coconut', mrp: 118, price: 83.5, unit: '1 pc', images: [
      'https://images.unsplash.com/photo-1581375383680-903f6cef1d4f?w=800',
      'https://images.unsplash.com/photo-1581374820941-c4d6f2939c2d?w=800',
    ] },
    { name: 'fresho! Banana - Robusta', mrp: 79, price: 56, unit: '1 kg', images: [
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800',
      'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800',
      'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800',
    ] },
  ],
  'Dairy & Bakery': [
    { name: 'Mother Dairy Classic Dahi', mrp: 12, price: 10, unit: '80 g cup', images: [
      'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=800',
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800',
    ] },
    { name: 'Amul Gold Milk', mrp: 70, price: 66, unit: '1 L pouch', images: [
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800',
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800',
      'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800',
    ], isBestseller: true },
    { name: 'fresho! Farm Eggs - Regular', mrp: 350, price: 248, unit: '30 pcs', images: [
      'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800',
      'https://images.unsplash.com/photo-1569288063648-5dfd34b8e0f5?w=800',
      'https://images.unsplash.com/photo-1607690424560-35d967d6ad7d?w=800',
    ], isBestseller: true },
    { name: 'Britannia White Bread', mrp: 50, price: 45, unit: '400 g', images: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      'https://images.unsplash.com/photo-1568471173242-461f0a730452?w=800',
    ] },
    { name: 'Amul Butter Salted', mrp: 60, price: 58, unit: '100 g', images: [
      'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800',
      'https://images.unsplash.com/photo-1631374432898-1d0e10b95cf6?w=800',
    ] },
  ],
  'Atta, Rice & Dals': [
    { name: 'BB Royal Organic Sharbati Atta', mrp: 899, price: 506, unit: '10 kg', images: [
      'https://images.unsplash.com/photo-1568718247028-3d6f5a7d9f0f?w=800',
      'https://images.unsplash.com/photo-1574323347407-f5e1c1f1e30f?w=800',
    ], isOrganic: true, isFeatured: true },
    { name: 'India Gate Basmati Rice Classic', mrp: 1100, price: 879, unit: '5 kg', images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800',
      'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800',
      'https://images.unsplash.com/photo-1626016750062-db1577d8a01d?w=800',
    ] },
    { name: 'Tata Sampann Toor Dal', mrp: 220, price: 169, unit: '1 kg', images: [
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
      'https://images.unsplash.com/photo-1612257999691-c4e7c5cf4f38?w=800',
    ] },
    { name: 'Fortune Chana Dal', mrp: 160, price: 129, unit: '1 kg', images: [
      'https://images.unsplash.com/photo-1599909533733-4f0f5f3f7b3a?w=800',
      'https://images.unsplash.com/photo-1517022812141-23620dba5c23?w=800',
    ] },
  ],
  'Snacks & Drinks': [
    { name: 'Lays Classic Salted', mrp: 20, price: 18, unit: '52 g', images: [
      'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=800',
      'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=800',
    ] },
    { name: 'Coca-Cola Bottle', mrp: 40, price: 38, unit: '750 ml', images: [
      'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800',
      'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800',
      'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=800',
    ] },
    { name: 'Kurkure Masala Munch', mrp: 20, price: 18, unit: '85 g', images: [
      'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800',
      'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800',
    ] },
    { name: 'Real Mixed Fruit Juice', mrp: 110, price: 99, unit: '1 L', images: [
      'https://images.unsplash.com/photo-1600271886742-f049e6c9f0d4?w=800',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800',
    ] },
  ],
  'Eggs, Meat & Fish': [
    { name: 'fresho! Chicken Curry Cut', mrp: 320, price: 269, unit: '500 g', images: [
      'https://images.unsplash.com/photo-1604908554007-0a04ee2a6f87?w=800',
      'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800',
    ], isVeg: false },
    { name: 'fresho! Rohu Fish', mrp: 380, price: 299, unit: '500 g', images: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    ], isVeg: false },
  ],
  'Cleaning & Household': [
    { name: 'Harpic Power Plus 10x', mrp: 120, price: 95, unit: '500 ml', images: [
      'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800',
      'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800',
    ] },
    { name: 'Vim Dishwash Liquid Gel', mrp: 199, price: 165, unit: '750 ml', images: [
      'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800',
      'https://images.unsplash.com/photo-1583952018486-9b7c2e0e3f2e?w=800',
    ] },
    { name: 'Ariel Detergent Powder', mrp: 250, price: 199, unit: '1 kg', images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800',
      'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800',
    ] },
  ],
  'Personal Care': [
    { name: 'Colgate MaxFresh Toothpaste', mrp: 110, price: 99, unit: '150 g', images: [
      'https://images.unsplash.com/photo-1559591935-c6c92c6b2fe7?w=800',
      'https://images.unsplash.com/photo-1612538498488-fe1d2ac9d6d4?w=800',
    ] },
    { name: 'Dove Beauty Bar', mrp: 80, price: 65, unit: '100 g', images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
      'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=800',
    ] },
    { name: 'Head & Shoulders Shampoo', mrp: 199, price: 169, unit: '180 ml', images: [
      'https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=800',
      'https://images.unsplash.com/photo-1626015449611-5f3c0d5ddc49?w=800',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800',
    ] },
  ],
  'Sweets & Chocolates': [
    { name: 'Cadbury Dairy Milk Silk', mrp: 180, price: 150, unit: '150 g', images: [
      'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800',
      'https://images.unsplash.com/photo-1623660053975-cf75a8be0908?w=800',
      'https://images.unsplash.com/photo-1606312618919-3a5b3ddd03f2?w=800',
    ] },
    { name: 'Haldirams Soan Papdi', mrp: 220, price: 175, unit: '500 g', images: [
      'https://images.unsplash.com/photo-1606312618919-3a5b3ddd03f2?w=800',
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800',
    ] },
  ],
};

const SAMPLE_USERS = [
  { name: 'Aman Kumar', email: 'aman@example.com', phone: '7275924625', password: 'pass1234', role: 'customer' },
  { name: 'Riya Sharma', email: 'riya@example.com', phone: '9000000001', password: 'pass1234', role: 'customer' },
  { name: 'Karan Verma', email: 'karan@example.com', phone: '9000000002', password: 'pass1234', role: 'customer' },
];

const SAMPLE_DELIVERY = [
  { name: 'Rahul (Rider)', email: 'rahul.rider@example.com', phone: '9111100001', password: 'pass1234', vehicleType: 'bike', vehicleNumber: 'DL3CAB1234' },
  { name: 'Suresh (Rider)', email: 'suresh.rider@example.com', phone: '9111100002', password: 'pass1234', vehicleType: 'scooter', vehicleNumber: 'DL3CAB5678' },
];

async function run() {
  await mongoose.connect(env.MONGO_URI);
  console.log('[seed] connected to', env.MONGO_URI);

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    DeliveryPartner.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
  ]);
  console.log('[seed] cleared collections');

  const admin = await User.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    role: 'admin',
  });
  console.log(`[seed] admin: ${admin.email} / ${env.ADMIN_PASSWORD}`);

  const categoryDocs = await Category.insertMany(
    CATEGORIES.map((c, i) => ({ ...c, slug: slugify(c.name), order: i })),
  );
  const catBySlug = Object.fromEntries(categoryDocs.map((c) => [c.name, c]));
  console.log(`[seed] categories: ${categoryDocs.length}`);

  let productCount = 0;
  for (const [catName, list] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    const cat = catBySlug[catName];
    for (const p of list) {
      const slug = slugify(p.name);
      const images = Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []);
      await Product.create({
        name: p.name,
        slug,
        brand: p.name.split(' ')[0],
        description: `${p.name} — fresh, high-quality and delivered in 10 minutes. Sourced directly from trusted suppliers, hand-picked to ensure premium quality and packed with care.`,
        images,
        category: cat._id,
        unit: p.unit,
        price: p.price,
        mrp: p.mrp,
        stock: 50 + Math.floor(Math.random() * 100),
        isVeg: p.isVeg !== false,
        isOrganic: !!p.isOrganic,
        isBestseller: !!p.isBestseller,
        isFeatured: !!p.isFeatured,
        deliveryEtaMins: 10,
        rating: 4 + Math.random(),
        reviewCount: 50 + Math.floor(Math.random() * 200),
        sku: `SKU-${slug.slice(0, 12)}-${Math.floor(Math.random() * 9999)}`,
      });
      productCount += 1;
    }
  }
  console.log(`[seed] products: ${productCount}`);

  const customers = [];
  for (const u of SAMPLE_USERS) {
    const user = await User.create({
      ...u,
      addresses: [
        {
          label: 'Home',
          line1: 'Tower C3 1306',
          line2: 'Panchsheel Greens',
          city: 'Noida',
          state: 'UP',
          pincode: '201307',
          location: { type: 'Point', coordinates: [77.391, 28.535] },
          isDefault: true,
        },
      ],
    });
    customers.push(user);
  }
  console.log(`[seed] customers: ${customers.length}`);

  for (const d of SAMPLE_DELIVERY) {
    const u = await User.create({
      name: d.name,
      email: d.email,
      phone: d.phone,
      password: d.password,
      role: 'delivery',
    });
    await DeliveryPartner.create({
      user: u._id,
      vehicleType: d.vehicleType,
      vehicleNumber: d.vehicleNumber,
      currentLocation: { type: 'Point', coordinates: [77.39 + Math.random() * 0.02, 28.53 + Math.random() * 0.02] },
    });
  }
  console.log(`[seed] delivery partners: ${SAMPLE_DELIVERY.length}`);

  await Coupon.insertMany([
    { code: 'WELCOME50', description: '₹50 off on first order', type: 'flat', value: 50, minOrderValue: 199, usageLimit: 0 },
    { code: 'SAVE10', description: '10% off up to ₹100', type: 'percent', value: 10, minOrderValue: 299, maxDiscount: 100 },
    { code: 'FREESHIP', description: 'Flat ₹25 off (free delivery)', type: 'flat', value: 25, minOrderValue: 0 },
  ]);
  console.log('[seed] coupons seeded');

  // Synthesise some orders across the last 30 days for the dashboard charts.
  const allProducts = await Product.find();
  const statuses = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'delivered', 'delivered', 'cancelled'];
  for (let d = 29; d >= 0; d--) {
    const ordersToday = 2 + Math.floor(Math.random() * 6);
    for (let n = 0; n < ordersToday; n++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const itemCount = 1 + Math.floor(Math.random() * 4);
      const items = [];
      for (let i = 0; i < itemCount; i++) {
        const p = allProducts[Math.floor(Math.random() * allProducts.length)];
        const quantity = 1 + Math.floor(Math.random() * 3);
        items.push({
          product: p._id,
          name: p.name,
          image: p.images[0],
          unit: p.unit,
          quantity,
          price: p.price,
          mrp: p.mrp,
          lineTotal: p.price * quantity,
        });
      }
      const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
      const mrpTotal = items.reduce((s, i) => s + i.mrp * i.quantity, 0);
      const total = subtotal + (subtotal >= 199 ? 0 : 25) + Math.round(subtotal * 0.05);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const createdAt = new Date(Date.now() - d * 86400000 - Math.floor(Math.random() * 86400000));
      await Order.create({
        user: customer._id,
        items,
        address: customer.addresses[0]?.toObject(),
        subtotal,
        mrpTotal,
        discount: mrpTotal - subtotal,
        deliveryFee: subtotal >= 199 ? 0 : 25,
        taxes: Math.round(subtotal * 0.05),
        total,
        paymentMethod: ['cod', 'upi', 'razorpay'][Math.floor(Math.random() * 3)],
        paymentStatus: status === 'cancelled' ? 'failed' : status === 'delivered' ? 'paid' : 'pending',
        status,
        deliveredAt: status === 'delivered' ? createdAt : undefined,
        timeline: [{ status, at: createdAt }],
        createdAt,
        updatedAt: createdAt,
      });
    }
  }
  console.log('[seed] sample orders generated for last 30 days');

  await mongoose.disconnect();
  console.log('[seed] done');
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});

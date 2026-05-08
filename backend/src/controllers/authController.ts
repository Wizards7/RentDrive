import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import prisma from '../config/database';

function getAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

export async function register(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { phone, password, firstName, lastName, dateOfBirth } = req.body;

  const dob = new Date(dateOfBirth);
  if (getAge(dob) < 18) {
    res.status(400).json({ error: 'You must be at least 18 years old to register' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    res.status(409).json({ error: 'Phone number already registered' });
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.phoneVerification.create({
    data: { phone, code, expiresAt },
  });

  // TODO: Send SMS via Ucell/Megafon Tajikistan
  console.log(`[SMS] Send OTP ${code} to ${phone}`);

  const passwordHash = await bcrypt.hash(password, 12);

  const isDev = process.env.NODE_ENV !== 'production';

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash,
      firstName,
      lastName,
      dateOfBirth: dob,
      phoneVerified: isDev,
    },
  });

  res.status(201).json({
    message: 'Registration successful. Verify your phone number.',
    userId: user.id,
  });
}

export async function verifyPhone(req: Request, res: Response) {
  const { phone, code } = req.body;

  const record = await prisma.phoneVerification.findFirst({
    where: { phone, code, verified: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!record || record.expiresAt < new Date()) {
    res.status(400).json({ error: 'Invalid or expired OTP' });
    return;
  }

  await prisma.phoneVerification.update({
    where: { id: record.id },
    data: { verified: true },
  });

  await prisma.user.update({
    where: { phone },
    data: { phoneVerified: true },
  });

  res.json({ message: 'Phone verified successfully' });
}

export async function adminLogin(req: Request, res: Response) {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username !== adminUser || password !== adminPass) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' as `${number}${'s'|'m'|'h'|'d'|'w'|'y'}` }
  );

  res.json({ token });
}

export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (!user.phoneVerified) {
    res.status(403).json({ error: 'Phone number not verified' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as `${number}${'s'|'m'|'h'|'d'|'w'|'y'}` }
  );

  await (prisma as any).notification.create({
    data: {
      id: `notif-${Date.now()}`,
      type: 'USER_LOGIN',
      title: 'User Logged In',
      body: `${user.firstName} ${user.lastName} (${user.phone}) just signed in.`,
    },
  });

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      tajikPassportVerified: user.tajikPassportVerified,
      driverLicenseVerified: user.driverLicenseVerified,
    },
  });
}

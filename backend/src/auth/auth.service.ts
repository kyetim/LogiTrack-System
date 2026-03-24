import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
    HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto, LoginDto, RegisterDriverDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { AccountStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    private readonly loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
    private readonly MAX_ATTEMPTS = 5;
    private readonly LOCKOUT_MS = 15 * 60 * 1000;

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private emailService: EmailService,
    ) { }

    /** Admin tarafından açılan hesap kaydı (mevcut endpoint — ACTIVE olarak açılır) */
    async register(registerDto: RegisterDto) {
        const { email, password, role } = registerDto;

        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: { email, passwordHash, role, accountStatus: AccountStatus.ACTIVE },
            select: { id: true, email: true, role: true, accountStatus: true, createdAt: true },
        });

        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return { user, ...tokens };
    }

    /**
     * Şoför kendi başvurusunu oluşturur.
     * accountStatus = PENDING_APPROVAL — admin onaylayana kadar login yapamaz.
     */
    async registerDriver(dto: RegisterDriverDto) {
        const { email, password, firstName, lastName, phoneNumber, licenseNumber } = dto;

        // Email tekrarı kontrolü
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');

        // Ehliyet tekrarı kontrolü
        const existingLicense = await this.prisma.driverProfile.findUnique({
            where: { licenseNumber },
        });
        if (existingLicense) throw new ConflictException('Bu ehliyet numarası zaten kayıtlı.');

        const passwordHash = await bcrypt.hash(password, 10);

        // Kullanıcı + DriverProfile atomik olarak oluştur
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                phoneNumber,
                role: UserRole.DRIVER,
                accountStatus: AccountStatus.PENDING_APPROVAL,
                driverProfile: {
                    create: {
                        licenseNumber,
                        isActive: false, // Admin onaylayana kadar pasif
                    },
                },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                accountStatus: true,
                createdAt: true,
            },
        });

        // Admin'e bildirim emaili gönder (fire-and-forget)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@logitrack.com';
        this.emailService
            .sendDriverRegistrationRequest(adminEmail, { firstName, lastName, email, phoneNumber, licenseNumber })
            .catch(() => { }); // Email hatası kayıt akışını engellemez

        return {
            message: 'Başvurunuz alındı. Admin onayından sonra giriş yapabileceksiniz.',
            userId: user.id,
        };
    }

    /** Kullanıcı girişi */
    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Brute-force kontrolü
        this.checkLoginAttempts(email);

        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) {
            this.recordFailedAttempt(email);
            throw new UnauthorizedException('Geçersiz e-posta veya şifre.');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            this.recordFailedAttempt(email);
            const record = this.loginAttempts.get(email);
            const remaining = Math.max(0, this.MAX_ATTEMPTS - (record?.count || 0));
            throw new UnauthorizedException(
                remaining > 0
                    ? `Geçersiz şifre. ${remaining} deneme hakkınız kaldı.`
                    : 'Hesabınız kilitlendi. 15 dakika sonra tekrar deneyin.',
            );
        }

        // Başarılı giriş — kilidi kaldır
        this.clearLoginAttempts(email);

        // Onay bekleyen hesap girişi engelle
        if (user.accountStatus === AccountStatus.PENDING_APPROVAL) {
            throw new ForbiddenException('Hesabınız henüz admin tarafından onaylanmamış. Lütfen bekleyin.');
        }

        if (user.accountStatus === AccountStatus.SUSPENDED) {
            throw new ForbiddenException('Hesabınız askıya alınmış. Destek için iletişime geçin.');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                accountStatus: user.accountStatus,
                createdAt: user.createdAt,
            },
            ...tokens,
        };
    }

    /**
     * Şifremi unuttum — 6 haneli tek kullanımlık kod üretir ve emaile gönderir.
     * Kod PENDING_APPROVAL ve ACTIVE hesaplar için çalışır.
     */
    async forgotPassword(dto: ForgotPasswordDto) {
        const { email } = dto;

        const user = await this.prisma.user.findUnique({ where: { email } });

        // Güvenlik: kullanıcı bulunamasa bile aynı mesajı döndür (user enumeration önlemi)
        if (!user) {
            return { message: 'Kayıtlı bir hesap varsa sıfırlama kodu gönderildi.' };
        }

        // 6 haneli güvenli rastgele kod
        const token = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

        // Upsert: mevcut token varsa güncelle, yoksa oluştur
        await this.prisma.passwordResetToken.upsert({
            where: { userId: user.id },
            update: { token, expiresAt, used: false },
            create: { userId: user.id, token, expiresAt },
        });

        // Email gönder (fire-and-forget)
        this.emailService.sendPasswordResetEmail(email, token).catch(() => { });

        return { message: 'Kayıtlı bir hesap varsa sıfırlama kodu gönderildi.' };
    }

    /**
     * Şifre sıfırlama — token doğrula, yeni şifreyi kaydet.
     */
    async resetPassword(dto: ResetPasswordDto) {
        const { token, newPassword } = dto;

        const resetRecord = await this.prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetRecord || resetRecord.used) {
            throw new BadRequestException('Geçersiz veya kullanılmış sıfırlama kodu.');
        }

        if (resetRecord.expiresAt < new Date()) {
            throw new BadRequestException('Sıfırlama kodunun süresi dolmuş. Lütfen tekrar isteyin.');
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Şifreyi güncelle ve token'ı kullanılmış olarak işaretle (atomik)
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: resetRecord.userId },
                data: { passwordHash },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: resetRecord.id },
                data: { used: true },
            }),
        ]);

        return { message: 'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.' };
    }

    async refreshToken(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı.');
        return this.generateTokens(user.id, user.email, user.role);
    }

    async validateUser(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, accountStatus: true, createdAt: true },
        });
    }

    /** Şifre değiştir — mevcut şifre doğrulanır, yeni şifre kaydedilir */
    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı.');

        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Mevcut şifre hatalı.');
        }

        if (newPassword.length < 8) {
            throw new BadRequestException('Yeni şifre en az 8 karakter olmalıdır.');
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        return { message: 'Şifreniz başarıyla değiştirildi.' };
    }

    private async generateTokens(
        userId: string,
        email: string,
        role: string,
        meta?: { ipAddress?: string; userAgent?: string }
    ) {
        const payload = { sub: userId, email, role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_SECRET,
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: '7d',
            }),
        ]);

        // Refresh token'ı hash'le ve DB'ye kaydet
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                ipAddress: meta?.ipAddress,
                userAgent: meta?.userAgent,
            },
        });

        return { access_token: accessToken, refresh_token: refreshToken };
    }

    async logout(refreshToken: string) {
        if (refreshToken) {
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            await this.prisma.refreshToken.updateMany({
                where: { tokenHash, revokedAt: null },
                data: { revokedAt: new Date() },
            }).catch(() => { }); // Bulunamasa da önemli değil
        }
        return { message: 'Çıkış yapıldı.' };
    }

    // Cron veya startup'ta çalıştırılabilir
    async cleanupExpiredTokens() {
        await this.prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
    }

    private checkLoginAttempts(identifier: string): void {
        const record = this.loginAttempts.get(identifier);
        if (!record) return;

        const timeSinceLast = Date.now() - record.lastAttempt;
        if (timeSinceLast > this.LOCKOUT_MS) {
            this.loginAttempts.delete(identifier);
            return;
        }

        if (record.count >= this.MAX_ATTEMPTS) {
            const remainingMin = Math.ceil((this.LOCKOUT_MS - timeSinceLast) / 60000);
            throw new HttpException(
                `Çok fazla başarısız deneme. ${remainingMin} dakika sonra tekrar deneyin.`,
                429,
            );
        }
    }

    private recordFailedAttempt(identifier: string): void {
        const existing = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
        this.loginAttempts.set(identifier, {
            count: existing.count + 1,
            lastAttempt: Date.now(),
        });
    }

    private clearLoginAttempts(identifier: string): void {
        this.loginAttempts.delete(identifier);
    }
}

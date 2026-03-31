import { Controller, Post, Body, UseGuards, Get, Patch, Request, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RegisterDriverDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Admin: Yeni kullanıcı kaydı (ACTIVE olarak açılır)' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'Kullanıcı oluşturuldu.' })
    @ApiResponse({ status: 409, description: 'Bu e-posta zaten kayıtlı.' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('register-driver')
    @ApiOperation({
        summary: 'Şoför: Kendi başvurusunu oluştur (PENDING_APPROVAL ile açılır, admin onayı gerekir)',
    })
    @ApiBody({ type: RegisterDriverDto })
    @ApiResponse({ status: 201, description: 'Başvuru alındı, admin onayı bekleniyor.' })
    @ApiResponse({ status: 409, description: 'Bu e-posta veya ehliyet numarası zaten kayıtlı.' })
    async registerDriver(@Body() dto: RegisterDriverDto) {
        return this.authService.registerDriver(dto);
    }

    @Post('login')
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @ApiOperation({ summary: 'Giriş yap ve JWT token al' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Giriş başarılı.' })
    @ApiResponse({ status: 401, description: 'Geçersiz e-posta veya şifre.' })
    @ApiResponse({ status: 403, description: 'Hesap onay bekliyor veya askıya alındı.' })
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(loginDto);
        const isProd = process.env.NODE_ENV === 'production';

        // Access token — HttpOnly cookie (JS erişemez)
        res.cookie('access_token', result.access_token, {
            httpOnly: true,
            secure: isProd,         // production'da HTTPS zorunlu
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 dakika
            path: '/',
        });

        // Refresh token — sadece /api/auth/refresh path'ine gider
        res.cookie('refresh_token', result.refresh_token, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
            path: '/api/auth/refresh',
        });

        // Web dashboard cookie ile auth yapar, mobil uygulama body'deki token'ı okur
        return {
            user: result.user,
            access_token: result.access_token,
            refresh_token: result.refresh_token,
        };
    }

    @Post('logout')
    @ApiOperation({ summary: 'Çıkış yap (Cookie temizler)' })
    @ApiResponse({ status: 200, description: 'Çıkış yapıldı.' })
    async logout(
        @Body() body: { refresh_token?: string },
        @Req() req: any,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken = body.refresh_token || req.cookies?.refresh_token;
        await this.authService.logout(refreshToken || '');

        res.clearCookie('access_token', { path: '/' });
        res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
        return { message: 'Çıkış yapıldı.' };
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Şifremi unuttum — 6 haneli sıfırlama kodu emaile gönderilir' })
    @ApiBody({ type: ForgotPasswordDto })
    @ApiResponse({ status: 200, description: 'Kayıtlı hesap varsa sıfırlama kodu gönderildi.' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Şifre sıfırla — emaildeki kod ile yeni şifre belirle' })
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponse({ status: 200, description: 'Şifre güncellendi.' })
    @ApiResponse({ status: 400, description: 'Geçersiz veya süresi dolmuş kod.' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('refresh')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Access token yenile' })
    async refresh(
        @Request() req: { user: { id: string } },
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.refreshToken(req.user.id);
        const isProd = process.env.NODE_ENV === 'production';

        // Yeni access token'ı cookie olarak da ekle
        res.cookie('access_token', result.access_token, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 dakika
            path: '/',
        });

        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mevcut kullanıcı profilini getir' })
    async getProfile(@Request() req: { user: Record<string, unknown> }) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Patch('change-password')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Şifre değiştir — mevcut şifreyi doğrula ve yeni şifreyi kaydet' })
    @ApiResponse({ status: 200, description: 'Şifre başarıyla değiştirildi.' })
    @ApiResponse({ status: 401, description: 'Mevcut şifre hatalı.' })
    @ApiResponse({ status: 400, description: 'Yeni şifre çok kısa.' })
    async changePassword(
        @Request() req: { user: { id: string } },
        @Body() body: { currentPassword: string; newPassword: string },
    ) {
        return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
    }
}

import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RegisterDriverDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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
    @ApiOperation({ summary: 'Giriş yap ve JWT token al' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Giriş başarılı.' })
    @ApiResponse({ status: 401, description: 'Geçersiz e-posta veya şifre.' })
    @ApiResponse({ status: 403, description: 'Hesap onay bekliyor veya askıya alındı.' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
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
    async refresh(@Request() req: { user: { id: string } }) {
        return this.authService.refreshToken(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mevcut kullanıcı profilini getir' })
    async getProfile(@Request() req: { user: Record<string, unknown> }) {
        return req.user;
    }
}

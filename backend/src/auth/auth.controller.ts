import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Yeni kullanıcı kaydı oluştur' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'Kullanıcı başarıyla oluşturuldu.' })
    @ApiResponse({ status: 409, description: 'Bu e-posta zaten kayıtlı.' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Kullanıcı girişi yap ve JWT al' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Giriş başarılı, access_token döner.' })
    @ApiResponse({ status: 401, description: 'Geçersiz e-posta veya şifre.' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('refresh')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Access token yenile' })
    @ApiResponse({ status: 200, description: 'Yeni access token döner.' })
    @ApiResponse({ status: 401, description: 'Geçersiz veya süresi dolmuş token.' })
    async refresh(@Request() req: any) {
        return this.authService.refreshToken(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Oturum açmış kullanıcının profilini getir' })
    @ApiResponse({ status: 200, description: 'Kullanıcı bilgileri döner.' })
    @ApiResponse({ status: 401, description: 'Kimlik doğrulama gerekli.' })
    async getProfile(@Request() req: any) {
        return req.user;
    }
}

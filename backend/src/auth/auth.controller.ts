import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        console.log('DEBUG LOGIN REQUEST:', JSON.stringify(loginDto, null, 2));
        try {
            const result = await this.authService.login(loginDto);
            console.log('DEBUG LOGIN SUCCESS:', Object.keys(result));
            return result;
        } catch (error) {
            console.error('DEBUG LOGIN ERROR:', error.message);
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('refresh')
    async refresh(@Request() req) {
        return this.authService.refreshToken(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req) {
        return req.user;
    }
}

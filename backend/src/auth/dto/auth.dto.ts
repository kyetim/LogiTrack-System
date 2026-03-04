import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
    @ApiProperty({ example: 'user@logitrack.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'SecurePass123!' })
    @IsString()
    @MinLength(8)
    @IsNotEmpty()
    password: string;

    @ApiProperty({ enum: UserRole })
    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole;
}

export class LoginDto {
    @ApiProperty({ example: 'driver@logitrack.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'SecurePass123!' })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class RegisterDriverDto {
    @ApiProperty({ example: 'Ahmet' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Yılmaz' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 'driver@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
    @IsString()
    @MinLength(8)
    @IsNotEmpty()
    password: string;

    @ApiProperty({ example: '05551234567' })
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @ApiProperty({ example: '12345678' })
    @IsString()
    @IsNotEmpty()
    licenseNumber: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'driver@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({ description: 'Emaile gönderilen 6 haneli sıfırlama kodu' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ example: 'NewSecurePass123!', minLength: 8 })
    @IsString()
    @MinLength(8)
    @IsNotEmpty()
    newPassword: string;
}

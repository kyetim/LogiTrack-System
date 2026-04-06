/**
 * validators.ts — Zod Form Validation Schemas
 *
 * Uygulamadaki tüm form validasyon şemaları bu dosyada merkezi olarak tutulur.
 * Zod, runtime type-safety ve kullanıcı dostu hata mesajları sağlar.
 *
 * KURULUM (tek seferlik):
 *   npm install zod
 *
 * KULLANIM:
 *   import { loginSchema, registerSchema } from '@/utils/validators';
 *   import { useFormValidation } from '@/hooks/useFormValidation';
 *   const { errors, validate, clearError } = useFormValidation(loginSchema);
 */

import { z } from 'zod';

// ─── Auth Schemas ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'E-posta adresi zorunludur.')
        .email('Geçerli bir e-posta adresi girin.'),
    password: z
        .string()
        .min(1, 'Şifre zorunludur.')
        .min(6, 'Şifre en az 6 karakter olmalıdır.'),
});

export const registerSchema = z
    .object({
        fullName: z
            .string()
            .min(1, 'Ad Soyad zorunludur.')
            .min(2, 'Ad Soyad en az 2 karakter olmalıdır.')
            .trim(),
        email: z
            .string()
            .min(1, 'E-posta adresi zorunludur.')
            .email('Geçerli bir e-posta adresi girin.'),
        phone: z
            .string()
            .min(1, 'Telefon numarası zorunludur.')
            .min(10, 'Geçerli bir telefon numarası girin.'),
        licenseNumber: z
            .string()
            .min(1, 'Ehliyet numarası zorunludur.')
            .min(4, 'Geçerli bir ehliyet numarası girin.'),
        password: z
            .string()
            .min(1, 'Şifre zorunludur.')
            .min(6, 'Şifre en az 6 karakter olmalıdır.'),
        confirmPassword: z
            .string()
            .min(1, 'Şifre tekrarı zorunludur.'),
        // Checkbox & upload validasyonları da şemaya dahil
        licenseUploaded: z.literal(true, {
            errorMap: () => ({ message: 'Sürücü belgesi yüklenmelidir.' }),
        }),
        termsAccepted: z.literal(true, {
            errorMap: () => ({ message: 'Kullanım koşullarını kabul etmelisiniz.' }),
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Şifreler eşleşmiyor.',
        path: ['confirmPassword'],
    });

export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, 'Mevcut şifre zorunludur.'),
        newPassword: z
            .string()
            .min(6, 'Yeni şifre en az 6 karakter olmalıdır.'),
        confirmNewPassword: z
            .string()
            .min(1, 'Şifre tekrarı zorunludur.'),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: 'Yeni şifreler eşleşmiyor.',
        path: ['confirmNewPassword'],
    });

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'E-posta adresi zorunludur.')
        .email('Geçerli bir e-posta adresi girin.'),
});

// ─── Inferred Types ────────────────────────────────────────────────────────────

export type LoginFormData        = z.infer<typeof loginSchema>;
export type RegisterFormData     = z.infer<typeof registerSchema>;
export type ChangePasswordData   = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordData   = z.infer<typeof forgotPasswordSchema>;

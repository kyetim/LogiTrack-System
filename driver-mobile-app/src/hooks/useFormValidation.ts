/**
 * useFormValidation — Generic Zod-based Form Validation Hook
 *
 * Herhangi bir Zod şemasıyla çalışan, tip-güvenli form validasyon hook'u.
 * React Hook Form bağımlılığı olmadan, sıfır boilerplate ile çalışır.
 *
 * KULLANIM:
 *   const { errors, validate, clearError, clearAllErrors } =
 *     useFormValidation(loginSchema);
 *
 *   const handleSubmit = () => {
 *     if (!validate({ email, password })) return; // hata varsa durur
 *     dispatch(login({ email, password }));
 *   };
 *
 *   <AppInput
 *     error={errors.email}
 *     onChangeText={(t) => { setEmail(t); clearError('email'); }}
 *   />
 */

import { useState, useCallback } from 'react';
import { z, ZodSchema } from 'zod';

/** Alan bazlı hata mesajları haritası */
type FieldErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormValidationResult<T extends Record<string, unknown>> {
    /** Mevcut alan hataları */
    errors: FieldErrors<T>;
    /**
     * Veriyi şemaya göre doğrular.
     * Başarılıysa true döner ve hataları temizler.
     * Başarısızsa false döner ve hataları state'e yazar.
     */
    validate: (data: unknown) => data is T;
    /** Tek bir alanın hatasını temizler (onChange'de kullan) */
    clearError: (field: keyof T) => void;
    /** Tüm hataları temizler */
    clearAllErrors: () => void;
    /** Hataları dışarıdan set et (API hataları için) */
    setFieldError: (field: keyof T, message: string) => void;
}

export function useFormValidation<T extends Record<string, unknown>>(
    schema: ZodSchema<T>
): UseFormValidationResult<T> {
    const [errors, setErrors] = useState<FieldErrors<T>>({});

    const validate = useCallback(
        (data: unknown): data is T => {
            const result = schema.safeParse(data);

            if (result.success) {
                setErrors({});
                return true;
            }

            // Zod hata listesini alan→mesaj haritasına dönüştür
            const fieldErrors: FieldErrors<T> = {};
            result.error.errors.forEach((err) => {
                const field = err.path[0] as keyof T;
                // İlk hatayı sakla (sonraki hatalar aynı alan için görmezden gelir)
                if (field !== undefined && !fieldErrors[field]) {
                    fieldErrors[field] = err.message;
                }
            });

            setErrors(fieldErrors);
            return false;
        },
        [schema]
    );

    const clearError = useCallback((field: keyof T) => {
        setErrors((prev) => {
            if (!prev[field]) return prev; // değişiklik yoksa re-render engelle
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    const clearAllErrors = useCallback(() => {
        setErrors({});
    }, []);

    const setFieldError = useCallback((field: keyof T, message: string) => {
        setErrors((prev) => ({ ...prev, [field]: message }));
    }, []);

    return { errors, validate, clearError, clearAllErrors, setFieldError };
}

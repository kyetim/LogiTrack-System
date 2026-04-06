/**
 * apiError.ts — Universal API Error Parser
 *
 * Tüm API hatalarını normalize eden merkezi yardımcı fonksiyon.
 * Axios hataları, ağ hataları ve HTTP durum kodlarını Türkçe,
 * kullanıcı dostu mesajlara çevirir.
 *
 * KULLANIM:
 *   import { parseApiError } from '@/utils/apiError';
 *   ...
 *   } catch (error) {
 *     const { message } = parseApiError(error);
 *     setErrorMessage(message);
 *   }
 */

export interface ParsedApiError {
    /** Kullanıcıya gösterilecek mesaj */
    message: string;
    /** HTTP durum kodu (varsa) */
    statusCode?: number;
    /** Alan bazlı hata (backend 422/400 ile döndürüyorsa) */
    field?: string;
}

/**
 * Herhangi bir hata nesnesini `ParsedApiError` formatına dönüştürür.
 * Axios hataları, plain Error nesneleri ve string'ler desteklenir.
 */
export function parseApiError(error: unknown): ParsedApiError {
    // ── Axios error ─────────────────────────────────────────────────────────
    if (isAxiosLike(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        // Backend structured message (string veya string[])
        if (data?.message) {
            const msg = Array.isArray(data.message)
                ? data.message.join('\n')
                : String(data.message);
            return { message: msg, statusCode: status, field: data.field };
        }

        // Network / connection error (response yok)
        if (!error.response) {
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                return { message: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.' };
            }
            if (error.message?.includes('Network Error')) {
                return { message: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.' };
            }
            return { message: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.' };
        }

        // HTTP durum kodu eşlemeleri
        switch (status) {
            case 400:
                return { message: 'Geçersiz istek. Lütfen girdiğiniz bilgileri kontrol edin.', statusCode: 400 };
            case 401:
                return { message: 'E-posta adresiniz veya şifreniz hatalı.', statusCode: 401 };
            case 403:
                return { message: 'Hesabınız onaylanmamış veya askıya alınmış.', statusCode: 403 };
            case 404:
                return { message: 'İstenen kaynak bulunamadı.', statusCode: 404 };
            case 409:
                return { message: 'Bu bilgiler zaten kullanımda. Lütfen farklı bir e-posta deneyin.', statusCode: 409 };
            case 422:
                return { message: 'Girilen bilgiler geçersiz. Lütfen formu kontrol edin.', statusCode: 422 };
            case 429:
                return { message: 'Çok fazla deneme yaptınız. Lütfen birkaç dakika bekleyin.', statusCode: 429 };
            case 500:
            case 502:
            case 503:
                return { message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.', statusCode: status };
            default:
                return { message: `Beklenmedik bir hata oluştu (${status}).`, statusCode: status };
        }
    }

    // ── Plain JS Error ───────────────────────────────────────────────────────
    if (error instanceof Error) {
        return { message: error.message || 'Beklenmedik bir hata oluştu.' };
    }

    // ── String ───────────────────────────────────────────────────────────────
    if (typeof error === 'string' && error.length > 0) {
        return { message: error };
    }

    // ── Fallback ─────────────────────────────────────────────────────────────
    return { message: 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.' };
}

/** Axios hatasına benzeri bir nesne mi kontrol eder */
function isAxiosLike(error: unknown): error is {
    response?: { status: number; data: any };
    message?: string;
    code?: string;
    isAxiosError?: boolean;
} {
    return (
        typeof error === 'object' &&
        error !== null &&
        ('isAxiosError' in error || 'response' in error || 'code' in error)
    );
}

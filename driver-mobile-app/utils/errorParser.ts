import { AxiosError } from 'axios';

export interface AppError {
    message: string;
    code?: string;
    status?: number;
}

/**
 * Universal error parser for standardizing API errors before reducing to the UI.
 * Connects directly to catch blocks of Thunks or UI handlers.
 */
export const parseApiError = (error: unknown, defaultMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.'): AppError => {
    let message = defaultMessage;
    let code = 'UNKNOWN_ERROR';
    let status = 500;

    if (error && typeof error === 'object' && (error as AxiosError).isAxiosError) {
        const axiosError = error as AxiosError<any>;
        status = axiosError.response?.status || 500;

        if (axiosError.response?.data?.message) {
            // Handle array of strings or single string
            message = Array.isArray(axiosError.response.data.message)
                ? axiosError.response.data.message.join('\n')
                : axiosError.response.data.message;
        } else if (axiosError.message) {
            if (axiosError.message.includes('Network Error')) {
                message = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.';
                code = 'NETWORK_ERROR';
            } else if (status === 401) {
                message = 'Oturum süresi doldu veya yetkisiz erişim.';
                code = 'UNAUTHORIZED';
            } else if (status === 403) {
                message = 'Hesabınız onaylanmamış veya askıya alınmış olabilir.';
                code = 'FORBIDDEN';
            } else if (status === 404) {
                message = 'İstenen kaynak bulunamadı.';
                code = 'NOT_FOUND';
            } else {
                message = axiosError.message;
            }
        }
    } else if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    }

    return { message, code, status };
};

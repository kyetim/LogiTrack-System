import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// SecureStore web'de çalışmaz, web varsa AsyncStorage fallback
const isSecureStoreAvailable = Platform.OS !== 'web'

export const secureStorage = {
    async getItem(key: string): Promise<string | null> {
        try {
            if (isSecureStoreAvailable) {
                return await SecureStore.getItemAsync(key)
            }
            return await AsyncStorage.getItem(key)
        } catch {
            // SecureStore donanım hatası → AsyncStorage fallback
            return await AsyncStorage.getItem(key)
        }
    },

    async setItem(key: string, value: string): Promise<void> {
        try {
            if (isSecureStoreAvailable) {
                await SecureStore.setItemAsync(key, value, {
                    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                })
                return
            }
            await AsyncStorage.setItem(key, value)
        } catch {
            await AsyncStorage.setItem(key, value)
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            if (isSecureStoreAvailable) {
                await SecureStore.deleteItemAsync(key)
            } else {
                await AsyncStorage.removeItem(key)
            }
        } catch {
            await AsyncStorage.removeItem(key)
        }
        // Her iki storage'ı da temizle (migrasyon döneminde)
        try { await AsyncStorage.removeItem(key) } catch { /* ignore */ }
    },

    async multiRemove(keys: string[]): Promise<void> {
        await Promise.all(keys.map(key => this.removeItem(key)));
    },
}

export default secureStorage

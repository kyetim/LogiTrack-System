module.exports = {
    expo: {
        name: "LogiTrack Driver",
        slug: "logitrack-driver",
        version: "1.0.0",
        scheme: "logitrack",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        updates: {
            fallbackToCacheTimeout: 0,
            url: "https://u.expo.dev/ce3c2465-d8e4-47e7-a39b-30267531bb0d"
        },
        runtimeVersion: {
            policy: "appVersion"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.logitrack.driver",
            buildNumber: "1",
            infoPlist: {
                NSLocationWhenInUseUsageDescription: "LogiTrack aktif teslimat sırasında konumunuzu kullanır.",
                NSLocationAlwaysAndWhenInUseUsageDescription: "LogiTrack sürücü konumunuzu teslimat takibi için kullanır.",
                NSCameraUsageDescription: "Teslimat fotoğrafı çekebilmek için kamera izni gerekiyor.",
                NSPhotoLibraryUsageDescription: "Teslimat fotoğrafı ekleyebilmek için galeri izni gerekiyor.",
                UIBackgroundModes: ["location", "fetch"]
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            package: "com.logitrack.driver",
            versionCode: 1,
            permissions: [
                "ACCESS_FINE_LOCATION",
                "ACCESS_COARSE_LOCATION",
                "ACCESS_BACKGROUND_LOCATION",
                "CAMERA",
                "READ_EXTERNAL_STORAGE",
                "WRITE_EXTERNAL_STORAGE",
                "FOREGROUND_SERVICE",
                "RECEIVE_BOOT_COMPLETED"
            ],
            // Google Maps API Key — react-native-maps PROVIDER_GOOGLE için zorunlu
            // Fiziksel Android cihazda haritanın görünmesi için gereklidir
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
            },
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        plugins: [
            [
                "expo-location",
                {
                    locationAlwaysAndWhenInUsePermission: "Sevkiyatlarınızı haritada görebilmek ve teslimat sırasında konumunuzu otomatik güncelleyebilmek için konum izni gerekiyor.",
                    isIosBackgroundLocationEnabled: true,
                    isAndroidBackgroundLocationEnabled: true
                }
            ],
            [
                "expo-camera",
                {
                    cameraPermission: "Teslimat fotoğrafı çekebilmek için kamera izni gerekiyor."
                }
            ],
            [
                "expo-notifications",
                {
                    icon: "./assets/notification-icon.png",
                    color: "#2563eb"
                }
            ],
            "expo-router"
        ],
        extra: {
            eas: {
                projectId: "ce3c2465-d8e4-47e7-a39b-30267531bb0d"
            }
        }
    }
};

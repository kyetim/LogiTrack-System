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
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.logitrack.driver",
            infoPlist: {
                NSLocationWhenInUseUsageDescription: "Sevkiyatlarınızı haritada görebilmek ve konumunuzu paylaşabilmek için konum izni gerekiyor.",
                NSLocationAlwaysAndWhenInUseUsageDescription: "Teslimat sırasında konumunuzu otomatik olarak güncelleyebilmek için arka planda konum izni gerekiyor.",
                NSCameraUsageDescription: "Teslimat fotoğrafı çekebilmek için kamera izni gerekiyor.",
                NSPhotoLibraryUsageDescription: "Teslimat fotoğrafı ekleyebilmek için galeri izni gerekiyor.",
                UIBackgroundModes: ["location"]
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            package: "com.logitrack.driver",
            permissions: [
                "ACCESS_FINE_LOCATION",
                "ACCESS_COARSE_LOCATION",
                "ACCESS_BACKGROUND_LOCATION",
                "CAMERA",
                "READ_EXTERNAL_STORAGE",
                "WRITE_EXTERNAL_STORAGE",
                "FOREGROUND_SERVICE"
            ]
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
        ]
    }
};

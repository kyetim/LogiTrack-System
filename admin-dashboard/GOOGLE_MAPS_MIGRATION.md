# Google Maps Migration Guide

Bu rehber, projedeki harita altyapısını **Leaflet**'ten **Google Maps**'e geçirmek istendiğinde izlenmesi gereken adımları içerir.

## 1. Hazırlıklar

### API Key Alma
1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin.
2. Yeni bir proje oluşturun veya mevcut projeyi seçin.
3. **Maps JavaScript API** servisini etkinleştirin.
4. "Credentials" bölümünden yeni bir **API Key** oluşturun.
5. (Önemli) Billing (Fatura) hesabınızı projeye bağlayın. Google Maps API ücretli bir servistir (her ay $200 ücretsiz kredi verir).

### Çevre Değişkeni Tanımlama
`.env.local` dosyasına API anahtarınızı ekleyin:
```env
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...
```

## 2. Paket Kurulumu
Google Maps için gerekli paketi zaten projede olabilir, yoksa kurun:
```bash
npm install @react-google-maps/api
```

## 3. Kod Değişiklikleri (`LiveDriverMap.tsx`)

Mevcut Leaflet kodunu Google Maps koduna çevirin:

### Eski Kod (Leaflet)
```tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

<MapContainer center={[38.9637, 35.2433]} zoom={6}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  {drivers.map(driver => (
    <Marker position={[driver.lat, driver.lng]}>
      <Popup>{driver.name}</Popup>
    </Marker>
  ))}
</MapContainer>
```

### Yeni Kod (Google Maps)
```tsx
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '600px' };
const center = { lat: 38.9637, lng: 35.2433 };

<LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}>
  <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={6}>
    {drivers.map(driver => (
      <Marker position={{ lat: driver.lat, lng: driver.lng }}>
        <InfoWindow>
            <div>{driver.name}</div>
        </InfoWindow>
      </Marker>
    ))}
  </GoogleMap>
</LoadScript>
```

## 4. Önemli Farklar
- **Koordinat Formatı:** Leaflet `[lat, lng]` dizisi kullanır, Google Maps `{ lat, lng }` objesi kullanır.
- **Marker Icon:** Google Maps marker ikonlarını özelleştirmek için `icon` prop'u farklı çalışır (URL veya SVG path).
- **Maliyet:** Leaflet tamamen ücretsizdir. Google Maps yüksek kullanımda ücret çıkarabilir.

## 5. İpucu
Eğer Google Maps API kotanız dolarsa veya fatura sorunu yaşarsanız, `LiveDriverMap` bileşenini tekrar Leaflet versiyonuna geri döndürebilirsiniz.

# LogiTrack Mobile App - Update IP & Start

This script automatically detects your network IP and updates the API URL before starting Expo.

## Usage

```powershell
.\update-ip.ps1
npx expo start
```

Or combine both:
```powershell
.\update-ip.ps1; npx expo start
```

## Why is this needed?

Your computer's network IP address can change when:
- You connect to a different WiFi network
- Your router assigns a new IP
- You restart your computer

The mobile app needs to know the correct IP to connect to the backend API.

## Manual Update

If you prefer to update manually:

1. Run `ipconfig` to find your IPv4 address
2. Open `utils/constants.ts`
3. Update `API_URL` and `WS_URL` with your IP
4. Restart Expo

## Troubleshooting

**Login Failed Error:**
- Run `.\update-ip.ps1` again
- Make sure backend is running on port 4000
- Check that your phone and computer are on the same WiFi network

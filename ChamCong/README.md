# ChamCong Android App (Java)

- Package: `com.hunghutech.hrm`
- Min SDK: 24 | Target SDK: 36
- Main features scaffolded:
  - Login (Retrofit → `/api/auth/login`)
  - Home (navigate to Check-in / History / Logout)
  - Check-in/Check-out:
    - Fetch location (FusedLocation), get `nonce`, BiometricPrompt to sign, submit to `/api/mobile/attendance/check-in|check-out`
    - Get nearest site (call `/api/mobile/sites/nearest`)
- Device binding: registers `{ deviceIdHash, publicKeyPem }` to `/api/mobile/devices/register` (idempotent expected)

## Configure Base URL
- Edit `app/build.gradle.kts` → `buildConfigField("String", "BASE_URL", "\"http://10.0.2.2:5000/api/\"")`
- For physical device, replace with your PC LAN IP: `http://<PC-LAN-IP>:5000/api/`

## Permissions
- INTERNET, ACCESS_FINE_LOCATION/COARSE_LOCATION, USE_BIOMETRIC
- `usesCleartextTraffic=true` for local HTTP dev (remove for production)

## Build
- Open `ChamCong` in Android Studio
- Sync Gradle → Run on emulator/physical device

## Next steps
- Implement actual `/mobile/devices/*`, `/mobile/attendance/*` endpoints on backend per `Mobile.md`
- Add History list (RecyclerView) calling `/mobile/attendance/history`
- Add Profile screen `/api/users/me` if desired

## Security notes
- No fingerprint data is stored or sent. BiometricPrompt unlocks Android Keystore to sign server nonce.
- 1 device per employee is enforced by backend (device binding).



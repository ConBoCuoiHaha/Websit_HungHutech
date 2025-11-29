package com.hunghutech.hrm.data.api;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface DeviceService {
    class RegisterBody {
        public String deviceIdHash;
        public String publicKeyPem;
        public RegisterBody(String deviceIdHash, String publicKeyPem) {
            this.deviceIdHash = deviceIdHash;
            this.publicKeyPem = publicKeyPem;
        }
    }

    class RegisterFingerprintBody {
        public String deviceIdHash;
        public String publicKeyPem;
        public String fingerprint_signature;
        public String device_name;

        public RegisterFingerprintBody(String deviceIdHash, String publicKeyPem, String fingerprintSignature, String deviceName) {
            this.deviceIdHash = deviceIdHash;
            this.publicKeyPem = publicKeyPem;
            this.fingerprint_signature = fingerprintSignature;
            this.device_name = deviceName;
        }
    }

    @POST("mobile/devices/register")
    Call<ResponseBody> register(@Body RegisterBody body);

    @POST("mobile/devices/register")
    Call<ResponseBody> registerWithFingerprint(@Body RegisterFingerprintBody body);
}

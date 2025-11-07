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

    @POST("mobile/devices/register")
    Call<ResponseBody> register(@Body RegisterBody body);
}

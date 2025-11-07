package com.hunghutech.hrm.data.api;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.GET;

public interface UserService {
    @GET("auth/me")
    Call<ResponseBody> me();
}


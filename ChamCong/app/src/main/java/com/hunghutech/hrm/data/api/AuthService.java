package com.hunghutech.hrm.data.api;

import com.hunghutech.hrm.data.model.LoginRequest;
import com.hunghutech.hrm.data.model.LoginResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface AuthService {
    @POST("auth/login")
    Call<LoginResponse> login(@Body LoginRequest body);
}

package com.hunghutech.hrm.data.api;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.POST;

public interface MaintenanceService {
    @POST("maintenance/auto-checkout")
    Call<ResponseBody> autoCheckout();
}


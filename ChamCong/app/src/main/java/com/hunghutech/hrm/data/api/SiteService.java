package com.hunghutech.hrm.data.api;

import com.hunghutech.hrm.data.model.SiteNearestResponse;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Query;

public interface SiteService {
    @GET("mobile/sites/nearest")
    Call<SiteNearestResponse> getNearest(
            @Query("longitude") double lng,
            @Query("latitude") double lat
    );
}

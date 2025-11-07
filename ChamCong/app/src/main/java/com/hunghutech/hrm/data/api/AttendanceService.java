package com.hunghutech.hrm.data.api;

import com.hunghutech.hrm.data.model.AttendanceResponse;
import com.hunghutech.hrm.data.model.CheckRequest;
import com.hunghutech.hrm.data.model.NonceResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface AttendanceService {
    @GET("mobile/attendance/nonce")
    Call<NonceResponse> getNonce();

    @POST("mobile/attendance/check-in")
    Call<AttendanceResponse> checkIn(@Body CheckRequest body);

    @POST("mobile/attendance/check-out")
    Call<AttendanceResponse> checkOut(@Body CheckRequest body);

    @GET("mobile/attendance/today")
    Call<com.hunghutech.hrm.data.model.TodayResponse> getToday();

    @GET("mobile/attendance/history")
    Call<com.hunghutech.hrm.data.model.HistoryResponse> getHistory(@retrofit2.http.Query("from") String from,
                                                                    @retrofit2.http.Query("to") String to,
                                                                    @retrofit2.http.Query("limit") Integer limit);
}

package com.hunghutech.hrm.data.api;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Query;

public interface AdminService {
    // GET /api/chamcong?from=YYYY-MM-DD&to=YYYY-MM-DD&nhan_vien_id=&limit=
    @GET("chamcong")
    Call<ResponseBody> getAttendance(
            @Query("from") String from,
            @Query("to") String to,
            @Query("nhan_vien_id") String nhanVienId,
            @Query("phong_ban_id") String phongBanId,
            @Query("limit") Integer limit,
            @Query("q") String q
    );

    @GET("nhanvien")
    Call<ResponseBody> getEmployees(@Query("q") String q, @Query("limit") Integer limit);

    @GET("phongban")
    Call<ResponseBody> getDepartments(@Query("q") String q, @Query("limit") Integer limit);
}

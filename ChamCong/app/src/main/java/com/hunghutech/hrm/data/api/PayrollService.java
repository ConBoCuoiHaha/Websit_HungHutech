package com.hunghutech.hrm.data.api;

import com.hunghutech.hrm.data.model.ConfirmRequest;
import com.hunghutech.hrm.data.model.PayrollListResponse;
import com.hunghutech.hrm.data.model.PayrollResponse;
import com.hunghutech.hrm.data.model.RejectRequest;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface PayrollService {

    /**
     * Get my pending payrolls
     * GET /api/payroll/entries/my-pending
     */
    @GET("payroll/entries/my-pending")
    Call<PayrollListResponse> getMyPendingPayrolls(
            @Query("trang_thai") String trangThai,
            @Query("limit") int limit,
            @Query("page") int page
    );

    /**
     * Confirm payroll
     * POST /api/payroll/entries/:entryId/confirm
     */
    @POST("payroll/entries/{entryId}/confirm")
    Call<PayrollResponse> confirmPayroll(
            @Path("entryId") String entryId,
            @Body ConfirmRequest request
    );

    /**
     * Reject payroll
     * POST /api/payroll/entries/:entryId/reject
     */
    @POST("payroll/entries/{entryId}/reject")
    Call<PayrollResponse> rejectPayroll(
            @Path("entryId") String entryId,
            @Body RejectRequest request
    );
}

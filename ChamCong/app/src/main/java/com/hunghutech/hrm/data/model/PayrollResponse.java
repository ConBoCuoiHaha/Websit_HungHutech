package com.hunghutech.hrm.data.model;

public class PayrollResponse {
    public boolean success;
    public String msg;
    public PayrollData data;

    public static class PayrollData {
        public String entry_id;
        public String trang_thai_xac_nhan;
        public String ngay_xac_nhan;
        public String ngay_tu_choi;
        public long luong_thuc_nhan;
    }
}

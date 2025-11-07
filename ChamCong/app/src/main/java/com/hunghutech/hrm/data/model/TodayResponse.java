package com.hunghutech.hrm.data.model;

public class TodayResponse {
    public String status; // absent | checked_in | checked_out
    public Record record;

    public static class Record {
        public String _id;
        public String nhan_vien_id;
        public String ngay; // ISO date (00:00Z)
        public String thoi_gian_vao;
        public String thoi_gian_ra;
    }
}


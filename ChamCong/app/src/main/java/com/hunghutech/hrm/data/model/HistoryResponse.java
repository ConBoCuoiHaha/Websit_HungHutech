package com.hunghutech.hrm.data.model;

import java.util.List;

public class HistoryResponse {
    public List<Item> data;
    public int total;

    public static class Item {
        public String _id;
        public String nhan_vien_id;
        public String ngay; // date-only (UTC 00:00)
        public String thoi_gian_vao;
        public String thoi_gian_ra;
        public ShiftSnapshot shift_snapshot;
        public Flags flags;
    }

    public static class ShiftSnapshot {
        public String ten_ca;
        public String gio_bat_dau;
        public String gio_ket_thuc;
    }

    public static class Flags {
        public boolean isLate;
        public boolean lateOver30;
        public Integer lateMinutes;
        public String shiftName;
        public String shiftStart;
        public String earliestCheckIn;
    }
}

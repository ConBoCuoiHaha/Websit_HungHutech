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
    }
}


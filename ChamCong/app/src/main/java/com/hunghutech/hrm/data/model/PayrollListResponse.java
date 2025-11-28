package com.hunghutech.hrm.data.model;

import java.util.List;

public class PayrollListResponse {
    public boolean success;
    public String msg;
    public List<PayrollEntry> data;
    public Pagination pagination;

    public static class Pagination {
        public int total;
        public int page;
        public int limit;
        public int pages;
    }
}

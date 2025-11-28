package com.hunghutech.hrm.data.model;

import java.util.List;

public class PayrollEntry {
    public String _id;
    public String run_id;
    public String ky_luong;
    public String ngay_bat_dau;
    public String ngay_ket_thuc;
    public String loai_ky;

    // Salary details
    public long luong_co_ban;
    public List<MoneyItem> phu_cap;
    public List<MoneyItem> thuong;
    public List<MoneyItem> ot;
    public List<MoneyItem> khoan_khau_tru;
    public long tong_phu_cap;
    public long tong_thuong;
    public long tong_ot;
    public long tong_khau_tru_khac;
    public long tong_thu_nhap;

    // Insurance
    public long bhxh;
    public long bhyt;
    public long bhtn;
    public long kpcd;
    public long tong_khau_tru_bat_buoc;

    // Tax
    public long giam_tru_ban_than;
    public long giam_tru_phu_thuoc;
    public int so_nguoi_phu_thuoc;
    public long thu_nhap_tinh_thue;
    public long thue_tncn;
    public List<TaxBreakdown> chi_tiet_thue;

    // Final
    public long tong_khau_tru;
    public long luong_thuc_nhan;

    // Confirmation status
    public String trang_thai_xac_nhan; // Chua_gui, Cho_xac_nhan, Da_xac_nhan, Tu_choi
    public GuiXacNhan gui_xac_nhan;
    public XacNhan xac_nhan;
    public TuChoi tu_choi;

    public static class MoneyItem {
        public String ten;
        public long so_tien;
        public String ghi_chu;
    }

    public static class TaxBreakdown {
        public int bac;
        public long muc_chiu_thue;
        public double thue_suat;
        public long tien_thue;
    }

    public static class GuiXacNhan {
        public String ngay_gui;
        public String nguoi_gui_ten;
        public String deadline;
    }

    public static class XacNhan {
        public boolean da_xac_nhan;
        public String ngay_xac_nhan;
        public String device_info;
    }

    public static class TuChoi {
        public String ly_do;
        public String ngay_tu_choi;
        public String ghi_chu;
        public boolean da_xu_ly;
        public String ket_qua_xu_ly;
    }
}

package com.hunghutech.hrm.data.model;

public class RejectRequest {
    public String ly_do;
    public String ghi_chu;
    public String device_info;

    public RejectRequest(String lyDo, String ghiChu, String deviceInfo) {
        this.ly_do = lyDo;
        this.ghi_chu = ghiChu;
        this.device_info = deviceInfo;
    }
}

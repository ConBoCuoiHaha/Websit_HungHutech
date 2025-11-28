package com.hunghutech.hrm.data.model;

public class ConfirmRequest {
    public String biometric_signature;
    public String device_info;
    public String os_version;
    public String app_version;

    public ConfirmRequest(String biometricSignature, String deviceInfo, String osVersion, String appVersion) {
        this.biometric_signature = biometricSignature;
        this.device_info = deviceInfo;
        this.os_version = osVersion;
        this.app_version = appVersion;
    }
}

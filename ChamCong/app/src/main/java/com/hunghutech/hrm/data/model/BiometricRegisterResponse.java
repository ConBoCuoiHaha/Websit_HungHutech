package com.hunghutech.hrm.data.model;

/**
 * Response model for biometric registration
 * POST /api/biometric/register
 */
public class BiometricRegisterResponse {
    public boolean success;
    public String msg;
    public BiometricData data;
    public String registered_email; // Only present when error 409

    public static class BiometricData {
        public String device_id;
        public String device_name;
        public String registered_at;
    }
}

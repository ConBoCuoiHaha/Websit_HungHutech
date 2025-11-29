package com.hunghutech.hrm.data.model;

/**
 * Response model for biometric status check
 * GET /api/biometric/status
 */
public class BiometricStatusResponse {
    public boolean success;
    public BiometricStatusData data;

    public static class BiometricStatusData {
        public boolean is_registered;
        public String device_id;
        public String device_name;
        public String registered_at;
        public String last_used_at;
    }
}

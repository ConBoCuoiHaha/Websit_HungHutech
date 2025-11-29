package com.hunghutech.hrm.data.model;

/**
 * Request model for biometric registration
 * POST /api/biometric/register
 */
public class BiometricRegisterRequest {
    public String device_id;
    public String device_name;
    public String fingerprint_signature;

    public BiometricRegisterRequest(String device_id, String device_name, String fingerprint_signature) {
        this.device_id = device_id;
        this.device_name = device_name;
        this.fingerprint_signature = fingerprint_signature;
    }
}

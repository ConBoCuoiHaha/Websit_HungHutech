package com.hunghutech.hrm.data.model;

public class CheckRequest {
    public String deviceIdHash;
    public String nonce;
    public String signature; // Base64
    public String fingerprint_signature; // NEW: Fingerprint signature for verification
    public double lat;
    public double lng;
    public float accuracy;

    public CheckRequest(String deviceIdHash, String nonce, String signature, String fingerprintSignature, double lat, double lng, float accuracy) {
        this.deviceIdHash = deviceIdHash;
        this.nonce = nonce;
        this.signature = signature;
        this.fingerprint_signature = fingerprintSignature;
        this.lat = lat;
        this.lng = lng;
        this.accuracy = accuracy;
    }
}


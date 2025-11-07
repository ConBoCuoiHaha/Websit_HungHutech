package com.hunghutech.hrm.data.model;

public class CheckRequest {
    public String deviceIdHash;
    public String nonce;
    public String signature; // Base64
    public double lat;
    public double lng;
    public float accuracy;

    public CheckRequest(String deviceIdHash, String nonce, String signature, double lat, double lng, float accuracy) {
        this.deviceIdHash = deviceIdHash;
        this.nonce = nonce;
        this.signature = signature;
        this.lat = lat;
        this.lng = lng;
        this.accuracy = accuracy;
    }
}


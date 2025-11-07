package com.hunghutech.hrm.utils;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.location.Location;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.CancellationTokenSource;

public class LocationHelper {
    public interface Callback {
        void onSuccess(Location location);
        void onError(String message);
    }

    public static final int REQ_LOCATION = 1001;

    public static boolean hasLocationPermission(Activity a) {
        return ActivityCompat.checkSelfPermission(a, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || ActivityCompat.checkSelfPermission(a, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    public static void requestLocationPermission(Activity a) {
        ActivityCompat.requestPermissions(a, new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOCATION);
    }

    @SuppressLint("MissingPermission")
    public static void getSingleLocation(Activity a, @NonNull Callback cb) {
        if (!hasLocationPermission(a)) {
            cb.onError("Thiếu quyền vị trí");
            return;
        }
        FusedLocationProviderClient client = LocationServices.getFusedLocationProviderClient(a);
        CancellationTokenSource cts = new CancellationTokenSource();
        client.getCurrentLocation(com.google.android.gms.location.Priority.PRIORITY_HIGH_ACCURACY, cts.getToken())
                .addOnSuccessListener(a, loc -> {
                    if (loc != null) cb.onSuccess(loc);
                    else cb.onError("Không lấy được vị trí");
                })
                .addOnFailureListener(e -> cb.onError(e.getMessage()));
    }
}


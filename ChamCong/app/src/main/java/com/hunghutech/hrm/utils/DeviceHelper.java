package com.hunghutech.hrm.utils;

import android.content.Context;
import android.os.Build;
import android.provider.Settings;

/**
 * Helper class for getting device information
 */
public class DeviceHelper {

    /**
     * Get unique device ID using Android Secure.ANDROID_ID
     * This is unique per app installation and persists across app updates
     *
     * @param context Application context
     * @return Unique device ID string
     */
    public static String getDeviceId(Context context) {
        return Settings.Secure.getString(
            context.getContentResolver(),
            Settings.Secure.ANDROID_ID
        );
    }

    /**
     * Get human-readable device name
     * Format: "Manufacturer Model" (e.g., "Samsung Galaxy S21")
     *
     * @return Device name string
     */
    public static String getDeviceName() {
        String manufacturer = Build.MANUFACTURER;
        String model = Build.MODEL;

        // If model already starts with manufacturer, don't duplicate
        if (model.toLowerCase().startsWith(manufacturer.toLowerCase())) {
            return capitalize(model);
        } else {
            return capitalize(manufacturer) + " " + model;
        }
    }

    /**
     * Capitalize first letter of a string
     *
     * @param str Input string
     * @return Capitalized string
     */
    private static String capitalize(String str) {
        if (str == null || str.length() == 0) {
            return "";
        }
        char first = str.charAt(0);
        if (Character.isUpperCase(first)) {
            return str;
        } else {
            return Character.toUpperCase(first) + str.substring(1);
        }
    }
}

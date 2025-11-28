package com.hunghutech.hrm.utils;

import java.text.NumberFormat;
import java.util.Locale;

public class CurrencyHelper {

    /**
     * Format number to Vietnamese currency
     * Example: 44435000 -> "44,435,000 đ"
     */
    public static String formatVND(long amount) {
        NumberFormat formatter = NumberFormat.getInstance(new Locale("vi", "VN"));
        return formatter.format(amount) + " đ";
    }

    /**
     * Format number to Vietnamese currency with abbreviated suffix
     * Example: 44435000 -> "44.4 triệu"
     */
    public static String formatVNDAbbr(long amount) {
        if (amount >= 1_000_000_000) {
            return String.format(Locale.US, "%.1f tỷ", amount / 1_000_000_000.0);
        } else if (amount >= 1_000_000) {
            return String.format(Locale.US, "%.1f triệu", amount / 1_000_000.0);
        } else if (amount >= 1_000) {
            return String.format(Locale.US, "%.1f nghìn", amount / 1_000.0);
        } else {
            return amount + " đ";
        }
    }

    /**
     * Format percentage
     * Example: 0.085 -> "8.5%"
     */
    public static String formatPercent(double rate) {
        return String.format(Locale.US, "%.1f%%", rate * 100);
    }
}

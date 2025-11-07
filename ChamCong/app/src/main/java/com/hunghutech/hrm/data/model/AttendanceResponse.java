package com.hunghutech.hrm.data.model;

public class AttendanceResponse {
    public double distance;
    public Flags flags;
    public Attendance attendance;

    public static class Flags {
        public boolean isLate;
        public boolean lateOver30;
        public boolean isMock;
    }

    public static class Attendance {
        public String _id;
        public String employeeId;
        public String type; // check_in/check_out
        public String time;
        public String siteId;
    }
}


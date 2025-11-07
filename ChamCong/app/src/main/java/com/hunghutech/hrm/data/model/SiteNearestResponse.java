package com.hunghutech.hrm.data.model;

import java.util.List;

public class SiteNearestResponse {
    public boolean success;
    public Site nearest;
    public List<Site> allSites;
    public int total;

    public static class Site {
        public String siteId;
        public String name;
        public String address;
        public Location location;
        public int radius;
        public double distance; // meters
        public boolean isInRange;
        public boolean canCheckIn;
        public Double latitude; // optional if server returns
        public Double longitude; // optional if server returns
    }

    public static class Location {
        public String type;
        public double[] coordinates; // [lng, lat]
    }
}


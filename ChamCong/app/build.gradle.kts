plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.hunghutech.hrm"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.hunghutech.hrm"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Base URL mặc định cho LAN hiện tại (PC: 192.168.88.50)
        buildConfigField("String", "BASE_URL", "\"http://192.168.88.50:5000/api/\"")
        // Allowed Wi-Fi SSIDs for attendance (comma-separated).
        buildConfigField("String", "ALLOWED_WIFI_SSIDS", "\"HUTECH-Office\"")
        buildConfigField("boolean", "RESTRICT_WIFI", "false")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.activity)
    implementation(libs.constraintlayout)

    // Networking
    implementation(libs.retrofit)
    implementation(libs.retrofit.gson)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)

    // Biometric + Security
    implementation(libs.biometric)
    implementation(libs.security.crypto)

    // Location
    implementation(libs.play.services.location)
    implementation(libs.recyclerview)

    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)
}

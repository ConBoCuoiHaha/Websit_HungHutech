package com.hunghutech.hrm.utils;

import android.content.Context;
import android.os.CancellationSignal;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import android.util.Base64;
import java.util.concurrent.Executor;

import javax.crypto.Cipher;

/**
 * Biometric + Keystore signing helper.
 * Generates an EC key pair bound to biometric; signs a server-provided nonce.
 */
public class BiometricHelper {
    private static final String KEY_ALIAS = "hrm_biometric_key";

    public interface Callback {
        void onSuccess(String signatureBase64, String publicKeyPem);
        void onError(String message);
    }

    public static boolean isBiometricAvailable(Context ctx) {
        BiometricManager manager = BiometricManager.from(ctx);
        int res = manager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
        return res == BiometricManager.BIOMETRIC_SUCCESS;
    }

    public static void ensureKeypair() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (ks.containsAlias(KEY_ALIAS)) return;

        KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC", "AndroidKeyStore");
        ECGenParameterSpec ecSpec = new ECGenParameterSpec("secp256r1");
        android.security.keystore.KeyGenParameterSpec spec = new android.security.keystore.KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                android.security.keystore.KeyProperties.PURPOSE_SIGN | android.security.keystore.KeyProperties.PURPOSE_VERIFY)
                .setAlgorithmParameterSpec(ecSpec)
                .setDigests(android.security.keystore.KeyProperties.DIGEST_SHA256)
                .setUserAuthenticationRequired(true)
                .setInvalidatedByBiometricEnrollment(true)
                .build();
        kpg.initialize(spec);
        kpg.generateKeyPair();
    }

    public static String exportPublicKeyPem() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        java.security.cert.Certificate cert = ks.getCertificate(KEY_ALIAS);
        byte[] encoded = cert.getPublicKey().getEncoded();
        String base64 = Base64.encodeToString(encoded, Base64.NO_WRAP);
        return "-----BEGIN PUBLIC KEY-----\n" + base64 + "\n-----END PUBLIC KEY-----\n";
    }

    public static void authenticateAndSign(Context ctx, String title, String subtitle, byte[] nonce, @NonNull Callback cb) {
        try {
            ensureKeypair();
        } catch (Exception e) {
            cb.onError("Init keystore failed: " + e.getMessage());
            return;
        }

        Executor executor = ContextCompat.getMainExecutor(ctx);
        BiometricPrompt.PromptInfo info = new BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle)
                .setNegativeButtonText("Hủy")
                .build();

        try {
            Signature signature = Signature.getInstance("SHA256withECDSA");
            KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
            ks.load(null);
            java.security.PrivateKey privateKey = (java.security.PrivateKey) ks.getKey(KEY_ALIAS, null);
            signature.initSign(privateKey);

            BiometricPrompt.AuthenticationCallback authCb = new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                    try {
                        Signature sig = result.getCryptoObject().getSignature();
                        sig.update(nonce);
                        byte[] signed = sig.sign();
                        String b64 = Base64.encodeToString(signed, Base64.NO_WRAP);
                        String pem = exportPublicKeyPem();
                        cb.onSuccess(b64, pem);
                    } catch (Exception e) {
                        cb.onError("Sign failed: " + e.getMessage());
                    }
                }

                @Override
                public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                    cb.onError(errString.toString());
                }

                @Override
                public void onAuthenticationFailed() {
                    cb.onError("Biometric failed");
                }
            };

            BiometricPrompt prompt = new BiometricPrompt((androidx.fragment.app.FragmentActivity) ctx, executor, authCb);
            BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(signature);
            prompt.authenticate(info, cryptoObject);
        } catch (Exception e) {
            cb.onError("Biometric setup failed: " + e.getMessage());
        }
    }
}

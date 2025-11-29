const User = require('../schemas/user.model');

/**
 * API 1: Register biometric device
 * POST /api/biometric/register
 * Role: Employee
 */
exports.registerBiometric = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { device_id, device_name, fingerprint_signature } = req.body;

    console.log('=== registerBiometric ===');
    console.log('userId:', userId);
    console.log('device_id:', device_id);
    console.log('device_name:', device_name);

    // Validate required fields
    if (!device_id || !device_name || !fingerprint_signature) {
      return res.status(400).json({
        success: false,
        msg: 'Thiếu thông tin thiết bị hoặc vân tay'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'Không tìm thấy người dùng'
      });
    }

    // IMPORTANT: Check if this FINGERPRINT is already registered to another user
    // We only check fingerprint_signature, NOT device_id
    // This prevents one fingerprint from being used by multiple accounts
    const existingFingerprintUser = await User.findOne({
      _id: { $ne: userId }, // Not this user
      'biometric_device.fingerprint_signature': fingerprint_signature,
    });

    if (existingFingerprintUser) {
      console.log('⚠️ Fingerprint already registered to another user:', existingFingerprintUser.email);
      return res.status(409).json({
        success: false,
        msg: 'Vân tay này đã được đăng ký cho tài khoản khác. Mỗi vân tay chỉ có thể liên kết với 1 tài khoản duy nhất.',
        registered_email: existingFingerprintUser.email,
      });
    }

    // Register or update biometric device for this user
    user.biometric_device = {
      device_id,
      device_name,
      fingerprint_signature,
      registered_at: user.biometric_device?.registered_at || new Date(),
      last_used_at: new Date(),
    };

    await user.save();

    console.log('✅ Biometric registered successfully for user:', user.email);

    return res.status(200).json({
      success: true,
      msg: 'Đăng ký vân tay thành công',
      data: {
        device_id: user.biometric_device.device_id,
        device_name: user.biometric_device.device_name,
        registered_at: user.biometric_device.registered_at,
      },
    });
  } catch (err) {
    console.error('Error in registerBiometric:', err);
    return res.status(500).json({
      success: false,
      msg: 'Lỗi máy chủ',
      error: err.message
    });
  }
};

/**
 * API 2: Verify biometric signature
 * POST /api/biometric/verify
 * Role: Employee
 */
exports.verifyBiometric = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { device_id, fingerprint_signature } = req.body;

    console.log('=== verifyBiometric ===');
    console.log('userId:', userId);
    console.log('device_id:', device_id);

    // Validate required fields
    if (!device_id || !fingerprint_signature) {
      return res.status(400).json({
        success: false,
        msg: 'Thiếu thông tin thiết bị hoặc vân tay'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'Không tìm thấy người dùng'
      });
    }

    // Check if user has registered biometric
    if (!user.biometric_device || !user.biometric_device.fingerprint_signature) {
      console.log('❌ User has not registered biometric yet');
      return res.status(403).json({
        success: false,
        msg: 'Bạn chưa đăng ký vân tay. Vui lòng đăng ký vân tay trước khi xác nhận.',
        needs_registration: true,
      });
    }

    // Verify device ID matches
    if (user.biometric_device.device_id !== device_id) {
      console.log('❌ Device ID mismatch');
      console.log('Registered device:', user.biometric_device.device_id);
      console.log('Current device:', device_id);
      return res.status(403).json({
        success: false,
        msg: 'Thiết bị không khớp. Vân tay chỉ có thể sử dụng trên thiết bị đã đăng ký.',
      });
    }

    // Verify fingerprint signature matches
    if (user.biometric_device.fingerprint_signature !== fingerprint_signature) {
      console.log('❌ Fingerprint signature mismatch');
      return res.status(403).json({
        success: false,
        msg: 'Vân tay không khớp. Vui lòng sử dụng vân tay đã đăng ký.',
      });
    }

    // Update last used time
    user.biometric_device.last_used_at = new Date();
    await user.save();

    console.log('✅ Biometric verified successfully');

    return res.status(200).json({
      success: true,
      msg: 'Xác thực vân tay thành công',
      data: {
        verified: true,
        device_name: user.biometric_device.device_name,
        last_used_at: user.biometric_device.last_used_at,
      },
    });
  } catch (err) {
    console.error('Error in verifyBiometric:', err);
    return res.status(500).json({
      success: false,
      msg: 'Lỗi máy chủ',
      error: err.message
    });
  }
};

/**
 * API 3: Get biometric registration status
 * GET /api/biometric/status
 * Role: Employee
 */
exports.getBiometricStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'Không tìm thấy người dùng'
      });
    }

    const isRegistered = !!(user.biometric_device && user.biometric_device.fingerprint_signature);

    return res.status(200).json({
      success: true,
      data: {
        is_registered: isRegistered,
        device_id: user.biometric_device?.device_id || null,
        device_name: user.biometric_device?.device_name || null,
        registered_at: user.biometric_device?.registered_at || null,
        last_used_at: user.biometric_device?.last_used_at || null,
      },
    });
  } catch (err) {
    console.error('Error in getBiometricStatus:', err);
    return res.status(500).json({
      success: false,
      msg: 'Lỗi máy chủ',
      error: err.message
    });
  }
};

/**
 * API 4: Unregister biometric device
 * DELETE /api/biometric/unregister
 * Role: Employee
 */
exports.unregisterBiometric = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'Không tìm thấy người dùng'
      });
    }

    // Clear biometric data
    user.biometric_device = {
      device_id: null,
      device_name: null,
      fingerprint_signature: null,
      registered_at: null,
      last_used_at: null,
    };

    await user.save();

    console.log('✅ Biometric unregistered for user:', user.email);

    return res.status(200).json({
      success: true,
      msg: 'Hủy đăng ký vân tay thành công',
    });
  } catch (err) {
    console.error('Error in unregisterBiometric:', err);
    return res.status(500).json({
      success: false,
      msg: 'Lỗi máy chủ',
      error: err.message
    });
  }
};

// Export all functions
module.exports = {
  registerBiometric: exports.registerBiometric,
  verifyBiometric: exports.verifyBiometric,
  getBiometricStatus: exports.getBiometricStatus,
  unregisterBiometric: exports.unregisterBiometric,
};

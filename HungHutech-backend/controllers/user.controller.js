const User = require('../schemas/user.model');
const bcrypt = require('bcrypt');

// Get all users with pagination
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', role } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (q) {
      filter.email = { $regex: q, $options: 'i' };
    }
    if (role) {
      filter.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('nhan_vien_id', 'ho_dem ten ma_nhan_vien')
        .select('-password_hash')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ ngay_tao: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

// Get user by ID
exports.getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('nhan_vien_id', 'ho_dem ten ma_nhan_vien email')
      .select('-password_hash');

    if (!user) {
      return res.status(404).json({ msg: 'Không tìm thấy người dùng' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

// Create new user
exports.create = async (req, res) => {
  try {
    const { email, password, role, nhan_vien_id } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email đã tồn tại' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password_hash,
      role: role || 'employee',
      nhan_vien_id: nhan_vien_id || null,
      active: true,
    });

    await user.save();

    // Populate and return without password
    const populatedUser = await User.findById(user._id)
      .populate('nhan_vien_id', 'ho_dem ten ma_nhan_vien')
      .select('-password_hash');

    res.status(201).json(populatedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

// Update user
exports.update = async (req, res) => {
  try {
    const { email, role, nhan_vien_id, active } = req.body;

    const updateData = {};
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (nhan_vien_id !== undefined) updateData.nhan_vien_id = nhan_vien_id;
    if (active !== undefined) updateData.active = active;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('nhan_vien_id', 'ho_dem ten ma_nhan_vien')
      .select('-password_hash');

    if (!user) {
      return res.status(404).json({ msg: 'Không tìm thấy người dùng' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

// Delete user
exports.delete = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'Không tìm thấy người dùng' });
    }

    res.json({ msg: 'Đã xóa người dùng thành công' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'Không tìm thấy người dùng' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Mật khẩu cũ không đúng' });
    }

    // Hash new password
    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ msg: 'Đã đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

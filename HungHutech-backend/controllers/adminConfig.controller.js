const EmploymentStatus = require('../schemas/employmentStatus.model');
const JobCategory = require('../schemas/jobCategory.model');
const Nationality = require('../schemas/nationality.model');
const Skill = require('../schemas/skill.model');
const EducationLevel = require('../schemas/educationLevel.model');
const Language = require('../schemas/language.model');

// Generic CRUD functions cho tất cả config entities
const createGenericController = (Model, modelName) => {
  return {
    // Lấy tất cả
    async getAll(req, res) {
      try {
        const {
          page = 1,
          limit = 50,
          search = '',
          kich_hoat
        } = req.query;

        const query = {};

        // Filter theo trạng thái kích hoạt
        if (kich_hoat !== undefined) {
          query.kich_hoat = kich_hoat === 'true';
        }

        // Tìm kiếm
        if (search) {
          const searchFields = [];
          if (Model.schema.path('ten_trang_thai')) searchFields.push({ ten_trang_thai: { $regex: search, $options: 'i' } });
          if (Model.schema.path('ten_danh_muc')) searchFields.push({ ten_danh_muc: { $regex: search, $options: 'i' } });
          if (Model.schema.path('ten_quoc_tich')) searchFields.push({ ten_quoc_tich: { $regex: search, $options: 'i' } });
          if (Model.schema.path('ten_ky_nang')) searchFields.push({ ten_ky_nang: { $regex: search, $options: 'i' } });
          if (Model.schema.path('ten_trinh_do')) searchFields.push({ ten_trinh_do: { $regex: search, $options: 'i' } });
          if (Model.schema.path('ten_ngon_ngu')) searchFields.push({ ten_ngon_ngu: { $regex: search, $options: 'i' } });

          if (searchFields.length > 0) {
            query.$or = searchFields;
          }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sắp xếp
        let sortCriteria = { createdAt: -1 };
        if (Model.schema.path('thu_tu_sap_xep')) {
          sortCriteria = { thu_tu_sap_xep: 1, createdAt: -1 };
        } else if (Model.schema.path('cap_do')) {
          sortCriteria = { cap_do: 1, createdAt: -1 };
        }

        const items = await Model.find(query)
          .sort(sortCriteria)
          .skip(skip)
          .limit(parseInt(limit));

        const total = await Model.countDocuments(query);

        res.json({
          items,
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        });
      } catch (error) {
        console.error(`Error getting ${modelName}:`, error);
        res.status(500).json({ message: `Lỗi khi lấy danh sách ${modelName}`, error: error.message });
      }
    },

    // Lấy theo ID
    async getById(req, res) {
      try {
        const item = await Model.findById(req.params.id);

        if (!item) {
          return res.status(404).json({ message: `${modelName} không tồn tại` });
        }

        res.json(item);
      } catch (error) {
        console.error(`Error getting ${modelName}:`, error);
        res.status(500).json({ message: `Lỗi khi lấy ${modelName}`, error: error.message });
      }
    },

    // Tạo mới
    async create(req, res) {
      try {
        const item = new Model(req.body);
        await item.save();

        res.status(201).json(item);
      } catch (error) {
        console.error(`Error creating ${modelName}:`, error);

        if (error.code === 11000) {
          return res.status(400).json({ message: `${modelName} đã tồn tại` });
        }

        res.status(500).json({ message: `Lỗi khi tạo ${modelName}`, error: error.message });
      }
    },

    // Cập nhật
    async update(req, res) {
      try {
        const item = await Model.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true, runValidators: true }
        );

        if (!item) {
          return res.status(404).json({ message: `${modelName} không tồn tại` });
        }

        res.json(item);
      } catch (error) {
        console.error(`Error updating ${modelName}:`, error);
        res.status(500).json({ message: `Lỗi khi cập nhật ${modelName}`, error: error.message });
      }
    },

    // Xóa
    async delete(req, res) {
      try {
        const item = await Model.findByIdAndDelete(req.params.id);

        if (!item) {
          return res.status(404).json({ message: `${modelName} không tồn tại` });
        }

        res.json({ message: `Đã xóa ${modelName} thành công` });
      } catch (error) {
        console.error(`Error deleting ${modelName}:`, error);
        res.status(500).json({ message: `Lỗi khi xóa ${modelName}`, error: error.message });
      }
    },

    // Kích hoạt/vô hiệu hóa
    async toggleActive(req, res) {
      try {
        const item = await Model.findById(req.params.id);

        if (!item) {
          return res.status(404).json({ message: `${modelName} không tồn tại` });
        }

        item.kich_hoat = !item.kich_hoat;
        await item.save();

        res.json(item);
      } catch (error) {
        console.error(`Error toggling ${modelName}:`, error);
        res.status(500).json({ message: `Lỗi khi thay đổi trạng thái ${modelName}`, error: error.message });
      }
    }
  };
};

// Export controllers cho từng entity
module.exports = {
  employmentStatus: createGenericController(EmploymentStatus, 'Trạng thái làm việc'),
  jobCategory: createGenericController(JobCategory, 'Danh mục công việc'),
  nationality: createGenericController(Nationality, 'Quốc tịch'),
  skill: createGenericController(Skill, 'Kỹ năng'),
  educationLevel: createGenericController(EducationLevel, 'Trình độ học vấn'),
  language: createGenericController(Language, 'Ngôn ngữ')
};

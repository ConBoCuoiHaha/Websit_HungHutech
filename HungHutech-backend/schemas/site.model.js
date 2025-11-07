const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    siteId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // longitude
              coords[1] >= -90 &&
              coords[1] <= 90 // latitude
            );
          },
          message: 'Tọa độ không hợp lệ. Longitude: -180 đến 180, Latitude: -90 đến 90',
        },
      },
    },
    radius: {
      type: Number,
      required: true,
      min: [10, 'Bán kính tối thiểu là 10m'],
      max: [1000, 'Bán kính tối đa là 1000m'],
      default: 150,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    da_xoa: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'sites',
  }
);

// Geospatial index for location-based queries
siteSchema.index({ location: '2dsphere' });
siteSchema.index({ siteId: 1 }, { unique: true });
siteSchema.index({ isActive: 1, da_xoa: 1 });

// Virtual để lấy longitude/latitude riêng biệt
siteSchema.virtual('longitude').get(function () {
  return this.location.coordinates[0];
});

siteSchema.virtual('latitude').get(function () {
  return this.location.coordinates[1];
});

// Đảm bảo virtuals được serialize
siteSchema.set('toJSON', { virtuals: true });
siteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Site', siteSchema);

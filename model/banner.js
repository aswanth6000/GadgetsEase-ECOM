const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,
  image_url: String,
  link_url: String,
  position: String,
  is_active: Boolean,
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;

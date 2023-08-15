const cloudinary = require("cloudinary");
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const MultiUploadCloudinary = async (files, folder) => {
  try {
      const uploadedImages = [];
      for (const file of files) {
          const { path } = file;
          const result = await uploadToCloudinary(path, folder); 
          if (result.url) {
              uploadedImages.push(result.url);
          }
      }
      return uploadedImages;
  } catch (error) {
      throw error; // Rethrow the error to handle it in the calling function if needed
  }
}

const uploadToCloudinary = async (path, folder) => {
  try {
    const data = await cloudinary.v2.uploader.upload(path, { folder });
    const secureUrl = data.secure_url;
    const publicid = data.public_id
    return { url: secureUrl, public_id: publicid};
  } catch (error) {
    console.log(error);
  }
};
const removeFromCloudinary = async (public_id) => {
  await cloudinary.v2.uploader.destroy(public_id, (error, result) => {
    console.log(result, error);
  });
};

module.exports = {uploadToCloudinary,removeFromCloudinary,MultiUploadCloudinary };
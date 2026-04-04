const Imagekit = require("imagekit");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const imagekit = new Imagekit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "test_public_key",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "test_private_key",
  urlEndpoint:
    process.env.IMAGEKIT_URL_ENDPOINT || "https://test_imagekit_endpoint.com/",
});

const uploadImage = async (buffer, filename) => {
  if (!buffer) {
    throw new Error("No file buffer provided");
  }

  try {
    const response = await imagekit.upload({
      file: buffer,
      fileName: uuidv4() + path.extname(filename),
      folder: "super_nova",
    });

    return {
      url: response.url,
      thumbnail: response.thumbnailUrl || response.url,
      id: response.fileId,
    };
  } catch (error) {
    throw new Error("Imagekit upload failed");
  }
};

module.exports = { imagekit, uploadImage };

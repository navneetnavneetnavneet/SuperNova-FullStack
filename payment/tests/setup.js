const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.mock("ioredis", () => require("ioredis-mock"));

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "test_jwt_secret";
  process.env.JWT_EXPIRES_IN = "1d";
  process.env.RAZORPAY_KEY_ID = "test_key_id";
  process.env.RAZORPAY_KEY_SECRET = "test_key_secret";

  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const collection in collections) {
    await collections[collection].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});

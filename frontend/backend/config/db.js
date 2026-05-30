import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
  return mongoose.connection;
};

export default connectDB;

import { Document, model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUserInt extends Document {
  id: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  hash: string;
  twofa: boolean;
  encryptPassword: (password: string) => Promise<string>;
  comparePassword: (password: string) => Promise<boolean>;
}

const userSchema: Schema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      unique: true,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    twofa: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.encryptPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function (
  password: string,
): Promise<Boolean> {
  return await bcrypt.compare(password, this.password);
};

export default model<IUserInt>('User', userSchema);

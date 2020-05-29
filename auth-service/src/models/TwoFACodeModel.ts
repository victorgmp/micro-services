import { model, Schema, Document } from 'mongoose';

import { CodeStatus } from '../enums/CodeStatus';

export interface ITwoFACodeInt extends Document {
  id: string;
  code: number;
  status: CodeStatus.ACTIVE | CodeStatus.DELETE;
  userId: string;
  createdAt: Date;
}

const twoFACodeSchema: Schema = new Schema(
  {
    code: {
      type: Number,
      unique: true,
      required: true,
    },
    status: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default model<ITwoFACodeInt>('TwoFACode', twoFACodeSchema);

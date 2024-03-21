const { Schema, model } = require("mongoose");
const ROLE = require("../config/roles");

// Define the User Schema
const UserSchema = new Schema(
  {
    // Personal Information
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    // Other non-essential fields
    age: {
      type: Number,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },

    // Account Information
    role: {
      type: String,
      default: ROLE.user,
      enum: [ROLE.user, ROLE.admin],
    },
    validated: {
      type: Boolean,
      default: false,
    },
    termsOfServiceAccepted: {
      type: Boolean,
      default: false,
      required: true,
    },
    privacyPolicyAccepted: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true } // Automatically add timestamps for createdAt and updatedAt
);

// Create and export the User model
const UserModel = model("User", UserSchema);
module.exports = UserModel;

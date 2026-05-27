import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true,
        },
         email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        },

        password: {
        type: String,
        required: function () {
            return this.authProvider === "email";
        },
        select: false,
        },

        profileImage: {
        type: String,
        default: "",
        },

        role: {
        type: String,
        enum: ["PATIENT", "DOCTOR"],
        required: true,
        },

        phone: {
        type: String,
        sparse: true,
        },

        authProvider: {
        type: String,
        enum: ["email", "google"],
        default: "email",
        },

        googleId: {
        type: String,
        sparse: true,
        },
  },
);

userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;

  this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.comparePassword = async function (pass) {
  return bcrypt.compare(pass, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.set("timestamps", true);
userSchema.set("versionKey", false);

export default mongoose.model("User", userSchema);
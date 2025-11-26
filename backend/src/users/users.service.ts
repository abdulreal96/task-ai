import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(fullName: string, email: string, password: string, colorScheme?: string, darkMode?: boolean): Promise<UserDocument> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user
    const user = new this.userModel({
      fullName,
      email,
      password: hashedPassword,
      colorScheme: colorScheme || 'blue',
      darkMode: darkMode || false,
      preferences: {},
      isEmailVerified: false,
      emailVerificationOTP: otp,
      emailVerificationOTPExpires: otpExpires,
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const hashedToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashedToken });
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user || !user.refreshToken) {
      return false;
    }
    return bcrypt.compare(refreshToken, user.refreshToken);
  }

  async updatePreferences(userId: string, preferences: any): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { preferences } },
      { new: true },
    );
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async updateColorScheme(userId: string, colorScheme: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { colorScheme },
      { new: true },
    );
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async updateDarkMode(userId: string, darkMode: boolean): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { darkMode },
      { new: true },
    );
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async verifyOTP(email: string, otp: string): Promise<UserDocument> {
    const user = await this.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new ConflictException('Email already verified');
    }

    if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
      throw new ConflictException('No OTP found for this user');
    }

    if (new Date() > user.emailVerificationOTPExpires) {
      throw new ConflictException('OTP expired');
    }

    if (user.emailVerificationOTP !== otp) {
      throw new ConflictException('Invalid OTP');
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    
    return user.save();
  }

  async regenerateOTP(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new ConflictException('Email already verified');
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = otpExpires;
    await user.save();

    return otp;
  }

  async generatePasswordResetOTP(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate new OTP for password reset
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = otpExpires;
    await user.save();

    return otp;
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<UserDocument> {
    const user = await this.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
      throw new ConflictException('No reset code found for this user');
    }

    if (new Date() > user.emailVerificationOTPExpires) {
      throw new ConflictException('Reset code expired');
    }

    if (user.emailVerificationOTP !== otp) {
      throw new ConflictException('Invalid reset code');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedPassword;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    
    return user.save();
  }
}

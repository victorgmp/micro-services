import * as _ from 'lodash';
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import { ServiceResources } from 'polymetis-node';

import MongoDBConnection from '../libs/MongoDBConnection';
import TwoFACodeService from './TwoFACodeService';
import User, { IUserInt } from '../models/UserModel';
import { IEmailData, ISMSData, IUser } from '../interfaces/';

interface ISuccessSignIn {
  user: IUser;
  token?: string;
}

export default class UserService {
  private db: MongoDBConnection;
  private twoFACodeService: TwoFACodeService;

  constructor(protected resources: ServiceResources) {
    this.db = new MongoDBConnection(resources);
    this.twoFACodeService = new TwoFACodeService(this.resources);
  }

  createToken(user: IUserInt) {
    const secretToken = process.env.JWT_SECRET;
    return jwt.sign({ id: user.id, email: user.email }, secretToken, {
      expiresIn: 86400,
    });
  }

  /**
   * Resgiter a new user in the database
   * @param email
   * @param username
   * @param password
   */
  async signUp(email: string, username: string, password: string): Promise<IUser> {
    try {
      await this.db.connect();
      // verify if the user already exists
      const user = await User.findOne({ email });
      if (user) {
        throw Error('The user already exists');
      }

      // create user hash
      let hash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      hash = crypto.createHash('md5').update(hash.toString()).digest('hex');

      let newUser = new User({ email, username, password, hash });
      // encrypt user password
      newUser.password = await newUser.encryptPassword(newUser.password);
      // add a new user
      newUser = await newUser.save();

      // data to send email
      const emailData: IEmailData = {
        from: 'victorgmp.developer@gmail.com',
        to: newUser.email,
        subject: 'My App - Welcome',
        body: 'Thanks to register!',
      };
      // emit an event to send a welcome email
      await this.resources.rabbit.emit('email.prepared', { emailData });

      emailData.body = `
      <body>
      Please open this link to verified your email:
      <a href="http://${process.env.CLIENT_BASE_URL}/email-verification?${email}&${hash}">Confirm email</a>
      </body>`;
      // emit an event to send a verification email
      await this.resources.rabbit.emit('email.prepared', { emailData });

      return this.toPublic(newUser);
    } catch (error) {
      this.resources.logger.error('AuthService::signUp', error);
      throw error;
    }
  }

  /**
  * user login
  * @param email
  * @param password
  */
  async signIn(email: string, password: string): Promise<ISuccessSignIn> {
    try {
      await this.db.connect();
      // verify if the user already exists
      const returnedUser = await User.findOne({ email });
      if (!returnedUser) {
        throw Error('The user does not exists');
      }

      const isMatch = await returnedUser.comparePassword(password);
      if (!isMatch) {
        throw Error('The email or password are incorrect');
      }

      const user = this.toPublic(returnedUser);
      const retval: ISuccessSignIn = {
        user,
      };
      if (returnedUser.twofa) {
        // deactive old codes
        await this.twoFACodeService.deactivateUserCode(returnedUser.id);
        // create a new one
        const twoFACode = await this.twoFACodeService.createUserCode(returnedUser.id);
        // print here code for debugging
        // this.resources.logger.debug('AuthService::2fa code', twoFACode.code);
        // data to send sms
        const smsData: ISMSData = {
          phone: returnedUser.phone,
          text: `Your code is ${twoFACode.code}`,
        };
        // emit an event to be send an email
        await this.resources.rabbit.emit('sms.prepared', { smsData });
      } else {
        const token: string = this.createToken(returnedUser);
        retval.token = token;
      }

      return retval;
    } catch (error) {
      this.resources.logger.error('AuthService::signIn', error);
      throw error;
    }
  }

  /**
  * user password change
  * @param email
  * @param password
  * @param newPassword
  */
  async changePassword(email: string, password: string, newPassword: string): Promise<{ user: IUser, isUpdated: boolean }> {
    try {
      await this.db.connect();
      // verify if the user already exists
      const returnedUser = await User.findOne({ email });
      if (!returnedUser) {
        throw Error('The user does not exists');
      }

      const isMatch = await returnedUser.comparePassword(password);
      if (isMatch) {
        const updatePassword = await returnedUser.encryptPassword(newPassword);
        const isUpdated = await User.updateOne(
          { _id: returnedUser.id },
          { password: updatePassword },
        );

        if (!!isUpdated.ok) {
          const user = this.toPublic(returnedUser);
          return { user, isUpdated: true };
        }
      }

      throw Error('The email or password are incorrect');

    } catch (error) {
      this.resources.logger.error('AuthService::changePassword', error);
      throw error;
    }

  }

  // async getOneById(id: string): Promise<IUser> {
  //   try {
  //     await this.db.connect();

  //     const user: IUserInt = await User.findById(id);

  //     if (_.isNil(user)) {
  //       throw Error('User not found');
  //     }

  //     return this.toPublic(user);
  //   } catch (error) {
  //     this.resources.logger.error('AuthService::getOneById', error);
  //     throw error;
  //   }
  // }

  /**
  * Two factor authentication login
  * @param userId
  * @param code
  */
  async twoFASignIn(userId: string, code: number): Promise<ISuccessSignIn> {
    try {
      await this.db.connect();
      // verify if the user and code are valids
      const isValid = await this.twoFACodeService.validateUserCode(userId, code);
      if (!isValid) {
        throw Error('Invalid code!');
      }

      const returnedUser = await User.findOne({ _id: userId });
      const token: string = this.createToken(returnedUser);
      const user = this.toPublic(returnedUser);
      // deactivate code
      await this.twoFACodeService.deactivateUserCode(returnedUser.id);

      return { user, token };
    } catch (error) {
      this.resources.logger.error('AuthService::signIn', error);
      throw error;
    }
  }

  /**
  * Update user profile
  * @param userId
  * @param token
  */
  async updateProfile(userId: string, token: string) {
    try {
      await this.db.connect();
      // verify if the user already exists
      const user = await User.findById(userId);
      // const returnedUser = await User.findOne({ email });
      if (_.isNil(user)) {
        throw Error('User not found');
      }

      return user;
    } catch (error) {
      this.resources.logger.error('AuthService::updateProfile', error);
      throw error;
    }
  }

  /**
  * Update user profile
  * @param userId
  * @param token
  */
  async verifyUserEmail(email: string, hash: string): Promise<{ user: IUser, isVerified: boolean }> {
    try {
      await this.db.connect();
      // verify if the user already exists
      const returnedUser = await User.findOne({ email });
      if (!returnedUser) {
        throw Error('The user does not exists');
      }

      let isMatch = false;
      if (returnedUser.email === email && returnedUser.hash === hash) {
        isMatch = true;

        const isUpdated = await User.updateOne(
          { _id: returnedUser.id },
          { verified: true },
        );

        if (!!isUpdated.ok) {
          const user = this.toPublic(returnedUser);
          return { user, isVerified: true };
        }
      }

      throw Error('The email or hash are invalids');
    } catch (error) {
      this.resources.logger.error('AuthService::verifyUser', error);
      throw error;
    }
  }

  private toPublic(user: IUserInt): IUser {
    if (_.isNil(user)) {
      throw Error('Wrong object');
    }
    return {
      id: user.id,
      username: user.username,
    };
  }

}
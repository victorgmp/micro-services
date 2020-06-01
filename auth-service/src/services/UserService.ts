import * as _ from 'lodash';
import jwt from 'jsonwebtoken';
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

      let newUser = new User({ email, username, password });
      newUser.password = await newUser.encryptPassword(newUser.password);
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

      return this.toPublic(newUser);
    } catch (error) {
      this.resources.logger.error('AuthService::signUp', error);
      throw error;
    }
  }

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

  async changePassword(email: string, password: string, newPassword: string): Promise<{ user: IUser, isUpdated: Boolean }> {
    try {
      await this.db.connect();
      // verify if the user already exists
      const returnedUser = await User.findOne({ email });
      if (!returnedUser) {
        throw Error('The user does not exists');
      }

      const isMatch = await returnedUser.comparePassword(password);
      if (isMatch) {
        returnedUser.password = await returnedUser.encryptPassword(newPassword);

        const isUpdated = await User.updateOne(
          { _id: returnedUser.id },
          { password: returnedUser.password },
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
      // await this.twoFACodeService.deactivateUserCode(returnedUser.id);

      return { user, token };
    } catch (error) {
      this.resources.logger.error('AuthService::signIn', error);
      throw error;
    }
  }

  async updateProfile(id: string, token: string) {
    try {
      await this.db.connect();
      // verify if the user already exists
      const user = await User.findById(id);
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
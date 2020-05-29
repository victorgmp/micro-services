import * as _ from 'lodash';
import { ServiceResources } from 'polymetis-node';

import MongoDBConnection from '../libs/MongoDBConnection';

// import UserService from './UserService';
import TwoFACode, { ITwoFACodeInt } from '../models/TwoFACodeModel';
import { CodeStatus } from '../enums/CodeStatus';

export default class TwoFACodeService {
  private db: MongoDBConnection;
  // private userService: UserService;

  constructor(protected resources: ServiceResources) {
    this.db = new MongoDBConnection(resources);
    // this.userService = new UserService(this.resources);
  }

  async createUserCode(userId: string): Promise<ITwoFACodeInt> {
    try {
      await this.db.connect();
      // verify if the user already exists
      // const user = await this.userService.getOneById(userId);
      // console.log(user);
      // if (!user) {
      //   throw Error('The user does not exists');
      // }
      const code = Math.floor(100000 + Math.random() * 900000);
      const status = CodeStatus.ACTIVE;

      const code2FA = new TwoFACode({ code, status, userId });
      return await code2FA.save();
    } catch (error) {
      this.resources.logger.error('TwoFACodeService::createUserCode', error);
      throw error;
    }
  }

  async deactivateUserCode(userId: string): Promise<void> {
    try {
      await this.db.connect();

      await TwoFACode.updateMany(
        { userId },
        { status: CodeStatus.DELETE },
      );
    } catch (error) {
      this.resources.logger.error('TwoFACodeService::deactivateUserCode', error);
      throw error;
    }
  }

  async validateUserCode(userId: string, code: number): Promise<boolean> {
    try {
      await this.db.connect();
      const validatedCode = await TwoFACode.findOne(
        { userId, code , status: CodeStatus.ACTIVE },
      );

      if (!validatedCode) {
        return false;
      }
      return true;
    } catch (error) {
      this.resources.logger.error('TwoFACodeService::validateUserCode', error);
      throw error;
    }
  }

  // private toPublic(userCode: ITwoFACodeInt): ITwoFACode {
  //   if (_.isNil(userCode)) {
  //     throw Error('Wrong object');
  //   }
  //   return {
  //     userId: userCode.userId,
  //     code: userCode.code,
  //   };
  // }

}

import * as _ from 'lodash';
import {
  Request,
  Response,
  RouteHandlerBase,
  ServiceResources,
  RouteBaseTrustedMethods,
} from 'polymetis-node';

import UserService from '../../services/UserService';
import { IUserInt } from '../../models/UserModel';

export default class RouteHandlerBaseImp extends RouteHandlerBase {
  public method: RouteBaseTrustedMethods = 'post';
  public url: string = '/update-profile';
  protected userService: UserService;

  constructor(resources: ServiceResources) {
    super(resources);
    this.userService = new UserService(this.resources);
  }

  public async callback(req: Request, res: Response): Promise<any> {
    if (!req.body.userId) {
      return res
        .status(400)
        .json({ msg: 'Please. Send your id' });
    }

    const response = await this.userService.updateProfile(
      req.body.userId,
      req.body.email,
    );

    console.log(response);
    // if (!!response) {
    //   this.emitEvent('user.changed-password', { response });
    //   return res.status(200).json({ response });
    // }
    return res.status(400).json({ msg: 'The id is incorrect' });
  }
}
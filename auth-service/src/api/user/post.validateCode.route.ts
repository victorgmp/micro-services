import * as _ from 'lodash';
import {
  Request,
  Response,
  RouteHandlerBase,
  ServiceResources,
  RouteBaseTrustedMethods,
} from 'polymetis-node';

import UserService from '../../services/UserService';

export default class RouteHandlerBaseImp extends RouteHandlerBase {
  public method: RouteBaseTrustedMethods = 'post';
  public url: string = '/validate-code';
  protected userService: UserService;

  constructor(resources: ServiceResources) {
    super(resources);
    this.userService = new UserService(this.resources);
  }

  public async callback(req: Request, res: Response): Promise<any> {
    if (!req.body.userId || !req.body.code) {
      return res
        .status(400)
        .json({ msg: 'Please. Send your email and password' });
    }

    const response = await this.userService.twoFASignIn(
      req.body.userId,
      req.body.code,
    );

    if (response) {
      this.emitEvent('user.signed-in', { response });
      return res.status(200).json({ response });
    }

    return res.status(400).json({ msg: 'Invalid code!' });
  }
}
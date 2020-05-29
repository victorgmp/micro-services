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
  public url: string = '/change-password';
  protected userService: UserService;

  constructor(resources: ServiceResources) {
    super(resources);
    this.userService = new UserService(this.resources);
  }

  public async callback(req: Request, res: Response): Promise<any> {
    if (!req.body.email || !req.body.password || !req.body.newPassword) {
      return res
        .status(400)
        .json({ msg: 'Please. Send your email and password' });
    }

    const response = await this.userService.changePassword(
      req.body.email,
      req.body.password,
      req.body.newPassword,
    );

    if (!!response) {
      this.emitEvent('user.changed-password', { response });
      return res.status(200).json({ response });
    }
    return res.status(400).json({ msg: 'The email or password are incorrect' });
  }
}
import * as _ from 'lodash';
import {
  Request,
  Response,
  RouteBaseTrustedMethods,
  RouteHandlerBase,
  ServiceResources,
} from 'polymetis-node';

import UserService from '../../services/UserService';

export default class RouteHandlerBaseImp extends RouteHandlerBase {
  public method: RouteBaseTrustedMethods = 'post';
  public url: string = '/signup';
  protected userService: UserService;

  constructor(resources: ServiceResources) {
    super(resources);
    this.userService = new UserService(this.resources);
  }

  public async callback(req: Request, res: Response): Promise<any> {
    if (!req.body.email || !req.body.username || !req.body.password) {
      return res
        .status(400)
        .json({ msg: 'Please. Send your email and password' });
    }

    const user = await this.userService.signUp(
      req.body.email,
      req.body.username,
      req.body.password,
    );

    if (user) {
      this.emitEvent('user.signed-up', { user });
      return res.status(201).json(user);
    }
    return res.status(400).json({ msg: 'The user already exists' });
  }
}
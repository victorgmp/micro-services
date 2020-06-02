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
  public url: string = '/email-verification';
  protected userService: UserService;

  constructor(resources: ServiceResources) {
    super(resources);
    this.userService = new UserService(this.resources);
  }

  public async callback(req: Request, res: Response): Promise<any> {
    if (!req.body.email || !req.body.hash) {
      return res
        .status(400)
        .json({ msg: 'Please. Send the correct data' });
    }

    const response = await this.userService.verifyUserEmail(
      req.body.email,
      req.body.hash,
    );

    if (response) {
      // email verified event emitted
      this.emitEvent('user.changed-password', { response });
      return res.status(200).json({ response });
    }
    return res.status(400).json({ msg: 'The email or password are incorrect' });
  }
}
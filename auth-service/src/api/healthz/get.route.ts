import * as _ from 'lodash';
import {
  Request,
  Response,
  RouteHandlerBase,
  ServiceResources,
  RouteBaseTrustedMethods,
} from 'polymetis-node';

export default class RouteHandlerBaseImpl extends RouteHandlerBase {
  public method: RouteBaseTrustedMethods = 'post';
  public url: string = '/healthz';

  constructor(resources: ServiceResources) {
    super(resources);
  }

  public async callback(req: Request, res: Response): Promise<any> {
    await this.emitTask('check.healthz', {});

    res.status(200).send('ok');
  }
}
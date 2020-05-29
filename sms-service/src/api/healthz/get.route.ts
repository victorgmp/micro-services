import * as _ from 'lodash';
import {
  Request,
  Response,
  RouteHandlerBase,
  RouteBaseTrustedMethods,
  ServiceResources,
} from 'polymetis-node';

export default class ApiRouteImpl extends RouteHandlerBase {
  public method: RouteBaseTrustedMethods = 'get';
  public url: string = '/healthz';

  constructor(resources: ServiceResources) {
    super(resources);
  }

  public async callback(req: Request, res: Response): Promise<any> {
    await this.emitTask('check.healthz', {});

    res.status(200).send('ok');
  }
}
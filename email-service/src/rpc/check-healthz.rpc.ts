import * as _ from 'lodash';
import { ServiceResources, RPCHandlerBase } from 'polymetis-node';

export default class Handler extends RPCHandlerBase {
  public topic = 'check-healthz';

  constructor(resources: ServiceResources) {
    super(resources);
  }

  protected async handleCallback(data: any): Promise<any> {
    return 'Im ok!';
  }
}

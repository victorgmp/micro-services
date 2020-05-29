import * as _ from 'lodash';
import {
  ServiceResources,
  TaskHandlerBase,
} from 'polymetis-node';

import { ISMSData } from '../../interfaces';

export default class Handler extends TaskHandlerBase {
  public topic = 'send.sms';

  constructor(resources: ServiceResources) {
    super(resources);
  }

  protected async handleCallback(data: any): Promise<void> {
    const smsData: ISMSData = _.get(data, 'smsData');

    this.resources.logger.info('SMS sended', smsData);
  }
}
import * as _ from 'lodash';
import {
  EventHandlerBase,
  ServiceResources,
} from 'polymetis-node';

import { ISMSData } from '../../interfaces';

export default class Handler extends EventHandlerBase {
  public topic = 'sms.prepared';

  constructor(resources: ServiceResources) {
    super(resources);
  }

  protected async handleCallback(data: any): Promise<void> {
    const smsData: ISMSData = _.get(data, 'smsData');

    if (
      !smsData
      || !smsData.phone
      || !smsData.text
    ) {
      throw Error('Wrong payload');
    }

    await this.emitTask('send.sms', { smsData });
  }
}
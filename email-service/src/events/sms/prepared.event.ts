import * as _ from 'lodash';
import {
  EventHandlerBase,
  ServiceResources,
} from 'polymetis-node';

import { IEmailData } from '../../interfaces';

export default class Handler extends EventHandlerBase {
  public topic = 'email.prepared';

  constructor(resources: ServiceResources) {
    super(resources);
  }

  protected async handleCallback(data: any): Promise<void> {
    const emailData: IEmailData = _.get(data, 'emailData');

    if (
      !emailData
      || !emailData.from
      || !emailData.to
      || !emailData.subject
      || !emailData.text
    ) {
      throw Error('Wrong payload');
    }

    await this.emitTask('send.email', { emailData });
  }
}
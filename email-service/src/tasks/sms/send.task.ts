import * as _ from 'lodash';
import {
  ServiceResources,
  TaskHandlerBase,
} from 'polymetis-node';

import { IEmailData } from '../../interfaces';
import EmailService from '../../services/EmailService';

export default class Handler extends TaskHandlerBase {
  private emailService: EmailService;
  public topic = 'send.email';

  constructor(resources: ServiceResources) {
    super(resources);
    this.emailService = new EmailService(this.resources);
  }

  protected async handleCallback(data: any): Promise<void> {
    const smsData: IEmailData = _.get(data, 'smsData');

    this.resources.logger.info('Sending sms...');
    this.emailService.sendEmail(smsData);
  }
}
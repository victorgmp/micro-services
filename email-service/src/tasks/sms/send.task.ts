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
    const emailData: IEmailData = _.get(data, 'emailData');

    this.resources.logger.info('Sending email...');
    this.emailService.sendEmail(emailData);
  }
}
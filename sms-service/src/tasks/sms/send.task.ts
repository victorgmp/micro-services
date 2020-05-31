import * as _ from 'lodash';
import {
  ServiceResources,
  TaskHandlerBase,
} from 'polymetis-node';

import { ISMSData } from '../../interfaces';
import SMSService from '../../services/SMSService';

export default class Handler extends TaskHandlerBase {
  private smsService: SMSService;
  public topic = 'send.sms';

  constructor(resources: ServiceResources) {
    super(resources);
    this.smsService = new SMSService(this.resources);
  }

  protected async handleCallback(data: any): Promise<void> {
    const smsData: ISMSData = _.get(data, 'smsData');

    this.resources.logger.info('Sending sms...');
    this.smsService.sendSMS(smsData);
  }
}
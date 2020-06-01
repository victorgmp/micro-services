import * as _ from 'lodash';
import * as fs from 'fs';

import { ServiceResources } from 'polymetis-node';

import { ISMSData } from '../interfaces';

export default class SMSService {

  constructor(protected resources: ServiceResources) {
  }

  /**
   * send message to the user
   * @param data
   */
  async sendSMS(data: ISMSData) {
    try {
      // check the enviroment
      if (this.resources.configuration.service.environment === 'local') {
        const today = new Date();
        const todayString = today.toISOString();
        const smsPath = `${todayString}.sms.txt`;

        const smsContent = `
        to: ${data.phone} \n
        body: ${data.text} \n
        `;

        fs.writeFile(smsPath, smsContent, (error) => {
          if (error) {
            this.resources.logger.error(`could not save the file: ${smsPath}`, error);
          } else {
            this.resources.logger.info(`message created: ${smsPath}`);
          }
        });

      } else {
        // put here the code to send message a true message
      }

      // informational event
      await this.resources.rabbit.emit('sms.sent', { data: data.phone });

    } catch (error) {
      this.resources.logger.error('SMSService::sendSMS', error);
      throw error;
    }
  }

}
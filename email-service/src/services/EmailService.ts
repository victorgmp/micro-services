import * as _ from 'lodash';
import * as fs from 'fs';

import { ServiceResources } from 'polymetis-node';

import { IEmailData } from '../interfaces';

export default class EmailService {

  constructor(protected resources: ServiceResources) {
  }

  /**
   * send message to the user
   * @param data
   */
  async sendEmail(data: IEmailData) {
    try {
      // check the enviroment
      if (this.resources.configuration.service.environment === 'local') {
        const today = new Date();
        const todayString = today.toISOString();
        const emailPath = `${todayString}.email.txt`;

        const emailContent = `
        from: ${data.from} \n
        to: ${data.to} \n
        to: ${data.subject} \n
        body: ${data.body} \n
        `;

        fs.writeFile(emailPath, emailContent, (error) => {
          if (error) {
            this.resources.logger.error(`could not save the email file: ${emailPath}`, error);
          } else {
            this.resources.logger.info(`email created: ${emailPath}`);
          }
        });

      } else {
        // put here the code to send message a true message
      }

      // informational event
      await this.resources.rabbit.emit('email.sent', { data: data.to });

    } catch (error) {
      this.resources.logger.error('EmailService::sendEmail', error);
      throw error;
    }
  }

}
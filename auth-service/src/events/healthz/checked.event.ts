import * as _ from 'lodash';
import {
  EventHandlerBase,
  ServiceResources,
} from 'polymetis-node';

export default class Handler extends EventHandlerBase {
  public topic = 'healthz.checked';

  constructor(resources: ServiceResources) {
    super(resources);
  }

  protected async handleCallback(data: any): Promise<void> {
    const service: string | null = _.get(data, 'service', null);

    if (!service) {
      this.resources.logger.warn(this.topic, 'Wrong payload');
    }

    if (service === this.resources.configuration.service.service) {
      // handle own service healthz check
      // ...
      return;
    }

    // handle other service healthz check
    this.resources.logger.info('healthz check:', service);
    // ...
    return;
  }
}
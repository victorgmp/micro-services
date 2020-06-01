import { ServiceBase, Configuration } from 'polymetis-node';

// Initializing service
const configuration: Configuration = {
  baseDir: __dirname,
};

const service = new ServiceBase({ configuration });

service.init()
  .then(async () => {
    await service.initTasks();
    await service.initEvents();
    await service.initRPCs();
    await service.initAPI();

    service.logger.info('Service online on pid', process.pid);
  })
  .catch((error: any) => {
    service.logger.error('Exiting', error);
  });

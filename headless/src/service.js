// MAIN APP SERVICE
import AppService from '../../service/index';

const opts = {
  isProduction: process.env.NODE_ENV == 'production'
};

const Service = new AppService(opts);

Service.start();
import Promise from 'bluebird';
import Log from 'logfilename';
import {Publisher} from 'rabbitmq-pubsub';

import PassportAuth from './PassportAuth';

// Api
import MeApi from './api/MeApi';
import UserApi from './api/UserApi';

// Http Controller
import UserHttpController from './controllers/UserHttpController';
import MeHttpController from './controllers/MeHttpController';
import AuthenticationHttpController from './controllers/AuthenticationHttpController';

// Routes
import AuthenticationRoutes from './routes/AuthenticationRoutes';
import UsersRoutes from './routes/UsersRoutes';
import MeRoutes from './routes/MeRoutes';

// Jobs
import MailJob from './jobs/MailJob';

let log = new Log(__filename);

const publisherOption = { exchange: "user" };

export default class UserPlugin {
  constructor(app){
    log.debug("UserPlugin");
    this.app = app;
    this.auth = setupAuthentication(app);

    this.publisherUser = new Publisher(publisherOption);

    this.api = {
      me: new MeApi(app),
      user: new UserApi(app)
    };

    this.controllers = {
      user: new UserHttpController(app, this.api.user),
      me: new MeHttpController(app, this.api.me),
      authentication: new AuthenticationHttpController(app, this.publisherUser)
    };

    this.routers = {
      users: UsersRoutes(app, this.auth, this.controllers.user),
      me: MeRoutes(app, this.auth, this.controllers.me),
      authentication: AuthenticationRoutes(app, this.auth, this.controllers.authentication)
    };

    this._models = app.data.sequelize.models;

    this.jobs = {
      mail: new MailJob(app)
    };

    this.startStop = [this.jobs.mail, this.publisherUser];
  }

  async start(){
    log.info("start");
    await Promise.each(this.startStop, obj => obj.start(this.app));
    log.info("started");
  }

  async stop(){
    log.info("stop");
    await Promise.each(this.startStop, obj => obj.stop(this.app))
    log.info("stopped");
  }

  seedDefault(){
    let seedDefaultFns = [
      this._models.Group.seedDefault,
      this._models.User.seedDefault,
      this._models.Permission.seedDefault,
      this._models.GroupPermission.seedDefault
    ];
    return Promise.each(seedDefaultFns, fn => fn());
  }

  async isSeeded() {
    let count = await this._models.User.count();
    log.debug("#users ", count);
    return count;
  }

  registerRouter(server) {
    server.use('/api/v1/auth', this.routers.authentication);
    server.use('/api/v1/', this.auth.ensureAuthenticated, this.routers.users);
    server.use('/api/v1/', this.auth.ensureAuthenticated, this.routers.me);
  }
}

function setupAuthentication(app) {
  let auth = new PassportAuth(app);
  app.auth = auth;
  return auth;
}
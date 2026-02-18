import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  PORT: Joi.number().port().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  AUTH0_DOMAIN: Joi.string().required(),

  AUTH0_ISSUER: Joi.string()
    .uri()
    .regex(/\/$/)
    .message('"AUTH0_ISSUER" must end with a trailing slash')
    .required(),

  AUTH0_AUDIENCE: Joi.string().required(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
});

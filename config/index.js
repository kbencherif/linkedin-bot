import dotenv from 'dotenv';

dotenv.config();

const env = {
    bot_email: process.env.BOT_EMAIL,
    bot_password: process.env.BOT_PASSWORD,
};

export {
  env
}

import dotenv from 'dotenv';

dotenv.config();

const env = {
    url: process.env.URL,
    bot_email: process.env.BOT_EMAIL,
    bot_password: process.env.BOT_PASSWORD,
};

export { env };

import redis from 'redis';
import { promisify } from 'util';

export const client = redis.createClient();

export const saddAsync = promisify(client.sadd).bind(client);
export const smembersAsync = promisify(client.smembers).bind(client);

client.on('error', (err) => {
  console.log('Error ' + err);
});

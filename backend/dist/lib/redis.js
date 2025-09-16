"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = exports.redis = void 0;
const redis_1 = require("redis");
const globalForRedis = globalThis;
exports.redis = globalForRedis.redis ?? (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
if (process.env.NODE_ENV !== 'production')
    globalForRedis.redis = exports.redis;
exports.redis.on('error', (err) => console.log('Redis Client Error', err));
exports.redis.on('connect', () => console.log('Redis Client Connected'));
const connectRedis = async () => {
    if (!exports.redis.isOpen) {
        await exports.redis.connect();
    }
};
exports.connectRedis = connectRedis;
//# sourceMappingURL=redis.js.map